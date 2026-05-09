import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('waitlist_entries')
      .select(`
        id,
        educator_id,
        preferred_days,
        preferred_time_range,
        child_id,
        notes,
        status,
        notified_count,
        last_notified_at,
        expires_at,
        created_at,
        educator:educator_profiles(id, first_name, last_name, profession, photo_url, city)
      `)
      .eq('family_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Waitlist list error:', error);
      return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
    }

    return NextResponse.json({ entries: data || [] });
  } catch (error) {
    console.error('Waitlist list exception:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
