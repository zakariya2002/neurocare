/**
 * API Photo journal (B1) — génération d'une URL signée pour visualiser
 * une photo privée du bucket `health-journal-photos`.
 *
 * GET /api/family/children/[id]/journal/photo?path=<storage_path>
 *      → { signedUrl: string }
 *
 * L'upload est fait côté browser via supabaseHealth (RLS user-scoped).
 * Cette route sert uniquement à fabriquer une URL signée courte durée
 * pour afficher la photo (ou la fournir au PDF).
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

async function ensureChildAccess(
  supabase: ReturnType<typeof createServerSupabasePublic>,
  userId: string,
  childId: string
): Promise<boolean> {
  const { data: child } = await supabase
    .from('child_profiles')
    .select('id, family_profiles:family_id (user_id)')
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURES.journalBord) return notFoundJson();
  const { id: childId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  if (!(await ensureChildAccess(sbPublic, user.id, childId))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  if (!path) return badRequest('path manquant');

  // S'assurer que le path appartient bien à la photo d'un log accessible.
  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data: log } = await sbHealth
    .from('child_daily_logs')
    .select('id, photo_path, child_id')
    .eq('child_id', childId)
    .eq('photo_path', path)
    .maybeSingle();
  if (!log) return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 });

  const { data, error } = await sbHealth
    .storage
    .from('health-journal-photos')
    .createSignedUrl(path, 60 * 5);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Erreur' }, { status: 500 });
  }
  return NextResponse.json({ signedUrl: data.signedUrl });
}
