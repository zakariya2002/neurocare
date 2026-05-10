/**
 * API Coffre-fort — historique d'activité (audit log) d'un document.
 *
 * GET /api/family/children/[id]/documents/[docId]/log
 *     → liste des accès / actions sur le document, ordonnée du plus récent
 *       au plus ancien (limité aux 100 dernières entrées).
 *
 * Sécurité : feature flag, auth, accès au document (propriétaire ici — les
 *            pros ne voient pas l'audit log).
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import {
  createServerSupabasePublic,
  createServerSupabaseHealth,
} from '@/lib/supabase-server-helpers';

export const dynamic = 'force-dynamic';

function notFoundJson() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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

  // Confirme que le doc existe et appartient bien à l'enfant
  const { data: doc } = await sbHealth
    .from('child_documents')
    .select('id')
    .eq('id', docId)
    .eq('child_id', childId)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });

  const { data: entries, error } = await sbHealth
    .from('child_document_access_log')
    .select('*')
    .eq('document_id', docId)
    .order('occurred_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Hydrater par display_name (si profile educator/family disponible)
  const userIds = Array.from(
    new Set(((entries ?? []) as Array<{ user_id: string }>).map((e) => e.user_id))
  );
  const namesMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: educators } = await sbPublic
      .from('educator_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds);
    for (const e of educators ?? []) {
      const r = e as any;
      const display =
        [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || null;
      if (display) namesMap.set(r.user_id, display);
    }
    const { data: families } = await sbPublic
      .from('family_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds);
    for (const f of families ?? []) {
      const r = f as any;
      if (namesMap.has(r.user_id)) continue;
      const display =
        [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || null;
      if (display) namesMap.set(r.user_id, display);
    }
  }

  const enriched = (entries ?? []).map((e: any) => ({
    ...e,
    actor_display_name: namesMap.get(e.user_id) ?? null,
  }));

  return NextResponse.json({ entries: enriched });
}
