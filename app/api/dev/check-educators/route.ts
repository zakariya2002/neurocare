import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Defense en profondeur : meme si bloque par middleware en prod
    const { user, error: authError } = await assertAdmin();
    if (authError) return authError;
    // 1. Récupérer TOUS les éducateurs
    const { data: allEducators, error: allError } = await supabase
      .from('educator_profiles')
      .select('id, first_name, last_name, verification_badge, diploma_verification_status, diploma_verified_at');

    if (allError) {
      console.error('Erreur récupération tous:', allError);
      return NextResponse.json({ error: allError.message }, { status: 500 });
    }

    // 2. Récupérer les éducateurs avec badge = true
    const { data: verifiedEducators, error: verifiedError } = await supabase
      .from('educator_profiles')
      .select('id, first_name, last_name, verification_badge')
      .eq('verification_badge', true);

    if (verifiedError) {
      console.error('Erreur récupération vérifiés:', verifiedError);
    }

    // 3. La même requête que la page de recherche
    const { data: searchEducators, error: searchError } = await supabase
      .from('educator_profiles')
      .select(`
        *,
        certifications (*),
        subscriptions!educator_id (
          status
        )
      `)
      .eq('verification_badge', true)
      .order('rating', { ascending: false });

    if (searchError) {
      console.error('Erreur recherche:', searchError);
    }

    return NextResponse.json({
      total_educators: allEducators?.length || 0,
      all_educators: allEducators,
      verified_count: verifiedEducators?.length || 0,
      verified_educators: verifiedEducators,
      search_results_count: searchEducators?.length || 0,
      search_results: searchEducators
    });

  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur' },
      { status: 500 }
    );
  }
}
