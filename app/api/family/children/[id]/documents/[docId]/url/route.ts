/**
 * API Coffre-fort — génération d'une URL signée pour consulter ou télécharger
 * un document (B2 — coffreFortSante, HDS).
 *
 * GET /api/family/children/[id]/documents/[docId]/url?download=1
 *     → { signedUrl, expiresIn }
 *
 * Accès :
 *   - Parent propriétaire : toujours autorisé (lecture + download).
 *   - Pro destinataire d'un partage actif :
 *       - access_level='read'     → ?download=1 refusé.
 *       - access_level='download' → tout autorisé.
 *
 * Audit log : action='signed_url' systématique, plus 'view' / 'download'
 * selon le mode demandé.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import {
  createServerSupabasePublic,
  createServerSupabaseHealth,
} from '@/lib/supabase-server-helpers';
import { STORAGE_BUCKET } from '@/lib/family/coffre-fort';

export const dynamic = 'force-dynamic';

const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5 minutes

function notFoundJson() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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

interface DocAccess {
  doc: {
    id: string;
    storage_path: string;
    user_id: string;
    title: string;
    mime_type: string;
  };
  isOwner: boolean;
  /** Pour un pro, le niveau du partage actif. Null si propriétaire. */
  shareAccessLevel: 'read' | 'download' | null;
}

/**
 * Récupère le doc et établit le niveau d'accès de l'utilisateur courant.
 * Retourne null si pas d'accès.
 */
async function resolveDocAccess(
  sbHealth: ReturnType<typeof createServerSupabaseHealth>,
  userId: string,
  childId: string,
  docId: string
): Promise<DocAccess | null> {
  const { data: doc } = await sbHealth
    .from('child_documents')
    .select('id, storage_path, user_id, title, mime_type, child_id')
    .eq('id', docId)
    .maybeSingle();
  if (!doc) return null;
  if ((doc as any).child_id !== childId) return null;

  // Propriétaire ?
  if ((doc as any).user_id === userId) {
    return {
      doc: doc as any,
      isOwner: true,
      shareAccessLevel: null,
    };
  }

  // Pro avec partage actif ?
  const { data: share } = await sbHealth
    .from('child_document_shares')
    .select('access_level, expires_at')
    .eq('document_id', docId)
    .eq('shared_with_user_id', userId)
    .maybeSingle();
  if (!share) return null;

  const expiresAt = (share as any).expires_at as string | null;
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    return null;
  }

  return {
    doc: doc as any,
    isOwner: false,
    shareAccessLevel: (share as any).access_level,
  };
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

  const sbHealth = createServerSupabaseHealth({ cookieStore });

  const access = await resolveDocAccess(sbHealth, user.id, childId, docId);
  if (!access) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const wantDownload = searchParams.get('download') === '1';

  // Vérifie le niveau d'accès pour les pros
  if (!access.isOwner && wantDownload && access.shareAccessLevel !== 'download') {
    return NextResponse.json(
      { error: 'Téléchargement non autorisé : partage en lecture seule.' },
      { status: 403 }
    );
  }

  const signedUrlOptions = wantDownload
    ? { download: true as const }
    : undefined;

  const { data, error } = await sbHealth.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(access.doc.storage_path, SIGNED_URL_TTL_SECONDS, signedUrlOptions);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Erreur signed URL' },
      { status: 500 }
    );
  }

  // Audit : action générique + action métier
  await logAction(sbHealth, request, docId, user.id, 'signed_url');
  await logAction(
    sbHealth,
    request,
    docId,
    user.id,
    wantDownload ? 'download' : 'view'
  );

  return NextResponse.json({
    signedUrl: data.signedUrl,
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}
