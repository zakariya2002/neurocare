-- Migration: Annuaire externe géolocalisé (feature A5)
-- Date: 2026-05-11
-- Référence : docs/dev/feature-flags-hds.md — feature flag annuaireExterne (non-HDS).
--
-- Stocke les acteurs publics du parcours TND (PCO, CRA, MDPH, CAMSP) avec
-- leurs coordonnées géographiques pour exposer un annuaire SEO public
-- indexable. Données 100% publiques (sites officiels), schema `public`.
--
-- Sources prévues (pour ingestion ultérieure exhaustive) :
--   - handicap.gouv.fr (PCO, MDPH)
--   - cnsa.fr (annuaire MDPH)
--   - gncra.fr (CRA)
--   - data.gouv.fr / FINESS (CAMSP)
--
-- Pour le MVP, seed manuel via `scripts/seed-annuaire.ts` à partir des
-- fichiers `data/annuaire/*.json`.

CREATE TABLE IF NOT EXISTS public.external_directory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('pco', 'cra', 'mdph', 'camsp')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  department_code TEXT,           -- '75', '69', '2A', '971'
  region_code TEXT,               -- '11' (IDF), '93' (PACA), '01' (Guadeloupe)
  phone TEXT,
  email TEXT,
  website TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  source_label TEXT,              -- 'handicap.gouv.fr', 'cnsa.fr', 'gncra.fr', etc.
  source_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT external_directory_entries_type_slug_unique UNIQUE (type, slug)
);

CREATE INDEX IF NOT EXISTS idx_external_directory_type_dept
  ON public.external_directory_entries (type, department_code)
  WHERE is_published;

CREATE INDEX IF NOT EXISTS idx_external_directory_city
  ON public.external_directory_entries (city)
  WHERE is_published;

CREATE INDEX IF NOT EXISTS idx_external_directory_postal_code
  ON public.external_directory_entries (postal_code)
  WHERE is_published;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_external_directory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_external_directory_updated_at ON public.external_directory_entries;
CREATE TRIGGER trg_external_directory_updated_at
  BEFORE UPDATE ON public.external_directory_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_external_directory_updated_at();

-- RLS : lecture publique des entrées publiées, écriture admin uniquement.
ALTER TABLE public.external_directory_entries ENABLE ROW LEVEL SECURITY;

-- SELECT : tout le monde (anonyme inclus) peut lire les entrées publiées.
DROP POLICY IF EXISTS "Public can read published directory entries"
  ON public.external_directory_entries;
CREATE POLICY "Public can read published directory entries"
  ON public.external_directory_entries
  FOR SELECT
  USING (is_published = TRUE);

-- INSERT/UPDATE/DELETE : réservé aux admins (rôle dans auth.users.raw_user_meta_data).
DROP POLICY IF EXISTS "Admins can insert directory entries"
  ON public.external_directory_entries;
CREATE POLICY "Admins can insert directory entries"
  ON public.external_directory_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND (u.raw_user_meta_data->>'role') = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update directory entries"
  ON public.external_directory_entries;
CREATE POLICY "Admins can update directory entries"
  ON public.external_directory_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND (u.raw_user_meta_data->>'role') = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND (u.raw_user_meta_data->>'role') = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete directory entries"
  ON public.external_directory_entries;
CREATE POLICY "Admins can delete directory entries"
  ON public.external_directory_entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND (u.raw_user_meta_data->>'role') = 'admin'
    )
  );

COMMENT ON TABLE public.external_directory_entries IS
  'Annuaire externe A5 : PCO, CRA, MDPH, CAMSP (acteurs publics du parcours TND). Données 100% publiques, schema public.';
COMMENT ON COLUMN public.external_directory_entries.type IS
  'pco = Plateforme de Coordination et d''Orientation TND ; cra = Centre Ressources Autisme ; mdph = Maison Départementale des Personnes Handicapées ; camsp = Centre d''Action Médico-Sociale Précoce.';
COMMENT ON COLUMN public.external_directory_entries.slug IS
  'Slug URL unique par type (ex: pco-paris-75, mdph-rhone-69).';
COMMENT ON COLUMN public.external_directory_entries.source_label IS
  'Source de la donnée pour citation publique (ex: handicap.gouv.fr).';
COMMENT ON COLUMN public.external_directory_entries.is_published IS
  'False = brouillon admin, masqué de l''annuaire public.';
