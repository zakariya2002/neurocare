/**
 * API Alertes patterns (B1).
 *
 * GET   /api/family/children/[id]/journal/alerts                  → alertes actives (non dismissed)
 * PATCH /api/family/children/[id]/journal/alerts                  body: { id, dismissed: true }
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
function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

async function ensureChildOwnedByUser(
  supabase: ReturnType<typeof createServerSupabasePublic>,
  userId: string,
  childId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('child_profiles')
    .select('id, family_profiles:family_id (user_id)')
    .eq('id', childId)
    .maybeSingle();
  if (!data) return false;
  const fp = (data as any).family_profiles;
  const owner = Array.isArray(fp) ? fp[0]?.user_id : fp?.user_id;
  return owner === userId;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURES.journalBord) return notFoundJson();
  const { id: childId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  if (!(await ensureChildOwnedByUser(sbPublic, user.id, childId))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 404 });
  }

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_pattern_alerts')
    .select('*')
    .eq('child_id', childId)
    .is('dismissed_at', null)
    .order('triggered_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURES.journalBord) return notFoundJson();
  const { id: childId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  if (!(await ensureChildOwnedByUser(sbPublic, user.id, childId))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return badRequest('JSON invalide');
  }
  const alertId = typeof body?.id === 'string' ? body.id : null;
  if (!alertId) return badRequest('ID manquant');

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_pattern_alerts')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', alertId)
    .eq('child_id', childId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alert: data });
}
