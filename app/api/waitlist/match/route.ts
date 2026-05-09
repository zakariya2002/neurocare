/**
 * Endpoint appelé après la création d'un slot par l'éducateur depuis le client.
 * Vérifie que l'utilisateur connecté est bien l'éducateur du créneau,
 * puis déclenche le matcher en fire-and-forget.
 */
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { matchWaitlistOnSlotAvailable } from '@/lib/waitlist-matcher';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { educator_id, date, start_time, end_time } = await request.json();

    if (!educator_id || !date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Vérifie que l'utilisateur est bien le pro propriétaire de ce créneau
    const { data: educator, error } = await supabase
      .from('educator_profiles')
      .select('id')
      .eq('id', educator_id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !educator) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Fire-and-forget : on ne bloque pas le client
    matchWaitlistOnSlotAvailable({ educator_id, date, start_time, end_time })
      .catch(err => console.error('Waitlist match on slot create error:', err));

    return NextResponse.json({ success: true, scheduled: true });
  } catch (error) {
    console.error('Waitlist match exception:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
