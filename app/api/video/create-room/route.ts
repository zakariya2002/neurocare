import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AppointmentRow {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  family: { user_id: string } | null;
  educator: { user_id: string } | null;
}

function appointmentEndTimestamp(appt: AppointmentRow): number {
  const dt = new Date(`${appt.appointment_date}T${appt.end_time}`);
  return Math.floor(dt.getTime() / 1000);
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DAILY_API_KEY) {
      return NextResponse.json({ error: 'DAILY_API_KEY non configurée' }, { status: 500 });
    }

    // Auth utilisateur (cookie session)
    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabaseAuth.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { appointmentId } = await request.json();
    if (!appointmentId || typeof appointmentId !== 'string') {
      return NextResponse.json({ error: 'appointmentId manquant' }, { status: 400 });
    }

    // Vérifier que l'appelant est éducateur OU famille du RDV
    const { data: appointment, error: apptErr } = await supabaseAdmin
      .from('appointments')
      .select(`
        id, appointment_date, start_time, end_time, status,
        family:family_profiles(user_id),
        educator:educator_profiles(user_id)
      `)
      .eq('id', appointmentId)
      .single<AppointmentRow>();

    if (apptErr || !appointment) {
      return NextResponse.json({ error: 'Rendez-vous introuvable' }, { status: 404 });
    }

    const isEducator = appointment.educator?.user_id === session.user.id;
    const isFamily = appointment.family?.user_id === session.user.id;
    if (!isEducator && !isFamily) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Nom de room déterministe pour réutilisation cross-participants
    const roomName = `apt-${appointmentId.substring(0, 8)}-${appointmentId.substring(9, 13)}`;

    // Si la room existe déjà chez Daily.co on la réutilise (idempotent)
    const existing = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${process.env.DAILY_API_KEY}` },
    });

    let roomData: { url: string; name: string };

    if (existing.ok) {
      roomData = await existing.json();
    } else {
      // Expiration = fin de séance + 30min de buffer
      const exp = appointmentEndTimestamp(appointment) + 30 * 60;

      const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'private',
          properties: {
            exp,
            enable_prejoin_ui: true,
            enable_chat: true,
            enable_screenshare: true,
            enable_recording: false,
            max_participants: 4,
            start_audio_off: false,
            start_video_off: false,
            lang: 'fr',
          },
        }),
      });

      if (!dailyResponse.ok) {
        const errorData = await dailyResponse.json();
        console.error('Daily.co create room error:', errorData);
        return NextResponse.json(
          { error: 'Erreur création room', details: errorData },
          { status: 500 }
        );
      }

      roomData = await dailyResponse.json();
    }

    return NextResponse.json({
      success: true,
      roomUrl: roomData.url,
      roomName: roomData.name,
    });
  } catch (error) {
    console.error('Erreur création room:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
