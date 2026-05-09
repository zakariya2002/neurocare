import { createClient } from '@supabase/supabase-js';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  CalendarEventInput,
} from './google-calendar';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const FRANCE_TZ = 'Europe/Paris';

interface AppointmentSyncContext {
  appointmentId: string;
  educatorUserId: string;
  familyFirstName?: string | null;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  locationLabel?: string | null;
  appointmentUrl?: string;
}

function buildEventPayload(ctx: AppointmentSyncContext): CalendarEventInput {
  const summary = ctx.familyFirstName
    ? `NeuroCare — RDV avec ${ctx.familyFirstName}`
    : 'NeuroCare — RDV';
  const description = [
    ctx.appointmentUrl ? `Lien NeuroCare : ${ctx.appointmentUrl}` : null,
    'Synchronisé depuis NeuroCare.',
  ]
    .filter(Boolean)
    .join('\n');
  return {
    summary,
    description,
    location: ctx.locationLabel || undefined,
    start: { dateTime: `${ctx.appointmentDate}T${ctx.startTime}`, timeZone: FRANCE_TZ },
    end: { dateTime: `${ctx.appointmentDate}T${ctx.endTime}`, timeZone: FRANCE_TZ },
  };
}

/**
 * Crée (ou met à jour) un event Google Calendar pour un RDV accepté.
 * Silencieux si pas de connexion Google ou sync désactivé.
 */
export async function syncAppointmentToGoogleCalendar(ctx: AppointmentSyncContext): Promise<void> {
  const supabase = getServiceClient();

  const { data: tokenRow } = await supabase
    .from('google_oauth_tokens')
    .select('user_id, sync_enabled, sync_appointments_to_calendar, calendar_id')
    .eq('user_id', ctx.educatorUserId)
    .maybeSingle();

  if (!tokenRow || !tokenRow.sync_enabled || !tokenRow.sync_appointments_to_calendar) return;

  const eventData = buildEventPayload(ctx);

  // existing mapping ?
  const { data: mapping } = await supabase
    .from('google_calendar_events')
    .select('google_event_id, calendar_id')
    .eq('appointment_id', ctx.appointmentId)
    .eq('user_id', ctx.educatorUserId)
    .maybeSingle();

  if (mapping?.google_event_id) {
    const ok = await updateCalendarEvent(ctx.educatorUserId, mapping.google_event_id, eventData);
    if (ok) {
      await supabase
        .from('google_calendar_events')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('appointment_id', ctx.appointmentId)
        .eq('user_id', ctx.educatorUserId);
    }
    return;
  }

  const eventId = await createCalendarEvent(ctx.educatorUserId, eventData);
  if (!eventId) return;

  await supabase.from('google_calendar_events').insert({
    appointment_id: ctx.appointmentId,
    user_id: ctx.educatorUserId,
    google_event_id: eventId,
    calendar_id: tokenRow.calendar_id || 'primary',
  });
  await supabase
    .from('google_oauth_tokens')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('user_id', ctx.educatorUserId);
}

/**
 * Supprime l'event Google associé à un RDV (annulation / no-show / completion).
 */
export async function removeAppointmentFromGoogleCalendar(appointmentId: string, educatorUserId: string): Promise<void> {
  const supabase = getServiceClient();

  const { data: mapping } = await supabase
    .from('google_calendar_events')
    .select('google_event_id')
    .eq('appointment_id', appointmentId)
    .eq('user_id', educatorUserId)
    .maybeSingle();

  if (!mapping?.google_event_id) return;

  await deleteCalendarEvent(educatorUserId, mapping.google_event_id);
  await supabase
    .from('google_calendar_events')
    .delete()
    .eq('appointment_id', appointmentId)
    .eq('user_id', educatorUserId);
}
