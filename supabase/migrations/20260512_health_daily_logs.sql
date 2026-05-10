-- HDS-required: contains health data (article 9 RGPD)
-- This schema must reside on an HDS-certified host before production rollout.
--
-- Migration : Journal de bord quotidien enfant (B1).
-- Schema   : health.* — données médicales (sommeil, comportements, médicaments,
--            émotion, photo, note libre).
-- Feature  : FEATURES.journalBord (off par défaut).
-- Sécurité : RLS sur les 4 tables. Lecture étendue aux pros invités via
--            public.ppa_collaborations (dossier complet, status='accepted').
--            Écriture toujours réservée à l'utilisateur famille propriétaire,
--            sauf comment.s qui acceptent l'écriture du collaborateur invité.

CREATE SCHEMA IF NOT EXISTS health;

-- ============================================================================
-- Helper : un utilisateur a-t-il un accès collaborateur LECTURE sur un enfant ?
-- ============================================================================
-- En staging (fallback Supabase général), la jointure cross-schema vers
-- public.ppa_collaborations fonctionne. En prod HDS, public.* vit sur le
-- Supabase général : il faudra remplacer ce helper par une RPC distante ou
-- répliquer la table de collaborations vers l'instance HDS.
-- TODO HDS : voir docs/dev/feature-flags-hds.md — bascule infra.

