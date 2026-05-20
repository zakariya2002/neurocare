-- ============================================
-- Annonces familles : publication de besoins par les familles, réponse par les pros
-- ============================================
-- Date : 2026-05-20
-- Une famille publie une annonce (type d'accompagnement recherché, zone géo,
-- horaires, profil pro voulu). Après pré-modération admin, l'annonce devient
-- publique et les éducateurs peuvent y répondre. La famille peut sélectionner
-- un pro ; la transaction (commission plateforme 12 %) est gérée hors de cette
-- migration via Stripe Connect.

-- ─── Table principale : family_announcements ───
CREATE TABLE IF NOT EXISTS public.family_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.family_profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.child_profiles(id) ON DELETE SET NULL,

  -- Contenu de l'annonce
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  accompaniment_types TEXT[] NOT NULL DEFAULT '{}',           -- educatif, scolaire, sport_adapte, guidance_parentale, comportemental, liberal
  desired_professions TEXT[] NOT NULL DEFAULT '{}',           -- educateur_specialise, psychomotricien, psychologue, ergotherapeute, orthophoniste, aes_aesh, sportif_adapte, autre
  tnd_context TEXT[] NOT NULL DEFAULT '{}',                   -- TSA, TDAH, DYS, HPI, TDI, AUTRE
  person_age INTEGER CHECK (person_age IS NULL OR person_age BETWEEN 0 AND 120),
  gender_preference TEXT NOT NULL DEFAULT 'any' CHECK (gender_preference IN ('any', 'male', 'female')),

  -- Localisation
  location_label TEXT NOT NULL,                               -- adresse formatée affichable (ex: "75002 Paris")
  city TEXT NOT NULL,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  radius_km INTEGER NOT NULL DEFAULT 10 CHECK (radius_km BETWEEN 1 AND 100),
  place_types TEXT[] NOT NULL DEFAULT '{domicile}',           -- domicile, cabinet, ecole, institut, club_sport, autre

  -- Horaires
  hours_per_week NUMERIC(5,2) CHECK (hours_per_week IS NULL OR hours_per_week > 0),
  schedule_preferences JSONB,                                 -- { days: ['monday', ...], time_ranges: [{ start: '09:00', end: '12:00' }] }
  start_date DATE,
  start_date_flexibility TEXT NOT NULL DEFAULT 'flexible' CHECK (start_date_flexibility IN ('immediate', 'flexible', 'fixed')),

  -- Workflow modération + cycle de vie
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'expired', 'filled', 'archived')),
  rejection_reason TEXT,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  filled_by_response_id UUID,                                 -- FK vers announcement_responses (ajoutée plus bas pour éviter dépendance circulaire)

  -- Compteurs (maintenus par l'app ou par triggers, mais non bloquants pour le MVP)
  view_count INTEGER NOT NULL DEFAULT 0,
  response_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT title_min_length CHECK (length(trim(title)) >= 8),
  CONSTRAINT description_min_length CHECK (length(trim(description)) >= 30)
);

-- Index recherche & cycle de vie
CREATE INDEX IF NOT EXISTS idx_family_announcements_family ON public.family_announcements(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_announcements_status ON public.family_announcements(status, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_family_announcements_expiry ON public.family_announcements(status, expires_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_family_announcements_city ON public.family_announcements(city) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_family_announcements_geo ON public.family_announcements(latitude, longitude) WHERE status = 'published' AND latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_family_announcements_accompaniment ON public.family_announcements USING GIN (accompaniment_types) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_family_announcements_professions ON public.family_announcements USING GIN (desired_professions) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_family_announcements_tnd ON public.family_announcements USING GIN (tnd_context) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_family_announcements_moderation ON public.family_announcements(status, created_at) WHERE status = 'pending';

-- ─── Table des réponses : announcement_responses ───
CREATE TABLE IF NOT EXISTS public.announcement_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.family_announcements(id) ON DELETE CASCADE,
  educator_id UUID NOT NULL REFERENCES public.educator_profiles(id) ON DELETE CASCADE,

  message TEXT NOT NULL,
  proposed_hourly_rate NUMERIC(8,2) CHECK (proposed_hourly_rate IS NULL OR proposed_hourly_rate >= 0),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'shortlisted', 'accepted', 'declined', 'withdrawn')),
  read_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT message_min_length CHECK (length(trim(message)) >= 20)
);

