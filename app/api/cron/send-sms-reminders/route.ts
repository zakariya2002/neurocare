import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sms } from '@/lib/sms';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ReminderRow {
  id: string;
  appointment_id: string;
  reminder_type: '24h' | '1h';
  scheduled_at: string;
  appointment: {
    id: string;
    appointment_date: string;
    start_time: string;
    location_type: string | null;
    address: string | null;
    educator: { first_name: string | null; last_name: string | null } | null;
    family: {
      first_name: string | null;
      phone: string | null;
      sms_reminders_enabled: boolean | null;
    } | null;
  } | null;
}

function buildMessage(
  reminderType: '24h' | '1h',
  educatorName: string,
  appointmentDate: string,
  startTime: string
): string {
  const date = new Date(`${appointmentDate}T${startTime}`);
  const timeStr = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  if (reminderType === '24h') {
    const dayStr = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
    return `NeuroCare : rappel — RDV avec ${educatorName} ${dayStr} à ${timeStr}. Pour annuler, connectez-vous à votre espace.`;
  }
  return `NeuroCare : votre RDV avec ${educatorName} commence dans 1h (${timeStr}). À tout de suite !`;
}

export async function GET(request: Request) {
  // Auth : Vercel cron sends "Authorization: Bearer <CRON_SECRET>"
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Pick reminders due in the next 5 minutes
  const window = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { data: reminders, error } = await supabase
    .from('appointment_reminders')
    .select(
      `
      id,
      appointment_id,
      reminder_type,
      scheduled_at,
      appointment:appointments(
        id,
        appointment_date,
        start_time,
        location_type,
        address,
        educator:educator_profiles(first_name, last_name),
        family:family_profiles(first_name, phone, sms_reminders_enabled)
      )
    `
    )
    .eq('status', 'pending')
    .lte('scheduled_at', window)
    .limit(100);

  if (error) {
    console.error('[cron sms] DB error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (reminders ?? []) as unknown as ReminderRow[];
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const r of list) {
    processed++;
    const appt = r.appointment;

    if (!appt || !appt.family || !appt.educator) {
      await supabase
        .from('appointment_reminders')
        .update({ status: 'failed', error_message: 'Appointment or family missing' })
        .eq('id', r.id);
      failed++;
      continue;
    }

    const optedIn = appt.family.sms_reminders_enabled !== false;
    const phone = appt.family.phone;

    if (!optedIn || !phone) {
      await supabase
        .from('appointment_reminders')
        .update({
          status: 'cancelled',
          error_message: !optedIn ? 'SMS opt-out' : 'No phone number',
        })
        .eq('id', r.id);
      skipped++;
      continue;
    }

    const educatorName = `${appt.educator.first_name ?? ''} ${appt.educator.last_name ?? ''}`.trim();
    const message = buildMessage(r.reminder_type, educatorName, appt.appointment_date, appt.start_time);

    const result = await sms.send(phone, message);

    if (result.success) {
      await supabase
        .from('appointment_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          message_id: result.messageId ?? null,
        })
        .eq('id', r.id);
      sent++;
    } else {
      await supabase
        .from('appointment_reminders')
        .update({
          status: 'failed',
          error_message: result.error ?? 'unknown error',
        })
        .eq('id', r.id);
      failed++;
    }
  }

  return NextResponse.json({ processed, sent, failed, skipped });
}
