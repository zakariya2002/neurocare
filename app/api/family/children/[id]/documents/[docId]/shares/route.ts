/**
 * API Coffre-fort — partages d'un document avec un pro (B2 — coffreFortSante).
 *
 * GET  /api/family/children/[id]/documents/[docId]/shares
 *      → liste les partages actifs (parent uniquement).
 *      Joint le profil pro (display_name + email) pour l'UI.
 *
 * POST /api/family/children/[id]/documents/[docId]/shares
 *      Body : { shared_with_user_id, access_level: 'read'|'download', expires_at? }
 *      Crée un partage. La cible doit être un pro déjà collaborateur du dossier
 *      de l'enfant via `ppa_collaborations` (status='accepted'), ou
 *      l'utilisateur lui-même via le système de collaborations dossier complet.
 *      Audit log : action='share_grant'.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import {
  createServerSupabasePublic,
  createServerSupabaseHealth,
} from '@/lib/supabase-server-helpers';
import { parseSharePayload } from '@/lib/family/coffre-fort';

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

/**
 * Liste les pros déjà collaborateurs acceptés sur l'enfant — utile pour
 * l'UI (autocomplete du sélecteur de partage). Renvoie aussi le user_id du pro.
 */
async function fetchEligibleCollaborators(
  supabase: ReturnType<typeof createServerSupabasePublic>,
  childId: string
): Promise<Array<{ user_id: string; display_name: string | null; email: string | null }>> {
  const { data } = await supabase
    .from('ppa_collaborations')
    .select(`
      id,
      status,
      educator_profiles:invited_educator_id (
        id,
        first_name,
        last_name,
        user_id,
        users:user_id (email)
      )
    `)
    .eq('child_id', childId)
    .eq('status', 'accepted');
  const out: Array<{ user_id: string; display_name: string | null; email: string | null }> = [];
  for (const row of data ?? []) {
    const ep = (row as any).educator_profiles;
    const e = Array.isArray(ep) ? ep[0] : ep;
    if (!e?.user_id) continue;
    const u = e.users;
    const userRow = Array.isArray(u) ? u[0] : u;
    const display =
      [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || null;
    out.push({
      user_id: e.user_id,
      display_name: display,
      email: userRow?.email ?? null,
    });
  }
  return out;
}

function clientIp(request: NextRequest): string | null {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip') ?? null;
}

export async function GET(
  _request: NextRequest,
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
  const { data: shares, error } = await sbHealth
    .from('child_document_shares')
    .select('*')
    .eq('document_id', docId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Hydrater chaque partage avec le nom / email du destinataire.
  const recipientIds = Array.from(
    new Set(((shares ?? []) as Array<{ shared_with_user_id: string }>).map((s) => s.shared_with_user_id))
  );
  const recipientsMap = new Map<string, { display_name: string | null; email: string | null }>();

  if (recipientIds.length > 0) {
    // Lookup par educator_profiles ou family_profiles
    const { data: educators } = await sbPublic
      .from('educator_profiles')
      .select('user_id, first_name, last_name, users:user_id (email)')
      .in('user_id', recipientIds);
    for (const row of educators ?? []) {
      const r = row as any;
      const userRow = Array.isArray(r.users) ? r.users[0] : r.users;
      recipientsMap.set(r.user_id, {
        display_name:
          [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || null,
        email: userRow?.email ?? null,
      });
    }
  }

  const eligible = await fetchEligibleCollaborators(sbPublic, childId);

  const enrichedShares = (shares ?? []).map((s: any) => ({
    ...s,
    recipient: recipientsMap.get(s.shared_with_user_id) ?? null,
  }));

  return NextResponse.json({
    shares: enrichedShares,
    eligibleCollaborators: eligible,
  });
}

export async function POST(
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
  const parsed = parseSharePayload(body);
  if (!parsed) return badRequest('Payload de partage invalide');

  if (parsed.shared_with_user_id === user.id) {
    return badRequest('Vous ne pouvez pas vous partager un document à vous-même.');
  }

  // Vérifie que le doc existe et appartient bien à l'enfant courant
  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data: doc } = await sbHealth
    .from('child_documents')
    .select('id, child_id, user_id')
    .eq('id', docId)
    .eq('child_id', childId)
    .maybeSingle();
  if (!doc || (doc as any).user_id !== user.id) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  // Le destinataire doit être un pro déjà collaborateur du dossier (sécurité métier).
  const eligible = await fetchEligibleCollaborators(sbPublic, childId);
  const isEligible = eligible.some((c) => c.user_id === parsed.shared_with_user_id);
  if (!isEligible) {
    return NextResponse.json(
      {
        error:
          'Le destinataire doit d\'abord être invité au dossier de l\'enfant en tant que collaborateur.',
      },
      { status: 422 }
    );
  }

  // Upsert (un seul partage actif par couple doc + destinataire)
  const { data: share, error } = await sbHealth
    .from('child_document_shares')
    .upsert(
      {
        document_id: docId,
        shared_with_user_id: parsed.shared_with_user_id,
        access_level: parsed.access_level,
        granted_by: user.id,
        expires_at: parsed.expires_at,
      },
      { onConflict: 'document_id,shared_with_user_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await sbHealth
    .from('child_document_access_log')
    .insert({
      document_id: docId,
      user_id: user.id,
      action: 'share_grant',
      ip: clientIp(request),
      user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ share }, { status: 201 });
}
