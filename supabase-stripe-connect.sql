-- ═══════════════════════════════════════════════════════
-- STRIPE CONNECT EXPRESS - Migration pour NeuroCare
-- Permet le paiement direct des éducateurs via Stripe
-- ═══════════════════════════════════════════════════════

-- 1. Ajouter les colonnes Stripe Connect aux profils éducateurs
ALTER TABLE educator_profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_completed_at TIMESTAMPTZ;

-- Index pour recherche rapide par stripe_account_id
CREATE INDEX IF NOT EXISTS idx_educator_stripe_account ON educator_profiles(stripe_account_id);

-- 2. Table de suivi des transferts vers les comptes connectés
CREATE TABLE IF NOT EXISTS stripe_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  educator_id UUID REFERENCES educator_profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_transfer_id TEXT NOT NULL,
  stripe_account_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- en centimes
  currency VARCHAR(3) DEFAULT 'eur',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_educator ON stripe_transfers(educator_id);
CREATE INDEX IF NOT EXISTS idx_transfers_appointment ON stripe_transfers(appointment_id);

-- 3. RLS pour stripe_transfers
ALTER TABLE stripe_transfers ENABLE ROW LEVEL SECURITY;

-- Les éducateurs peuvent voir leurs propres transferts
CREATE POLICY "educators_view_own_transfers" ON stripe_transfers
  FOR SELECT
  USING (
    educator_id IN (
      SELECT id FROM educator_profiles WHERE user_id = auth.uid()
    )
  );

-- Seul le service role peut insérer/modifier (via API routes)
CREATE POLICY "service_role_manage_transfers" ON stripe_transfers
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
