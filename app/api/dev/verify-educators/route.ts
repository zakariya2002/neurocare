import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Defense en profondeur : meme si bloque par middleware en prod
    const { user, error: authError } = await assertAdmin();
    if (authError) return authError;
    const { educatorIds } = await request.json();

    if (!educatorIds || !Array.isArray(educatorIds)) {
      // Si aucun ID fourni, vérifier tous les éducateurs avec diplôme vérifié
      const { data: educators, error: fetchError } = await supabase
        .from('educator_profiles')
        .select('id, first_name, last_name, diploma_verified')
        .eq('diploma_verified', true);

      if (fetchError) {
        console.error('Erreur récupération éducateurs:', fetchError);
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des éducateurs' },
          { status: 500 }
        );
      }

      if (!educators || educators.length === 0) {
        return NextResponse.json({
          message: 'Aucun éducateur avec diplôme vérifié trouvé'
        });
      }

      // Activer le badge pour tous
      const ids = educators.map(e => e.id);
      const { error: updateError } = await supabase
        .from('educator_profiles')
        .update({ verification_badge: true })
        .in('id', ids);

      if (updateError) {
        console.error('Erreur update:', updateError);
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${educators.length} éducateurs vérifiés`,
        educators: educators.map(e => `${e.first_name} ${e.last_name}`)
      });
    }

    // Sinon, vérifier les IDs spécifiques
    const { error: updateError } = await supabase
      .from('educator_profiles')
      .update({ verification_badge: true })
      .in('id', educatorIds);

    if (updateError) {
      console.error('Erreur update:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${educatorIds.length} éducateurs vérifiés`
    });

  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
