import { NextResponse } from 'next/server';
import { getRouteSupabase } from '@/lib/announcements/supabase-server';

export const dynamic = 'force-dynamic';

// Endpoint léger qui retourne uniquement la liste des announcement_id favorisés
// par le pro connecté. Utilisé par le listing public /annonces pour afficher
// l'état du cœur sans recharger toute la liste des favoris.
export async function GET() {
  const supabase = await getRouteSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  // Pas d'erreur si non connecté ou pas pro — simplement réponse explicite
  if (!session?.user) {
    return NextResponse.json({ isPro: false, ids: [] });
  }

  const { data: educator } = await supabase
    .from('educator_profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!educator) {
    return NextResponse.json({ isPro: false, ids: [] });
  }

  const { data } = await supabase
    .from('educator_announcement_favorites')
    .select('announcement_id')
    .eq('educator_id', educator.id);

  const ids = (data || []).map((r) => r.announcement_id);
  return NextResponse.json({ isPro: true, ids });
}
