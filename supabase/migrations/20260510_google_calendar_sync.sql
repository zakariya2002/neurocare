-- Google Calendar 2-way sync — Sprint 1
-- 1) Tokens OAuth + settings de sync
-- 2) Mapping appointments ↔ Google events

CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  sync_enabled BOOLEAN DEFAULT true,
  sync_appointments_to_calendar BOOLEAN DEFAULT true,
  block_from_calendar BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gtokens_user ON google_oauth_tokens(user_id);

ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own tokens" ON google_oauth_tokens;
CREATE POLICY "Users see own tokens" ON google_oauth_tokens
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Mapping appointments ↔ Google Calendar events
CREATE TABLE IF NOT EXISTS google_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appointment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gcal_events_appt ON google_calendar_events(appointment_id);
CREATE INDEX IF NOT EXISTS idx_gcal_events_user ON google_calendar_events(user_id);

ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own gcal events" ON google_calendar_events;
CREATE POLICY "Users see own gcal events" ON google_calendar_events
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_google_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS google_oauth_tokens_updated_at ON google_oauth_tokens;
CREATE TRIGGER google_oauth_tokens_updated_at
  BEFORE UPDATE ON google_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_google_oauth_tokens_updated_at();
