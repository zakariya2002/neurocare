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
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId requis' },
        { status: 400 }
      );
    }

    // Réinitialiser le rendez-vous en statut pending
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'pending',
        pin_code: null,
        pin_code_expires_at: null,
        pin_code_attempts: 0,
        pin_code_validated: false
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Erreur update:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la réinitialisation du rendez-vous' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Rendez-vous réinitialisé avec succès'
    });

  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la réinitialisation du rendez-vous' },
      { status: 500 }
    );
  }
}
