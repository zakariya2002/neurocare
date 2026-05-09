-- Appointment SMS reminders + family SMS settings
-- Sprint 1 — SMS rappels RDV (Twilio)

CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_reminders_scheduled
  ON appointment_reminders(scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment
  ON appointment_reminders(appointment_id);

-- RLS : the cron uses service-role and bypasses RLS. Lock down direct access.
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Pros and families can read reminders for their own appointments
CREATE POLICY "appointment_reminders_select_own"
  ON appointment_reminders FOR SELECT
  USING (
    appointment_id IN (
      SELECT id FROM appointments
      WHERE educator_id IN (SELECT id FROM educator_profiles WHERE user_id = auth.uid())
         OR family_id IN (SELECT id FROM family_profiles WHERE user_id = auth.uid())
    )
  );

-- Family SMS settings : opt-in for SMS reminders
ALTER TABLE family_profiles
  ADD COLUMN IF NOT EXISTS sms_reminders_enabled BOOLEAN NOT NULL DEFAULT true;
