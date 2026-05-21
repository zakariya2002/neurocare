import { NextResponse } from 'next/server';
import { getRouteSupabase } from '@/lib/announcements/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getRouteSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: educator } = await supabase
    .from('educator_profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!educator) {
    return NextResponse.json({ error: 'Profil pro introuvable' }, { status: 403 });
  }

  // Jointure avec l'annonce pour récupérer toutes les infos nécessaires côté UI
  const { data, error } = await supabase
    .from('educator_announcement_favorites')
    .select(`
      id,
      created_at,
      announcement_id,
      announcement:family_announcements (
        id,
        title,
        city,
        postal_code,
        latitude,
        longitude,
        accompaniment_types,
        desired_professions,
        tnd_context,
        place_types,
        gender_preference,
        hours_per_week,
        person_age,
        start_date,
        start_date_flexibility,
        status,
        expires_at,
        published_at,
        created_at
      )
    `)
    .eq('educator_id', educator.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filtre côté serveur : on n'expose que les annonces toujours publiées
  // (l'annonce peut avoir été retirée par la famille ou expirée)
  const items = (data || []).filter((row: any) => {
    const a = row.announcement;
    if (!a) return false;
    if (a.status !== 'published') return false;
    if (a.expires_at && new Date(a.expires_at) <= new Date()) return false;
    return true;
  });

  return NextResponse.json({ items });
}
