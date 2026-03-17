import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const { pinCode } = await request.json();

    if (!pinCode) {
      return NextResponse.json(
        { error: 'Code PIN requis' },
        { status: 400 }
      );
    }

    // Récupérer le rendez-vous
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', params.id)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Rendez-vous non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est partie prenante de ce RDV
    const { data: educatorProfile } = await supabase
      .from('educator_profiles')
      .select('id')
      .eq('user_id', user!.id)
      .single();

    const { data: familyProfile } = await supabase
      .from('family_profiles')
      .select('id')
      .eq('user_id', user!.id)
      .single();

    const isEducator = educatorProfile?.id === appointment.educator_id;
    const isFamily = familyProfile?.id === appointment.family_id;

    if (!isEducator && !isFamily) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Vérifier que le RDV est accepté
    if (appointment.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Le rendez-vous doit être accepté' },
        { status: 400 }
      );
    }

    // Vérifier que la séance n'est pas déjà démarrée
    if (appointment.started_at) {
      return NextResponse.json(
        { error: 'La séance a déjà été démarrée' },
        { status: 400 }
      );
    }

    // Vérifier que le code PIN existe
    if (!appointment.pin_code) {
      return NextResponse.json(
        { error: 'Code PIN non généré pour ce rendez-vous' },
        { status: 400 }
      );
    }

    // Vérifier si le code PIN a expiré
    if (appointment.pin_code_expires_at && new Date(appointment.pin_code_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Le code PIN a expiré' },
        { status: 400 }
      );
    }

    // Vérifier si le compte est verrouillé
    if (appointment.pin_locked_until && new Date(appointment.pin_locked_until) > new Date()) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 403 }
      );
    }

    // Vérifier le nombre de tentatives
    if (appointment.pin_code_attempts >= 3) {
      // Verrouiller pour 30 minutes
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      await supabase
        .from('appointments')
        .update({ pin_locked_until: lockUntil.toISOString() })
        .eq('id', params.id);

      return NextResponse.json(
        {
          error: 'Nombre maximum de tentatives atteint. Compte verrouillé pour 30 minutes.',
          attemptsLeft: 0
        },
        { status: 403 }
      );
    }

    // Vérifier le code PIN
    if (pinCode !== appointment.pin_code) {
      // Incrémenter les tentatives échouées
      const newAttempts = appointment.pin_code_attempts + 1;
      await supabase
        .from('appointments')
        .update({ pin_code_attempts: newAttempts })
        .eq('id', params.id);

      return NextResponse.json(
        {
          error: 'Code PIN incorrect',
          attemptsLeft: 3 - newAttempts
        },
        { status: 401 }
      );
    }

    // Code PIN correct - Démarrer la séance
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        started_at: now,
        pin_code_validated: true,
        pin_code_entered_at: now,
        pin_code_attempts: 0
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Erreur lors du démarrage de la séance:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors du démarrage de la séance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Séance démarrée avec succès',
      started_at: now
    });

  } catch (error: any) {
    console.error('Erreur lors du démarrage de la séance:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
