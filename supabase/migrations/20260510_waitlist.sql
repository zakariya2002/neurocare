-- Migration: Liste d'attente intelligente
-- Date: 2026-05-10
-- Permet aux familles de s'inscrire en liste d'attente sur un éducateur
-- et d'être notifiées par email quand un créneau correspondant à leurs critères se libère.

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  educator_id UUID NOT NULL REFERENCES educator_profiles(id) ON DELETE CASCADE,

  -- Critères de la demande
  preferred_days TEXT[] NOT NULL DEFAULT '{}', -- ['monday', 'tuesday', ...]
  preferred_time_range JSONB, -- { "start": "09:00", "end": "12:00" }
  child_id UUID REFERENCES child_profiles(id) ON DELETE SET NULL,
  notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matched', 'cancelled', 'expired')),
  matched_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  matched_at TIMESTAMPTZ,
  notified_count INTEGER NOT NULL DEFAULT 0,
  last_notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Empêche les doublons actifs sur le même couple (famille, pro)
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_unique_active
  ON waitlist_entries(family_id, educator_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_waitlist_educator_active
  ON waitlist_entries(educator_id, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_waitlist_family
  ON waitlist_entries(family_id);

-- RLS
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family can view own entries" ON waitlist_entries;
CREATE POLICY "Family can view own entries" ON waitlist_entries
  FOR SELECT USING (family_id = auth.uid());

DROP POLICY IF EXISTS "Family can insert own entries" ON waitlist_entries;
CREATE POLICY "Family can insert own entries" ON waitlist_entries
  FOR INSERT WITH CHECK (family_id = auth.uid());

DROP POLICY IF EXISTS "Family can update own entries" ON waitlist_entries;
CREATE POLICY "Family can update own entries" ON waitlist_entries
  FOR UPDATE USING (family_id = auth.uid());

DROP POLICY IF EXISTS "Educator can view entries on their profile" ON waitlist_entries;
CREATE POLICY "Educator can view entries on their profile" ON waitlist_entries
  FOR SELECT USING (
    educator_id IN (
      SELECT id FROM educator_profiles WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE waitlist_entries IS 'Liste d''attente : familles notifiées par email quand un créneau correspondant à leurs critères se libère chez un éducateur.';
