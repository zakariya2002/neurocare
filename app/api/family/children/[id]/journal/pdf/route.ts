/**
 * API Synthèse 30 jours du journal de bord — export PDF (B1).
 *
 * GET /api/family/children/[id]/journal/pdf
 *
 * Génère un PDF "Synthèse 30 jours" à présenter au pro lors d'un RDV.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import {
  createServerSupabasePublic,
  createServerSupabaseHealth,
} from '@/lib/supabase-server-helpers';
import { generateJournalSummaryPDF } from '@/lib/pdf/journal-summary';
import type { ChildDailyLogRow } from '@/lib/family/journal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function notFoundJson() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}

async function ensureChildAccess(
  supabase: ReturnType<typeof createServerSupabasePublic>,
  userId: string,
  childId: string
): Promise<{ canRead: boolean; child: { first_name: string; last_name: string | null; birth_date: string | null } | null; parentName: string | null }> {
  const { data: child } = await supabase
    .from('child_profiles')
    .select('id, first_name, last_name, birth_date, family_id, family_profiles:family_id (user_id, first_name, last_name)')
    .eq('id', childId)
    .maybeSingle();
  if (!child) return { canRead: false, child: null, parentName: null };
  const fp = (child as any).family_profiles;
  const owner = Array.isArray(fp) ? fp[0]?.user_id : fp?.user_id;
  const parentFirst = Array.isArray(fp) ? fp[0]?.first_name : fp?.first_name;
  const parentLast = Array.isArray(fp) ? fp[0]?.last_name : fp?.last_name;
  const parentName = [parentFirst, parentLast].filter(Boolean).join(' ').trim() || null;
  const childInfo = {
    first_name: (child as any).first_name as string,
    last_name: ((child as any).last_name as string | null) ?? null,
    birth_date: ((child as any).birth_date as string | null) ?? null,
  };
  if (owner === userId) return { canRead: true, child: childInfo, parentName };

  const { data: collab } = await supabase
    .from('ppa_collaborations')
    .select('id, status, educator_profiles:invited_educator_id (user_id)')
    .eq('child_id', childId)
    .eq('status', 'accepted')
    .maybeSingle();
  if (collab) {
    const ep = (collab as any).educator_profiles;
    const collabUserId = Array.isArray(ep) ? ep[0]?.user_id : ep?.user_id;
    if (collabUserId === userId) return { canRead: true, child: childInfo, parentName };
  }
  return { canRead: false, child: childInfo, parentName };
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

  const access = await ensureChildAccess(sbPublic, user.id, childId);
  if (!access.canRead || !access.child) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 404 });
  }

  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 30);
  const fromIso = from.toISOString().slice(0, 10);
  const toIso = today.toISOString().slice(0, 10);

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data: logs, error } = await sbHealth
    .from('child_daily_logs')
    .select('*')
    .eq('child_id', childId)
    .gte('log_date', fromIso)
    .lte('log_date', toIso)
    .order('log_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const pdf = await generateJournalSummaryPDF({
    childFirstName: access.child.first_name,
    childLastName: access.child.last_name,
    childBirthDate: access.child.birth_date,
    parentFullName: access.parentName,
    generationDate: today,
    rangeFrom: from,
    rangeTo: today,
    logs: (logs ?? []) as ChildDailyLogRow[],
  });

  const filename = `journal-${access.child.first_name}-${toIso}.pdf`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
