import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { entry_id } = await request.json();
    if (!entry_id || typeof entry_id !== 'string') {
      return NextResponse.json({ error: 'entry_id requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('waitlist_entries')
      .update({ status: 'cancelled' })
      .eq('id', entry_id)
      .eq('family_id', session.user.id)
      .eq('status', 'active')
      .select('id')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Entrée introuvable ou déjà annulée' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Waitlist leave exception:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
