import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabaseAuth.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'éducateur connecté
    const { data: educator, error: educatorError } = await supabaseAuth
      .from('educator_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (educatorError || !educator) {
      return NextResponse.json({ error: 'Profil éducateur introuvable' }, { status: 404 });
    }

    // Service role pour récupérer le prénom de la famille (RLS contrôle déjà l'accès aux entrées)
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: entries, error } = await supabaseAuth
      .from('waitlist_entries')
      .select(`
        id,
        family_id,
        preferred_days,
        preferred_time_range,
        notes,
        status,
        notified_count,
        last_notified_at,
        created_at,
        expires_at
      `)
      .eq('educator_id', educator.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Educator waitlist error:', error);
      return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
    }

    // Enrichir avec le prénom de la famille (sans nom complet)
    const familyIds = Array.from(new Set((entries || []).map(e => e.family_id)));
    const familyNames: Record<string, string> = {};

    if (familyIds.length > 0) {
      const { data: families } = await supabaseService
        .from('family_profiles')
        .select('user_id, first_name')
        .in('user_id', familyIds);

      for (const f of families || []) {
        familyNames[f.user_id] = f.first_name || 'Famille';
      }
    }

    const enriched = (entries || []).map(e => ({
      id: e.id,
      family_first_name: familyNames[e.family_id] || 'Famille',
      preferred_days: e.preferred_days,
      preferred_time_range: e.preferred_time_range,
      notes: e.notes,
      notified_count: e.notified_count,
      last_notified_at: e.last_notified_at,
      created_at: e.created_at,
      expires_at: e.expires_at,
    }));

    return NextResponse.json({ entries: enriched, total: enriched.length });
  } catch (error) {
    console.error('Educator waitlist exception:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
