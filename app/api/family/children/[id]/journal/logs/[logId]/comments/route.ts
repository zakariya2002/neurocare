/**
 * API Commentaires d'un log journal (B1).
 *
 * GET  /api/family/children/[id]/journal/logs/[logId]/comments
 * POST /api/family/children/[id]/journal/logs/[logId]/comments  (famille ou pro collab)
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import {
  createServerSupabasePublic,
  createServerSupabaseHealth,
} from '@/lib/supabase-server-helpers';
import { parseCommentPayload } from '@/lib/family/journal';

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
): Promise<boolean> {
  const { data: child } = await supabase
    .from('child_profiles')
    .select('id, family_id, family_profiles:family_id (user_id)')
    .eq('id', childId)
    .maybeSingle();
  if (child) {
    const fp = (child as any).family_profiles;
    const owner = Array.isArray(fp) ? fp[0]?.user_id : fp?.user_id;
    if (owner === userId) return true;
  }
  const { data: collab } = await supabase
    .from('ppa_collaborations')
    .select('id, status, educator_profiles:invited_educator_id (user_id)')
    .eq('child_id', childId)
    .eq('status', 'accepted')
    .maybeSingle();
  if (collab) {
    const ep = (collab as any).educator_profiles;
    const collabUserId = Array.isArray(ep) ? ep[0]?.user_id : ep?.user_id;
    if (collabUserId === userId) return true;
  }
  return false;
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
  if (!(await ensureChildAccess(sbPublic, user.id, childId))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 404 });
  }

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_daily_log_comments')
    .select('*')
    .eq('log_id', logId)
    .eq('child_id', childId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  if (!FEATURES.journalBord) return notFoundJson();
  const { id: childId, logId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  if (!(await ensureChildAccess(sbPublic, user.id, childId))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('JSON invalide');
  }
  const parsed = parseCommentPayload(body);
  if (!parsed) return badRequest('Payload invalide');

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_daily_log_comments')
    .insert({
      log_id: logId,
      child_id: childId,
      author_user_id: user.id,
      comment: parsed.comment,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}
