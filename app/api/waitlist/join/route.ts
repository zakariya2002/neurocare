import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface TimeRange { start: string; end: string }

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function isValidTime(t: unknown): t is string {
  return typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { educator_id, preferred_days, preferred_time_range, child_id, notes } = body as {
      educator_id?: string;
      preferred_days?: string[];
      preferred_time_range?: TimeRange;
      child_id?: string;
      notes?: string;
    };

    if (!educator_id || typeof educator_id !== 'string') {
      return NextResponse.json({ error: 'educator_id requis' }, { status: 400 });
    }

    const days = Array.isArray(preferred_days) ? preferred_days.filter(d => VALID_DAYS.includes(d)) : [];
    if (days.length === 0) {
      return NextResponse.json({ error: 'Au moins un jour préféré requis' }, { status: 400 });
    }

    let timeRange: TimeRange | null = null;
    if (preferred_time_range && isValidTime(preferred_time_range.start) && isValidTime(preferred_time_range.end)) {
      if (preferred_time_range.start >= preferred_time_range.end) {
        return NextResponse.json({ error: 'Plage horaire invalide' }, { status: 400 });
      }
      timeRange = { start: preferred_time_range.start, end: preferred_time_range.end };
    }

    // Vérifier que l'éducateur existe
    const { data: educator, error: educatorError } = await supabase
      .from('educator_profiles')
      .select('id')
      .eq('id', educator_id)
      .single();

    if (educatorError || !educator) {
      return NextResponse.json({ error: 'Éducateur introuvable' }, { status: 404 });
    }

    // Insert (RLS contrôle family_id = auth.uid())
    const { data, error } = await supabase
      .from('waitlist_entries')
      .insert({
        family_id: session.user.id,
        educator_id,
        preferred_days: days,
        preferred_time_range: timeRange,
        child_id: child_id || null,
        notes: typeof notes === 'string' ? notes.slice(0, 1000) : null,
        status: 'active',
      })
      .select('id, educator_id, preferred_days, preferred_time_range, status, created_at, expires_at')
      .single();

    if (error) {
      // Conflit unique
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Vous êtes déjà en liste d\'attente sur ce profil' }, { status: 409 });
      }
      console.error('Waitlist join error:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, entry: data });
  } catch (error) {
    console.error('Waitlist join exception:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
