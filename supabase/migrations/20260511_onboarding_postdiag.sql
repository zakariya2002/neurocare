-- Migration: Onboarding post-diagnostic (feature A1)
-- Date: 2026-05-11
-- Permet aux familles de suivre la progression d'un wizard "Premiers pas" structurant
-- les démarches (médecin référent, MDPH, PCO/FIP, école, aides) après un diagnostic TND.
--
-- Schema: public (données admin / coordonnées / scolaires non médicales).
-- Référence : docs/dev/feature-flags-hds.md — feature flag onboardingPostDiag (non-HDS).

CREATE TABLE IF NOT EXISTS public.family_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,

  -- Une étape = un objet JSON {completed: bool, ...donnees}
  -- step_doctor    : {name, city, phone, completed}
  -- step_mdph      : {status, expires_at, department, completed}
  -- step_pco_fip   : {pco_oriented, fip_active, fip_started_at, completed}
  -- step_school    : {school_type, device, has_aesh, completed}
  -- step_aids      : {aids: string[], completed}
  step_doctor JSONB,
  step_mdph JSONB,
  step_pco_fip JSONB,
  step_school JSONB,
  step_aids JSONB,

  dismissed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Une seule progression par couple (utilisateur, enfant)
  CONSTRAINT family_onboarding_progress_unique_user_child UNIQUE (user_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_family_onboarding_user
  ON public.family_onboarding_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_family_onboarding_child
  ON public.family_onboarding_progress(child_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_family_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_family_onboarding_updated_at ON public.family_onboarding_progress;
CREATE TRIGGER trg_family_onboarding_updated_at
  BEFORE UPDATE ON public.family_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_family_onboarding_updated_at();

-- RLS
ALTER TABLE public.family_onboarding_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can view own onboarding progress" ON public.family_onboarding_progress;
CREATE POLICY "User can view own onboarding progress"
  ON public.family_onboarding_progress
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "User can insert own onboarding progress" ON public.family_onboarding_progress;
CREATE POLICY "User can insert own onboarding progress"
  ON public.family_onboarding_progress
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User can update own onboarding progress" ON public.family_onboarding_progress;
CREATE POLICY "User can update own onboarding progress"
  ON public.family_onboarding_progress
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User can delete own onboarding progress" ON public.family_onboarding_progress;
CREATE POLICY "User can delete own onboarding progress"
  ON public.family_onboarding_progress
  FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.family_onboarding_progress IS
  'Onboarding post-diagnostic A1 : progression du wizard "Premiers pas" par enfant. Données admin/coordonnées non médicales (schema public).';
COMMENT ON COLUMN public.family_onboarding_progress.step_doctor IS
  'Médecin référent / pédiatre : {name, city, phone, completed}.';
COMMENT ON COLUMN public.family_onboarding_progress.step_mdph IS
  'Démarche MDPH : {status (never|in_progress|granted|denied), expires_at, department, completed}.';
COMMENT ON COLUMN public.family_onboarding_progress.step_pco_fip IS
  'PCO/FIP : {pco_oriented (yes|no|unknown), fip_active (yes|no), fip_started_at, completed}.';
COMMENT ON COLUMN public.family_onboarding_progress.step_school IS
  'Scolarité (admin) : {school_type, device (pps|pap|none|unknown), has_aesh, completed}.';
COMMENT ON COLUMN public.family_onboarding_progress.step_aids IS
  'Aides connues : {aids: string[], completed}. Codes : aeeh, pch, cesu, complement_aeeh, none, other.';
COMMENT ON COLUMN public.family_onboarding_progress.dismissed_at IS
  'Si non NULL, l''utilisateur a choisi de ne plus afficher le wizard ; la checklist reste accessible.';
COMMENT ON COLUMN public.family_onboarding_progress.completed_at IS
  'Si non NULL, les 5 étapes ont été soit complétées soit skippées.';