CREATE OR REPLACE FUNCTION health.has_dossier_read_access(target_child_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, health
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ppa_collaborations c
    JOIN public.educator_profiles e ON e.id = c.invited_educator_id
    WHERE c.child_id = target_child_id
      AND c.status = 'accepted'
      AND e.user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION health.has_dossier_read_access(uuid) TO authenticated;

-- ============================================================================
-- Table 1 : health.child_daily_logs
-- Une ligne par (enfant, jour). Saisie quotidienne synthétique du parent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS health.child_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK logique vers public.child_profiles(id) — pas de FK cross-schema en prod HDS.
  child_id uuid NOT NULL,
  -- FK logique vers auth.users(id).
  user_id uuid NOT NULL,
  log_date date NOT NULL,

  -- Sommeil
  sleep_bedtime time,
  sleep_waketime time,
  sleep_quality smallint CHECK (sleep_quality BETWEEN 1 AND 5),
  night_wakings smallint CHECK (night_wakings >= 0 AND night_wakings <= 20),

  -- Repas
  meals_score smallint CHECK (meals_score BETWEEN 1 AND 5),
  meal_tags text[] NOT NULL DEFAULT '{}',

  -- Émotion principale
  emotion_main text CHECK (emotion_main IN (
    'joie','colere','peur','tristesse','degout','surprise','calme'
  )),
  emotion_intensity smallint CHECK (emotion_intensity BETWEEN 1 AND 5),

  -- Comportements
  behavior_tags text[] NOT NULL DEFAULT '{}',

  -- Médicaments : [{ med_id: uuid, time: 'HH:MM', taken: boolean }, ...]
  medications_taken jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Contexte (déclencheurs / événementiels)
  context_tags text[] NOT NULL DEFAULT '{}',

  -- Photo (1 max) — chemin dans le bucket health-journal-photos
  photo_path text,

  -- Note libre courte
  free_note text CHECK (free_note IS NULL OR length(free_note) <= 280),

  -- Score bien-être global agrégé (1-5) calculé côté API à chaque écriture
  wellbeing_score smallint CHECK (wellbeing_score IS NULL OR wellbeing_score BETWEEN 1 AND 5),

  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT child_daily_logs_unique UNIQUE (child_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_child_daily_logs_child_date
  ON health.child_daily_logs (child_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_child_daily_logs_user
  ON health.child_daily_logs (user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION health.set_child_daily_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_child_daily_logs_updated_at ON health.child_daily_logs;
CREATE TRIGGER trg_child_daily_logs_updated_at
  BEFORE UPDATE ON health.child_daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION health.set_child_daily_logs_updated_at();

ALTER TABLE health.child_daily_logs ENABLE ROW LEVEL SECURITY;

-- Famille propriétaire : tous droits
DROP POLICY IF EXISTS "owner_select_daily_logs" ON health.child_daily_logs;
CREATE POLICY "owner_select_daily_logs"
  ON health.child_daily_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_insert_daily_logs" ON health.child_daily_logs;
CREATE POLICY "owner_insert_daily_logs"
  ON health.child_daily_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_update_daily_logs" ON health.child_daily_logs;
CREATE POLICY "owner_update_daily_logs"
  ON health.child_daily_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_delete_daily_logs" ON health.child_daily_logs;
CREATE POLICY "owner_delete_daily_logs"
  ON health.child_daily_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Pro collaborateur : lecture seule via collaboration acceptée
DROP POLICY IF EXISTS "collab_select_daily_logs" ON health.child_daily_logs;
CREATE POLICY "collab_select_daily_logs"
  ON health.child_daily_logs FOR SELECT
  TO authenticated
  USING (health.has_dossier_read_access(child_id));

COMMENT ON TABLE health.child_daily_logs IS
  'B1 Journal de bord — saisie quotidienne du parent (sommeil, repas, émotion, comportements, médicaments, photo, note). HDS-required.';

-- ============================================================================
-- Table 2 : health.child_medications
-- Liste des traitements préconfigurés par enfant, à cocher dans le log du jour.
-- ============================================================================

CREATE TABLE IF NOT EXISTS health.child_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  dose text CHECK (dose IS NULL OR length(dose) <= 120),
  notes text CHECK (notes IS NULL OR length(notes) <= 500),
  active boolean NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_medications_child
  ON health.child_medications (child_id, active);
CREATE INDEX IF NOT EXISTS idx_child_medications_user
  ON health.child_medications (user_id);

ALTER TABLE health.child_medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select_medications" ON health.child_medications;
CREATE POLICY "owner_select_medications"
  ON health.child_medications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_insert_medications" ON health.child_medications;
CREATE POLICY "owner_insert_medications"
  ON health.child_medications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_update_medications" ON health.child_medications;
CREATE POLICY "owner_update_medications"
  ON health.child_medications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_delete_medications" ON health.child_medications;
CREATE POLICY "owner_delete_medications"
  ON health.child_medications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "collab_select_medications" ON health.child_medications;
CREATE POLICY "collab_select_medications"
  ON health.child_medications FOR SELECT
  TO authenticated
  USING (health.has_dossier_read_access(child_id));

COMMENT ON TABLE health.child_medications IS
  'B1 Journal de bord — liste des médicaments préconfigurés pour un enfant. HDS-required.';

-- ============================================================================
-- Table 3 : health.child_daily_log_comments
-- Commentaire d'un pro collaborateur sur une journée donnée.
-- ============================================================================

CREATE TABLE IF NOT EXISTS health.child_daily_log_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK logique vers health.child_daily_logs(id)
  log_id uuid NOT NULL,
  -- FK logique vers auth.users(id) — pro collaborateur ou famille propriétaire
  author_user_id uuid NOT NULL,
  -- Pour faciliter les politiques RLS et les requêtes côté pro :
  child_id uuid NOT NULL,
  comment text NOT NULL CHECK (length(comment) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_log_comments_log
  ON health.child_daily_log_comments (log_id, created_at);
CREATE INDEX IF NOT EXISTS idx_daily_log_comments_author
  ON health.child_daily_log_comments (author_user_id);
CREATE INDEX IF NOT EXISTS idx_daily_log_comments_child
  ON health.child_daily_log_comments (child_id, created_at);

ALTER TABLE health.child_daily_log_comments ENABLE ROW LEVEL SECURITY;

-- Lecture : auteur, parent propriétaire de l'enfant, ou pro collaborateur sur l'enfant
DROP POLICY IF EXISTS "select_daily_log_comments" ON health.child_daily_log_comments;
CREATE POLICY "select_daily_log_comments"
  ON health.child_daily_log_comments FOR SELECT
  TO authenticated
  USING (
    author_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM health.child_daily_logs l
      WHERE l.id = child_daily_log_comments.log_id
        AND l.user_id = auth.uid()
    )
    OR health.has_dossier_read_access(child_id)
  );

-- Écriture : famille propriétaire OU pro collaborateur (lecture suffit pour commenter)
DROP POLICY IF EXISTS "insert_daily_log_comments" ON health.child_daily_log_comments;
CREATE POLICY "insert_daily_log_comments"
  ON health.child_daily_log_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM health.child_daily_logs l
        WHERE l.id = child_daily_log_comments.log_id
          AND l.user_id = auth.uid()
          AND l.child_id = child_daily_log_comments.child_id
      )
      OR health.has_dossier_read_access(child_id)
    )
  );

-- Mise à jour / suppression : auteur uniquement
DROP POLICY IF EXISTS "author_update_daily_log_comments" ON health.child_daily_log_comments;
CREATE POLICY "author_update_daily_log_comments"
  ON health.child_daily_log_comments FOR UPDATE
  TO authenticated
  USING (author_user_id = auth.uid())
  WITH CHECK (author_user_id = auth.uid());

DROP POLICY IF EXISTS "author_delete_daily_log_comments" ON health.child_daily_log_comments;
CREATE POLICY "author_delete_daily_log_comments"
  ON health.child_daily_log_comments FOR DELETE
  TO authenticated
  USING (author_user_id = auth.uid());

COMMENT ON TABLE health.child_daily_log_comments IS
  'B1 Journal de bord — commentaire d''un pro collaborateur (ou de la famille) sur une journée. HDS-required.';

-- ============================================================================
-- Table 4 : health.child_pattern_alerts
-- Alertes pattern-detection (ex: 3 nuits courtes consécutives + crise).
-- Calculées côté server à chaque insert / update d'un daily log.
-- ============================================================================

CREATE TABLE IF NOT EXISTS health.child_pattern_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rule_key text NOT NULL CHECK (length(rule_key) BETWEEN 1 AND 80),
  triggered_at timestamptz NOT NULL DEFAULT NOW(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dismissed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_pattern_alerts_child
  ON health.child_pattern_alerts (child_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_alerts_user
  ON health.child_pattern_alerts (user_id, dismissed_at);

-- Une alerte unique par (enfant, rule_key, jour de déclenchement) pour éviter
-- les doublons quand le parent re-saisit son log.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pattern_alerts_child_rule_day
  ON health.child_pattern_alerts (child_id, rule_key, (date_trunc('day', triggered_at)));

ALTER TABLE health.child_pattern_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select_pattern_alerts" ON health.child_pattern_alerts;
CREATE POLICY "owner_select_pattern_alerts"
  ON health.child_pattern_alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_insert_pattern_alerts" ON health.child_pattern_alerts;
CREATE POLICY "owner_insert_pattern_alerts"
  ON health.child_pattern_alerts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_update_pattern_alerts" ON health.child_pattern_alerts;
CREATE POLICY "owner_update_pattern_alerts"
  ON health.child_pattern_alerts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_delete_pattern_alerts" ON health.child_pattern_alerts;
CREATE POLICY "owner_delete_pattern_alerts"
  ON health.child_pattern_alerts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "collab_select_pattern_alerts" ON health.child_pattern_alerts;
CREATE POLICY "collab_select_pattern_alerts"
  ON health.child_pattern_alerts FOR SELECT
  TO authenticated
  USING (health.has_dossier_read_access(child_id));

COMMENT ON TABLE health.child_pattern_alerts IS
  'B1 Journal de bord — alertes patterns calculées (ex: 3 nuits courtes + crise). HDS-required.';

-- ============================================================================
-- Storage bucket : health-journal-photos
-- Privé, RLS user-scoped (1 dossier par user_id).
-- En prod HDS, ce bucket DEVRA être recréé sur l'instance HDS.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('health-journal-photos', 'health-journal-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "journal_photos_owner_select" ON storage.objects;
CREATE POLICY "journal_photos_owner_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'health-journal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "journal_photos_owner_insert" ON storage.objects;
CREATE POLICY "journal_photos_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'health-journal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "journal_photos_owner_update" ON storage.objects;
CREATE POLICY "journal_photos_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'health-journal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "journal_photos_owner_delete" ON storage.objects;
CREATE POLICY "journal_photos_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'health-journal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- ROLLBACK (à exécuter manuellement si besoin)
-- ============================================================================
-- DROP POLICY IF EXISTS "journal_photos_owner_select"  ON storage.objects;
-- DROP POLICY IF EXISTS "journal_photos_owner_insert"  ON storage.objects;
-- DROP POLICY IF EXISTS "journal_photos_owner_update"  ON storage.objects;
-- DROP POLICY IF EXISTS "journal_photos_owner_delete"  ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'health-journal-photos';
-- DROP TABLE IF EXISTS health.child_pattern_alerts;
-- DROP TABLE IF EXISTS health.child_daily_log_comments;
-- DROP TABLE IF EXISTS health.child_medications;
-- DROP TABLE IF EXISTS health.child_daily_logs;
-- DROP FUNCTION IF EXISTS health.has_dossier_read_access(uuid);
-- DROP FUNCTION IF EXISTS health.set_child_daily_logs_updated_at();
