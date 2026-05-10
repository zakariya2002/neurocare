-- Migration: Module scolarité light (feature B3')
-- Date: 2026-05-11
-- Permet aux familles de centraliser les métadonnées scolaires d'un enfant TND
-- (école, classe, dispositif PPS/PAP/PAI/..., AESH, dates ESS, acteurs scolaires)
-- année par année.
--
-- Schema: public — NON-HDS.
-- Important : on stocke uniquement la VALEUR CATÉGORIELLE des dispositifs
-- ("pai" = présence d'un Projet d'Accueil Individualisé), JAMAIS le contenu
-- médical du dispositif. Aucune observation médicale n'est stockée ici.
-- Référence : docs/dev/feature-flags-hds.md — feature flag scolarite (non-HDS).

-- ============================================================================
-- Table 1 : child_school_year
-- Une ligne = une année scolaire pour un enfant
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.child_school_year (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  school_year TEXT NOT NULL,                  -- "2025-2026"

  -- École
  school_name TEXT,
  school_type TEXT CHECK (school_type IN (
    'creche','maternelle','elementaire','college','lycee',
    'ime','ueea','uema','homeschool','none','other'
  )),
  school_address TEXT,
  school_postal_code TEXT,
  school_city TEXT,

  -- Classe / niveau
  level TEXT,

  -- Enseignant principal (coordonnées admin uniquement)
  teacher_name TEXT,
  teacher_email TEXT,
  teacher_phone TEXT,

  -- Dispositifs : valeurs catégorielles uniquement
  -- ('pps','pap','pai','ppre','ulis','segpa','aucun')
  devices TEXT[] NOT NULL DEFAULT '{}',

  -- AESH
  has_aesh BOOLEAN NOT NULL DEFAULT FALSE,
  aesh_hours_per_week NUMERIC(4,1),
  aesh_first_name TEXT,

  -- Équipe de Suivi de Scolarité
  last_ess_date DATE,
  next_ess_date DATE,

  -- Notes administratives non médicales (limité à 2000 caractères côté UI)
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Une seule ligne par couple (enfant, année scolaire)
  CONSTRAINT child_school_year_unique UNIQUE (child_id, school_year)
);

CREATE INDEX IF NOT EXISTS idx_child_school_year_child
  ON public.child_school_year(child_id);

CREATE INDEX IF NOT EXISTS idx_child_school_year_user
  ON public.child_school_year(user_id);

CREATE INDEX IF NOT EXISTS idx_child_school_year_year
  ON public.child_school_year(child_id, school_year DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_child_school_year_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_child_school_year_updated_at ON public.child_school_year;
CREATE TRIGGER trg_child_school_year_updated_at
  BEFORE UPDATE ON public.child_school_year
  FOR EACH ROW
  EXECUTE FUNCTION public.set_child_school_year_updated_at();

-- RLS
ALTER TABLE public.child_school_year ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can view own child school years" ON public.child_school_year;
CREATE POLICY "User can view own child school years"
  ON public.child_school_year
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.child_profiles cp
      JOIN public.family_profiles fp ON fp.id = cp.family_id
      WHERE cp.id = child_school_year.child_id
        AND fp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "User can insert own child school years" ON public.child_school_year;
CREATE POLICY "User can insert own child school years"
  ON public.child_school_year
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.child_profiles cp
      JOIN public.family_profiles fp ON fp.id = cp.family_id
      WHERE cp.id = child_school_year.child_id
        AND fp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "User can update own child school years" ON public.child_school_year;
CREATE POLICY "User can update own child school years"
  ON public.child_school_year
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User can delete own child school years" ON public.child_school_year;
CREATE POLICY "User can delete own child school years"
  ON public.child_school_year
  FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.child_school_year IS
  'B3 scolarité light : métadonnées scolaires non médicales d''un enfant pour une année donnée. Contient uniquement des coordonnées et des valeurs catégorielles de dispositifs (PPS/PAP/PAI/...), JAMAIS de contenu médical (schema public).';
COMMENT ON COLUMN public.child_school_year.devices IS
  'Codes catégoriels des dispositifs en place : pps, pap, pai, ppre, ulis, segpa, aucun. Ne pas stocker le contenu médical du dispositif.';
COMMENT ON COLUMN public.child_school_year.notes IS
  'Notes administratives non médicales — limité à 2000 caractères côté UI.';

-- ============================================================================
-- Table 2 : child_school_actors
-- Acteurs gravitant autour de la scolarité de l'enfant pour une année donnée
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.child_school_actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_school_year_id UUID NOT NULL
    REFERENCES public.child_school_year(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  role TEXT NOT NULL CHECK (role IN (
    'enseignant_referent_mdph',
    'medecin_scolaire',
    'psy_en',
    'directeur_etablissement',
    'aesh',
    'educateur_specialise',
    'autre'
  )),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_school_actors_year
  ON public.child_school_actors(child_school_year_id);

CREATE INDEX IF NOT EXISTS idx_child_school_actors_user
  ON public.child_school_actors(user_id);

-- RLS
ALTER TABLE public.child_school_actors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can view own school actors" ON public.child_school_actors;
CREATE POLICY "User can view own school actors"
  ON public.child_school_actors
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.child_school_year csy
      WHERE csy.id = child_school_actors.child_school_year_id
        AND csy.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "User can insert own school actors" ON public.child_school_actors;
CREATE POLICY "User can insert own school actors"
  ON public.child_school_actors
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.child_school_year csy
      WHERE csy.id = child_school_actors.child_school_year_id
        AND csy.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "User can update own school actors" ON public.child_school_actors;
CREATE POLICY "User can update own school actors"
  ON public.child_school_actors
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User can delete own school actors" ON public.child_school_actors;
CREATE POLICY "User can delete own school actors"
  ON public.child_school_actors
  FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.child_school_actors IS
  'B3 scolarité light : acteurs scolaires (enseignant référent MDPH, médecin scolaire, psy EN, directeur, AESH, etc.) pour une année donnée. Coordonnées admin uniquement, pas de données médicales (schema public).';
