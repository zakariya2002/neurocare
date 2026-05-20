import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
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

  const statusFilter = request.nextUrl.searchParams.get('status');

  let query = supabase
    .from('announcement_responses')
    .select(`
      *,
      announcement:family_announcements (
        id, title, city, location_label, status,
        accompaniment_types, desired_professions, tnd_context, place_types,
        min_hours_per_week, max_hours_per_week,
        hourly_budget_min, hourly_budget_max,
        start_date, start_flexibility,
        published_at, expires_at
      )
    `)
    .eq('educator_id', educator.id)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
