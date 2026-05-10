/**
 * API Coffre-fort de documents (B2 — coffreFortSante, HDS).
 *
 * GET  /api/family/children/[id]/documents
 *      → liste les documents d'un enfant (vue parent : ses documents OU
 *        les documents partagés avec lui).
 *
 * POST /api/family/children/[id]/documents       (multipart/form-data)
 *      Champs attendus : file, doc_type, doc_subtype?, title, description?,
 *                        issued_at?, expires_at?, issuer_name?, tags? (CSV).
 *      Upload binaire dans le bucket privé `health-vault-documents`,
 *      puis insert métadonnées + audit log (action='create').
 *
 * Sécurité : feature flag, auth, vérification que l'enfant appartient à
 *            l'utilisateur (côté public.*) AVANT toute écriture côté health.*.
 *            RLS Postgres en plus.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { FEATURES } from '@/lib/feature-flags';
import {
  createServerSupabasePublic,
  createServerSupabaseHealth,
} from '@/lib/supabase-server-helpers';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  STORAGE_BUCKET,
  buildStoragePath,
  isAllowedMime,
  parseDocumentMetadataPayload,
  type DocumentMetadataPayload,
} from '@/lib/family/coffre-fort';

export const dynamic = 'force-dynamic';

function notFoundJson() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}
function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

async function ensureChildOwnedByUser(
  supabase: ReturnType<typeof createServerSupabasePublic>,
  userId: string,
  childId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('child_profiles')
    .select('id, family_id, family_profiles:family_id (user_id)')
    .eq('id', childId)
    .maybeSingle();
  if (error || !data) return false;
  const fp = (data as any).family_profiles;
  const owner = Array.isArray(fp) ? fp[0]?.user_id : fp?.user_id;
  return owner === userId;
}

function clientIp(request: NextRequest): string | null {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip') ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURES.coffreFortSante) return notFoundJson();
  const { id: childId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  const owned = await ensureChildOwnedByUser(sbPublic, user.id, childId);
  if (!owned) {
    return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 });
  }

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_documents')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ documents: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURES.coffreFortSante) return notFoundJson();
  const { id: childId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  const owned = await ensureChildOwnedByUser(sbPublic, user.id, childId);
  if (!owned) {
    return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 });
  }

  // Parsing FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest('Requête multipart invalide');
  }

  const file = formData.get('file');
  if (!(file instanceof File)) return badRequest('Fichier manquant');

  // Validation taille (côté server, pas seulement client)
  if (file.size <= 0) return badRequest('Fichier vide');
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return badRequest('Fichier trop volumineux (10 Mo max).');
  }

  // Validation MIME (le navigateur peut mentir : on revérifie côté server)
  if (!isAllowedMime(file.type)) {
    return badRequest(
      `Format non supporté. Formats acceptés : ${ALLOWED_MIME_TYPES.join(', ')}.`
    );
  }

  // Métadonnées (champs FormData)
  const tagsRaw = formData.get('tags');
  const tags =
    typeof tagsRaw === 'string' && tagsRaw.trim().length > 0
      ? tagsRaw.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      : [];

  const metadataInput: Record<string, unknown> = {
    doc_type: formData.get('doc_type'),
    doc_subtype: formData.get('doc_subtype') ?? null,
    title: formData.get('title'),
    description: formData.get('description') ?? null,
    issued_at: formData.get('issued_at') ?? null,
    expires_at: formData.get('expires_at') ?? null,
    issuer_name: formData.get('issuer_name') ?? null,
    tags,
  };

  let parsed: DocumentMetadataPayload | null = null;
  try {
    parsed = parseDocumentMetadataPayload(metadataInput);
  } catch {
    parsed = null;
  }
  if (!parsed) return badRequest('Métadonnées invalides');

  // Construction du chemin storage user-scoped
  const docId = randomUUID();
  const storagePath = buildStoragePath({
    userId: user.id,
    childId,
    uuid: docId,
    filename: file.name,
    mime: file.type,
  });

  // Upload binaire — le client `health` partage l'auth de l'utilisateur,
  // donc les policies storage user-scoped (auth.uid() == foldername[1]) passent.
  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await sbHealth.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Insert métadonnées (RLS : user_id = auth.uid())
  const { data: insertedDoc, error: insertError } = await sbHealth
    .from('child_documents')
    .insert({
      id: docId,
      child_id: childId,
      user_id: user.id,
      doc_type: parsed.doc_type,
      doc_subtype: parsed.doc_subtype,
      title: parsed.title,
      description: parsed.description,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      issued_at: parsed.issued_at,
      expires_at: parsed.expires_at,
      issuer_name: parsed.issuer_name,
      tags: parsed.tags,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    // Best-effort cleanup binaire si l'insert métadonnées échoue
    await sbHealth.storage.from(STORAGE_BUCKET).remove([storagePath]).catch(() => undefined);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Audit log (best-effort, n'empêche pas la création si ça échoue)
  await sbHealth
    .from('child_document_access_log')
    .insert({
      document_id: docId,
      user_id: user.id,
      action: 'create',
      ip: clientIp(request),
      user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ document: insertedDoc }, { status: 201 });
}
