/**
 * API Journal de bord — détail d'un log.
 *
 * GET    /api/family/children/[id]/journal/logs/[logId]
 * DELETE /api/family/children/[id]/journal/logs/[logId]    (parent uniquement)
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

async function isFamilyOwner(
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
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  if (!FEATURES.journalBord) return notFoundJson();
  const { id: childId, logId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_daily_logs')
    .select('*')
    .eq('id', logId)
    .eq('child_id', childId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  return NextResponse.json({ log: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  if (!FEATURES.journalBord) return notFoundJson();
  const { id: childId, logId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  if (!(await isFamilyOwner(sbPublic, user.id, childId))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { error } = await sbHealth
    .from('child_daily_logs')
    .delete()
    .eq('id', logId)
    .eq('child_id', childId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
