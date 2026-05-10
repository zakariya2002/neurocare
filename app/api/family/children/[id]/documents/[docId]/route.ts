/**
 * API Coffre-fort — opérations sur un document précis (B2 — coffreFortSante).
 *
 * GET    /api/family/children/[id]/documents/[docId]
 *        Récupère un document (parent propriétaire uniquement ici — les pros
 *        passent par les routes "shares" / "url"). Audit log : action='view'.
 *
 * PATCH  /api/family/children/[id]/documents/[docId]
 *        Mise à jour des métadonnées (titre, description, dates, tags...).
 *        Audit log : action='update'. Le binaire et le doc_type ne changent pas
 *        (il faudrait re-uploader pour ça, choix MVP).
 *
 * DELETE /api/family/children/[id]/documents/[docId]
 *        Supprime le binaire du bucket + la ligne en BDD + les partages liés.
 *        Audit log : action='delete'.
 *
 * Sécurité : feature flag, auth, vérification que l'enfant appartient à
 *            l'utilisateur. RLS Postgres en plus.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import {
  createServerSupabasePublic,
  createServerSupabaseHealth,
} from '@/lib/supabase-server-helpers';
import {
  STORAGE_BUCKET,
  parseDocumentMetadataPayload,
  TITLE_MAX,
  DESCRIPTION_MAX,
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

async function logAction(
  sbHealth: ReturnType<typeof createServerSupabaseHealth>,
  request: NextRequest,
  documentId: string,
  userId: string,
  action: string
): Promise<void> {
  await sbHealth
    .from('child_document_access_log')
    .insert({
      document_id: documentId,
      user_id: userId,
      action,
      ip: clientIp(request),
      user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    })
    .then(() => undefined, () => undefined);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  if (!FEATURES.coffreFortSante) return notFoundJson();
  const { id: childId, docId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  const owned = await ensureChildOwnedByUser(sbPublic, user.id, childId);
  if (!owned) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_documents')
    .select('*')
    .eq('id', docId)
    .eq('child_id', childId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });

  await logAction(sbHealth, request, docId, user.id, 'view');

  return NextResponse.json({ document: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  if (!FEATURES.coffreFortSante) return notFoundJson();
  const { id: childId, docId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  const owned = await ensureChildOwnedByUser(sbPublic, user.id, childId);
  if (!owned) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('JSON invalide');
  }
  const parsed = parseDocumentMetadataPayload(body);
  if (!parsed) return badRequest('Métadonnées invalides');

  // On vérifie aussi explicitement les longueurs (déjà couvert par parser, mais double-belt)
  if (parsed.title.length > TITLE_MAX) return badRequest('Titre trop long');
  if (parsed.description && parsed.description.length > DESCRIPTION_MAX) {
    return badRequest('Description trop longue');
  }

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_documents')
    .update({
      doc_type: parsed.doc_type,
      doc_subtype: parsed.doc_subtype,
      title: parsed.title,
      description: parsed.description,
      issued_at: parsed.issued_at,
      expires_at: parsed.expires_at,
      issuer_name: parsed.issuer_name,
      tags: parsed.tags,
    })
    .eq('id', docId)
    .eq('child_id', childId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });

  await logAction(sbHealth, request, docId, user.id, 'update');

  return NextResponse.json({ document: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  if (!FEATURES.coffreFortSante) return notFoundJson();
  const { id: childId, docId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  const owned = await ensureChildOwnedByUser(sbPublic, user.id, childId);
  if (!owned) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });

  const sbHealth = createServerSupabaseHealth({ cookieStore });

  // Récupérer le document pour avoir le storage_path
  const { data: doc, error: fetchError } = await sbHealth
    .from('child_documents')
    .select('id, storage_path')
    .eq('id', docId)
    .eq('child_id', childId)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });

  // Audit AVANT delete pour ne pas perdre la trace (la FK logique pointe vers
  // un id qui va disparaître, mais on garde une trace timestampée).
  await logAction(sbHealth, request, docId, user.id, 'delete');

  // Supprimer les partages liés (RLS : granted_by = auth.uid())
  await sbHealth
    .from('child_document_shares')
    .delete()
    .eq('document_id', docId)
    .then(() => undefined, () => undefined);

  // Supprimer la ligne (cela bloque toute lecture future via RLS partage)
  const { error: deleteError } = await sbHealth
    .from('child_documents')
    .delete()
    .eq('id', docId)
    .eq('child_id', childId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Supprimer le binaire (best-effort)
  await sbHealth.storage
    .from(STORAGE_BUCKET)
    .remove([(doc as any).storage_path])
    .then(() => undefined, () => undefined);

  return NextResponse.json({ ok: true });
}
