import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function adminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Schedule SMS reminders (24h + 1h) for an accepted appointment.
 * Idempotent : will not duplicate existing pending reminders for the same appointment.
 */
export async function scheduleAppointmentReminders(
  appointmentId: string,
  scheduledDate: Date
): Promise<void> {
  const supabase = adminClient();

  const reminder24h = new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000);
  const reminder1h = new Date(scheduledDate.getTime() - 60 * 60 * 1000);
  const now = new Date();

  // Cancel any previously pending reminders for this appointment first
  await supabase
    .from('appointment_reminders')
    .update({ status: 'cancelled' })
    .eq('appointment_id', appointmentId)
    .eq('status', 'pending');

  const rows: Array<{
    appointment_id: string;
    reminder_type: '24h' | '1h';
    scheduled_at: string;
  }> = [];

  if (reminder24h > now) {
    rows.push({
      appointment_id: appointmentId,
      reminder_type: '24h',
      scheduled_at: reminder24h.toISOString(),
    });
  }
  if (reminder1h > now) {
    rows.push({
      appointment_id: appointmentId,
      reminder_type: '1h',
      scheduled_at: reminder1h.toISOString(),
    });
  }

  if (rows.length > 0) {
    await supabase.from('appointment_reminders').insert(rows);
  }
}

/**
 * Cancel all pending reminders for an appointment (e.g. when cancelled or no-show).
 */
export async function cancelAppointmentReminders(appointmentId: string): Promise<void> {
  const supabase = adminClient();
  await supabase
    .from('appointment_reminders')
    .update({ status: 'cancelled' })
    .eq('appointment_id', appointmentId)
    .eq('status', 'pending');
}
