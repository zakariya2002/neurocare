-- Table de suivi des relances email envoyées aux éducateurs
CREATE TABLE IF NOT EXISTS educator_relances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  educator_id UUID NOT NULL REFERENCES educator_profiles(id) ON DELETE CASCADE,
  template VARCHAR(10) NOT NULL, -- 'j1', 'j3', 'j7'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by UUID, -- admin user id
  status VARCHAR(20) DEFAULT 'sent' -- 'sent', 'failed'
);

CREATE INDEX idx_relances_educator ON educator_relances(educator_id);
CREATE INDEX idx_relances_sent_at ON educator_relances(sent_at DESC);
