/**
 * API Journal de bord (B1) — logs quotidiens d'un enfant.
 *
 * GET  /api/family/children/[id]/journal/logs?from=YYYY-MM-DD&to=YYYY-MM-DD
 *      → liste les logs sur la période (par défaut : 30 derniers jours).
 *
 * POST /api/family/children/[id]/journal/logs
 *      Upsert d'un log par (child_id, log_date). Le serveur recalcule le
 *      score de bien-être et déclenche la détection de patterns.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import {
  createServerSupabasePublic,
  createServerSupabaseHealth,
} from '@/lib/supabase-server-helpers';
import {
  parseDailyLogPayload,
  computeWellbeingScore,
  detectPatterns,
  isLogDate,
  type ChildDailyLogRow,
} from '@/lib/family/journal';

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

async function ensureChildAccess(
  supabase: ReturnType<typeof createServerSupabasePublic>,
  userId: string,
  childId: string
): Promise<{ canRead: boolean; canWrite: boolean }> {
  // Famille propriétaire ?
  const { data: child } = await supabase
    .from('child_profiles')
    .select('id, family_id, family_profiles:family_id (user_id)')
    .eq('id', childId)
    .maybeSingle();
  if (child) {
    const fp = (child as any).family_profiles;
    const owner = Array.isArray(fp) ? fp[0]?.user_id : fp?.user_id;
    if (owner === userId) return { canRead: true, canWrite: true };
  }

  // Pro collaborateur (lecture seule)
  const { data: collab } = await supabase
    .from('ppa_collaborations')
    .select('id, status, invited_educator_id, educator_profiles:invited_educator_id (user_id)')
    .eq('child_id', childId)
    .eq('status', 'accepted')
    .maybeSingle();
  if (collab) {
    const ep = (collab as any).educator_profiles;
    const collabUserId = Array.isArray(ep) ? ep[0]?.user_id : ep?.user_id;
    if (collabUserId === userId) return { canRead: true, canWrite: false };
  }
  return { canRead: false, canWrite: false };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURES.journalBord) return notFoundJson();
  const { id: childId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  const access = await ensureChildAccess(sbPublic, user.id, childId);
  if (!access.canRead) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const today = new Date();
  const defaultFrom = new Date(today);
  defaultFrom.setDate(today.getDate() - 30);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const from = fromParam && isLogDate(fromParam) ? fromParam : iso(defaultFrom);
  const to = toParam && isLogDate(toParam) ? toParam : iso(today);

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_daily_logs')
    .select('*')
    .eq('child_id', childId)
    .gte('log_date', from)
    .lte('log_date', to)
    .order('log_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    logs: data ?? [],
    range: { from, to },
    canWrite: access.canWrite,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURES.journalBord) return notFoundJson();
  const { id: childId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  const access = await ensureChildAccess(sbPublic, user.id, childId);
  if (!access.canWrite) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('JSON invalide');
  }
  const parsed = parseDailyLogPayload(body);
  if (!parsed) return badRequest('Payload invalide');

  const wellbeing_score = computeWellbeingScore(parsed);

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_daily_logs')
    .upsert(
      {
        child_id: childId,
        user_id: user.id,
        ...parsed,
        wellbeing_score,
      },
      { onConflict: 'child_id,log_date' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Détection patterns sur les 7 derniers jours
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const fromIso = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: recentLogs } = await sbHealth
    .from('child_daily_logs')
    .select('*')
    .eq('child_id', childId)
    .gte('log_date', fromIso)
    .order('log_date', { ascending: false })
    .limit(7);

  const patterns = detectPatterns((recentLogs ?? []) as ChildDailyLogRow[]);
  if (patterns.length > 0) {
    await sbHealth
      .from('child_pattern_alerts')
      .upsert(
        patterns.map((p) => ({
          child_id: childId,
          user_id: user.id,
          rule_key: p.rule_key,
          payload: p.payload,
        })),
        { ignoreDuplicates: true }
      );
  }

  return NextResponse.json({ log: data }, { status: 201 });
}
