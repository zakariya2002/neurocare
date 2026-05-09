import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRE_JOIN_WINDOW_MIN = 15;
const POST_END_WINDOW_MIN = 30;

interface AppointmentRow {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  family: { user_id: string; first_name: string | null; last_name: string | null } | null;
  educator: { user_id: string; first_name: string | null; last_name: string | null } | null;
}

function startTs(appt: AppointmentRow): number {
  return new Date(`${appt.appointment_date}T${appt.start_time}`).getTime();
}
function endTs(appt: AppointmentRow): number {
  return new Date(`${appt.appointment_date}T${appt.end_time}`).getTime();
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DAILY_API_KEY) {
      return NextResponse.json({ error: 'DAILY_API_KEY non configurée' }, { status: 500 });
    }

    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabaseAuth.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { appointmentId } = await request.json();
    if (!appointmentId || typeof appointmentId !== 'string') {
      return NextResponse.json({ error: 'appointmentId manquant' }, { status: 400 });
    }

    const { data: appointment, error: apptErr } = await supabaseAdmin
      .from('appointments')
      .select(`
        id, appointment_date, start_time, end_time, status,
        family:family_profiles(user_id, first_name, last_name),
        educator:educator_profiles(user_id, first_name, last_name)
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

    if (appointment.status === 'cancelled') {
      return NextResponse.json({ error: 'Rendez-vous annulé' }, { status: 400 });
    }

    // Fenêtre temporelle : [start - 15min, end + 30min]
    const now = Date.now();
    const windowStart = startTs(appointment) - PRE_JOIN_WINDOW_MIN * 60 * 1000;
    const windowEnd = endTs(appointment) + POST_END_WINDOW_MIN * 60 * 1000;
    if (now < windowStart) {
      return NextResponse.json(
        { error: 'Séance pas encore accessible', minutesUntilOpen: Math.ceil((windowStart - now) / 60000) },
        { status: 403 }
      );
    }
    if (now > windowEnd) {
      return NextResponse.json({ error: 'Séance terminée' }, { status: 403 });
    }

    const roomName = `apt-${appointmentId.substring(0, 8)}-${appointmentId.substring(9, 13)}`;

    const profile = isEducator ? appointment.educator : appointment.family;
    const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || (isEducator ? 'Professionnel' : 'Famille');
    const exp = Math.floor(windowEnd / 1000);

    const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: userName,
          user_id: session.user.id,
          is_owner: isEducator,
          exp,
          enable_screenshare: true,
          enable_recording: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Daily.co token error:', errorData);
      return NextResponse.json(
        { error: 'Erreur génération token', details: errorData },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Audit RGPD : log l'émission de token
    console.info('[video-token] issued', {
      user_id: session.user.id,
      appointment_id: appointmentId,
      role: isEducator ? 'educator' : 'family',
      exp,
      issued_at: new Date().toISOString(),
    });

    const roomUrl = `https://${process.env.DAILY_DOMAIN || 'neurocare'}.daily.co/${roomName}`;

    return NextResponse.json({
      success: true,
      token: tokenData.token,
      roomUrl,
      roomName,
      expiresAt: exp * 1000,
    });
  } catch (error) {
    console.error('Erreur génération token:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
