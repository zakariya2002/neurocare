import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const { educatorId } = await request.json();

    if (!educatorId) {
      return NextResponse.json(
        { error: 'Educator ID requis' },
        { status: 400 }
      );
    }

    // Récupérer l'IP du visiteur (pour éviter les doubles comptages)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    // Enregistrer la vue (l'index unique empêchera les doublons du même jour)
    const { error } = await supabase
      .from('profile_views')
      .insert({
        educator_id: educatorId,
        viewer_ip: ip,
        viewer_user_id: user!.id,
      });

    // Ignorer l'erreur de contrainte unique (vue déjà enregistrée aujourd'hui)
    if (error && !error.message.includes('unique_view_per_day') && !error.message.includes('duplicate key')) {
      console.error('Erreur enregistrement vue:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur track-profile-view:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
