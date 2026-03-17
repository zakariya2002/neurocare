import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      educatorId,
      familyId,
      appointmentDate,
      slots, // Array of { start_time, end_time }
      locationType,
      address,
      educatorNotes
    } = body;

    if (!educatorId || !familyId || !appointmentDate || !slots || slots.length === 0) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est bien l'éducateur
    const { data: educatorProfile } = await supabase
      .from('educator_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('id', educatorId)
      .single();

    if (!educatorProfile) {
      return NextResponse.json(
        { error: 'Vous ne pouvez proposer des créneaux que pour votre propre profil' },
        { status: 403 }
      );
    }

    // Créer les rendez-vous
    const appointmentsToCreate = slots.map((slot: { start_time: string; end_time: string }) => ({
      educator_id: educatorId,
      family_id: familyId,
      appointment_date: appointmentDate,
      start_time: slot.start_time,
      end_time: slot.end_time,
      location_type: locationType || 'online',
      address: address || null,
      educator_notes: educatorNotes || null,
      status: 'pending',
    }));

    const { data, error: insertError } = await supabase
      .from('appointments')
      .insert(appointmentsToCreate)
      .select();

    if (insertError) {
      console.error('Erreur insertion appointments:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointments: data,
      count: data?.length || 0
    });
  } catch (error: any) {
    console.error('Erreur API propose appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