-- Une seule candidature active par pro par annonce (les retraits sont conservés en historique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_announcement_responses_unique_active
  ON public.announcement_responses(announcement_id, educator_id)
  WHERE status <> 'withdrawn';

CREATE INDEX IF NOT EXISTS idx_announcement_responses_announcement ON public.announcement_responses(announcement_id, status);
CREATE INDEX IF NOT EXISTS idx_announcement_responses_educator ON public.announcement_responses(educator_id, created_at DESC);

-- FK retardée pour la candidature retenue
ALTER TABLE public.family_announcements
  ADD CONSTRAINT family_announcements_filled_by_fk
  FOREIGN KEY (filled_by_response_id) REFERENCES public.announcement_responses(id) ON DELETE SET NULL;

-- ─── Fonctions & triggers ───

-- updated_at générique (scopé à ces deux tables)
CREATE OR REPLACE FUNCTION public.tg_family_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_family_announcements_updated_at ON public.family_announcements;
CREATE TRIGGER trg_family_announcements_updated_at
  BEFORE UPDATE ON public.family_announcements
  FOR EACH ROW EXECUTE FUNCTION public.tg_family_announcements_updated_at();

DROP TRIGGER IF EXISTS trg_announcement_responses_updated_at ON public.announcement_responses;
CREATE TRIGGER trg_announcement_responses_updated_at
  BEFORE UPDATE ON public.announcement_responses
  FOR EACH ROW EXECUTE FUNCTION public.tg_family_announcements_updated_at();

-- Quand l'admin passe une annonce à 'published', renseigner published_at + expires_at (60 jours)
CREATE OR REPLACE FUNCTION public.tg_family_announcements_publication()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') THEN
    NEW.published_at := COALESCE(NEW.published_at, NOW());
    NEW.expires_at := COALESCE(NEW.expires_at, NOW() + INTERVAL '60 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_family_announcements_publication ON public.family_announcements;
CREATE TRIGGER trg_family_announcements_publication
  BEFORE UPDATE ON public.family_announcements
  FOR EACH ROW EXECUTE FUNCTION public.tg_family_announcements_publication();

-- Maintien du compteur de réponses sur l'annonce (les retraits ne décrémentent pas, ils restent dans l'historique)
CREATE OR REPLACE FUNCTION public.tg_announcement_responses_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.family_announcements
       SET response_count = response_count + 1
     WHERE id = NEW.announcement_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.family_announcements
       SET response_count = GREATEST(response_count - 1, 0)
     WHERE id = OLD.announcement_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_announcement_responses_count ON public.announcement_responses;
CREATE TRIGGER trg_announcement_responses_count
  AFTER INSERT OR DELETE ON public.announcement_responses
  FOR EACH ROW EXECUTE FUNCTION public.tg_announcement_responses_count();

-- ─── RLS : family_announcements ───
ALTER TABLE public.family_announcements ENABLE ROW LEVEL SECURITY;

-- Famille : voit / crée / modifie / supprime ses propres annonces (tous statuts)
DROP POLICY IF EXISTS "Family selects own announcements" ON public.family_announcements;
CREATE POLICY "Family selects own announcements" ON public.family_announcements
  FOR SELECT USING (
    family_id IN (SELECT id FROM public.family_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Family inserts own announcements" ON public.family_announcements;
CREATE POLICY "Family inserts own announcements" ON public.family_announcements
  FOR INSERT WITH CHECK (
    family_id IN (SELECT id FROM public.family_profiles WHERE user_id = auth.uid())
  );

-- Famille : ne peut pas modifier le verdict admin (status reste sous contrôle service_role pour pending→published/rejected)
-- L'app force le passage à 'pending' à chaque édition côté famille (re-modération).
DROP POLICY IF EXISTS "Family updates own announcements" ON public.family_announcements;
CREATE POLICY "Family updates own announcements" ON public.family_announcements
  FOR UPDATE USING (
    family_id IN (SELECT id FROM public.family_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Family deletes own announcements" ON public.family_announcements;
CREATE POLICY "Family deletes own announcements" ON public.family_announcements
  FOR DELETE USING (
    family_id IN (SELECT id FROM public.family_profiles WHERE user_id = auth.uid())
  );

-- Lecture publique des annonces publiées et non expirées (anonymes + éducateurs)
DROP POLICY IF EXISTS "Anyone selects published announcements" ON public.family_announcements;
CREATE POLICY "Anyone selects published announcements" ON public.family_announcements
  FOR SELECT USING (
    status = 'published' AND (expires_at IS NULL OR expires_at > NOW())
  );

-- ─── RLS : announcement_responses ───
ALTER TABLE public.announcement_responses ENABLE ROW LEVEL SECURITY;

-- Pro : voit / crée / modifie ses propres réponses
DROP POLICY IF EXISTS "Educator selects own responses" ON public.announcement_responses;
CREATE POLICY "Educator selects own responses" ON public.announcement_responses
  FOR SELECT USING (
    educator_id IN (SELECT id FROM public.educator_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Educator inserts own response" ON public.announcement_responses;
CREATE POLICY "Educator inserts own response" ON public.announcement_responses
  FOR INSERT WITH CHECK (
    educator_id IN (SELECT id FROM public.educator_profiles WHERE user_id = auth.uid())
    AND announcement_id IN (
      SELECT id FROM public.family_announcements
       WHERE status = 'published' AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

DROP POLICY IF EXISTS "Educator updates own response" ON public.announcement_responses;
CREATE POLICY "Educator updates own response" ON public.announcement_responses
  FOR UPDATE USING (
    educator_id IN (SELECT id FROM public.educator_profiles WHERE user_id = auth.uid())
  );

-- Famille : voit / met à jour le statut (read, shortlisted, accepted, declined) des réponses sur ses annonces
DROP POLICY IF EXISTS "Family selects responses on own announcements" ON public.announcement_responses;
CREATE POLICY "Family selects responses on own announcements" ON public.announcement_responses
  FOR SELECT USING (
    announcement_id IN (
      SELECT a.id FROM public.family_announcements a
      JOIN public.family_profiles fp ON fp.id = a.family_id
      WHERE fp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Family updates responses on own announcements" ON public.announcement_responses;
CREATE POLICY "Family updates responses on own announcements" ON public.announcement_responses
  FOR UPDATE USING (
    announcement_id IN (
      SELECT a.id FROM public.family_announcements a
      JOIN public.family_profiles fp ON fp.id = a.family_id
      WHERE fp.user_id = auth.uid()
    )
  );

-- ─── Commentaires ───
COMMENT ON TABLE public.family_announcements IS 'Annonces publiées par les familles à destination des professionnels. Pré-modération admin avant publication. Source de revenus = commission 12 % sur la transaction quand un pro est retenu (via Stripe Connect).';
COMMENT ON TABLE public.announcement_responses IS 'Candidatures déposées par les pros en réponse à une annonce famille publiée.';
COMMENT ON COLUMN public.family_announcements.filled_by_response_id IS 'Pointe vers la candidature retenue par la famille lorsque l''annonce passe à filled.';
COMMENT ON COLUMN public.family_announcements.expires_at IS 'Date d''expiration auto (60 j après publication). Cron quotidien passe status à expired.';
