import { NextRequest, NextResponse } from 'next/server';
import { getRouteSupabase } from '@/lib/announcements/supabase-server';
import { respondAnnouncementSchema } from '@/lib/announcements/schemas';

export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES = ['pending', 'read', 'shortlisted', 'accepted'];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await getRouteSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Vérifier profil éducateur + verification_badge
  const { data: educator, error: eduErr } = await supabase
    .from('educator_profiles')
    .select('id, verification_badge')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (eduErr) {
    return NextResponse.json({ error: eduErr.message }, { status: 500 });
  }
  if (!educator) {
    return NextResponse.json({ error: 'Profil pro introuvable' }, { status: 403 });
  }
  if (!educator.verification_badge) {
    return NextResponse.json({ error: 'Profil non vérifié' }, { status: 403 });
  }

  // L'annonce existe et est publiée
  const { data: announcement } = await supabase
    .from('family_announcements')
    .select('id, status, expires_at')
    .eq('id', params.id)
    .maybeSingle();

  if (!announcement) {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });
  }
  const expired =
    announcement.expires_at && new Date(announcement.expires_at) <= new Date();
  if (announcement.status !== 'published' || expired) {
    return NextResponse.json(
      { error: "Cette annonce n'accepte plus de candidatures" },
      { status: 409 }
    );
  }

  // Pas de candidature active existante
  const { data: existing } = await supabase
    .from('announcement_responses')
    .select('id, status')
    .eq('announcement_id', params.id)
    .eq('educator_id', educator.id)
    .in('status', ACTIVE_STATUSES)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Vous avez déjà candidaté à cette annonce' },
      { status: 409 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = respondAnnouncementSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation échouée', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: inserted, error: insErr } = await supabase
    .from('announcement_responses')
    .insert({
      announcement_id: params.id,
      educator_id: educator.id,
      message: parsed.data.message,
      proposed_hourly_rate: parsed.data.proposed_hourly_rate ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (insErr) {
    // Si la contrainte unique sur (announcement, educator) actif est violée
    if ((insErr as any).code === '23505') {
      return NextResponse.json(
        { error: 'Vous avez déjà candidaté à cette annonce' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json(inserted, { status: 201 });
}
