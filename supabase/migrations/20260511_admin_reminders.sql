-- Migration: Rappels administratifs MDPH/AEEH/PCH (feature A2)
-- Date: 2026-05-11
-- Permet aux familles de saisir les échéances administratives (MDPH, AEEH, PCH,
-- FIP, PPS) et déclenche des rappels par email + Web Push à J-90, J-60, J-30, J-7.
--
-- Schema: public (données admin / dates d'expiration de droits, pas médicales).
-- Référence : docs/dev/feature-flags-hds.md — feature flag rappelsMdph (non-HDS).

-- ───────────────────────────────────────────────────────────
-- Table : family_admin_reminders
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_admin_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN (
    'mdph_renew',
    'aeeh_expire',
    'pch_expire',
    'fip_end',
    'pps_renew',
    'autre'
  )),
  expires_at DATE NOT NULL,
  label TEXT,
  notes TEXT,

  -- Suivi des notifications envoyées : 0 = aucune, sinon dernier seuil notifié
  last_notified_seuil INT NOT NULL DEFAULT 0
    CHECK (last_notified_seuil IN (0, 90, 60, 30, 7)),
  last_notified_at TIMESTAMPTZ,

  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_admin_reminders_user
  ON public.family_admin_reminders(user_id);

CREATE INDEX IF NOT EXISTS idx_family_admin_reminders_child
  ON public.family_admin_reminders(child_id);

CREATE INDEX IF NOT EXISTS idx_family_admin_reminders_expires
  ON public.family_admin_reminders(expires_at)
  WHERE dismissed_at IS NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_family_admin_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_family_admin_reminders_updated_at ON public.family_admin_reminders;
CREATE TRIGGER trg_family_admin_reminders_updated_at
  BEFORE UPDATE ON public.family_admin_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_family_admin_reminders_updated_at();

-- RLS
ALTER TABLE public.family_admin_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can view own admin reminders" ON public.family_admin_reminders;
CREATE POLICY "User can view own admin reminders"
  ON public.family_admin_reminders
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User can insert own admin reminders" ON public.family_admin_reminders;
CREATE POLICY "User can insert own admin reminders"
  ON public.family_admin_reminders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User can update own admin reminders" ON public.family_admin_reminders;
CREATE POLICY "User can update own admin reminders"
  ON public.family_admin_reminders
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User can delete own admin reminders" ON public.family_admin_reminders;
CREATE POLICY "User can delete own admin reminders"
  ON public.family_admin_reminders
  FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.family_admin_reminders IS
  'Rappels administratifs (A2) : échéances MDPH/AEEH/PCH/FIP/PPS saisies par la famille. Données admin (schema public).';
COMMENT ON COLUMN public.family_admin_reminders.type IS
  'mdph_renew | aeeh_expire | pch_expire | fip_end | pps_renew | autre';
COMMENT ON COLUMN public.family_admin_reminders.expires_at IS
  'Date d''expiration des droits (ou de fin de dispositif).';
COMMENT ON COLUMN public.family_admin_reminders.last_notified_seuil IS
  'Dernier palier de relance envoyé (90, 60, 30, 7) ou 0 si aucune.';
COMMENT ON COLUMN public.family_admin_reminders.dismissed_at IS
  'Si non NULL, la famille a marqué l''échéance comme traitée.';

-- ───────────────────────────────────────────────────────────
-- Table : family_push_subscriptions (Web Push)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,            -- {p256dh, auth}
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_push_subscriptions_user
  ON public.family_push_subscriptions(user_id);

ALTER TABLE public.family_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can view own push subscriptions" ON public.family_push_subscriptions;
CREATE POLICY "User can view own push subscriptions"
  ON public.family_push_subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User can insert own push subscriptions" ON public.family_push_subscriptions;
CREATE POLICY "User can insert own push subscriptions"
  ON public.family_push_subscriptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User can update own push subscriptions" ON public.family_push_subscriptions;
CREATE POLICY "User can update own push subscriptions"
  ON public.family_push_subscriptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User can delete own push subscriptions" ON public.family_push_subscriptions;
CREATE POLICY "User can delete own push subscriptions"
  ON public.family_push_subscriptions
  FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.family_push_subscriptions IS
  'Abonnements Web Push pour les rappels administratifs (A2). Endpoint + clés VAPID p256dh/auth.';
