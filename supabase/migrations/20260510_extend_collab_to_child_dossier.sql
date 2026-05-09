-- ──────────────────────────────────────────────────────────────────────────────
-- Étend l'accès des collaborations PPA au DOSSIER COMPLET de l'enfant
-- ──────────────────────────────────────────────────────────────────────────────
--
-- Contexte :
-- La table `ppa_collaborations` permet à un éducateur d'inviter un confrère
-- à voir/éditer le PPA d'un enfant. La promesse marketing est désormais
-- "partager le DOSSIER COMPLET" — profil, PPA, historique séances, notes,
-- objectifs, compétences, préférences, liens externes.
--
-- Cette migration ajoute des policies RLS (additives, OR-combined avec les
-- policies existantes) pour étendre l'accès du confrère invité aux tables :
--   - child_profiles            (lecture seule — profil enfant)
--   - child_educational_goals   (lecture + écriture selon permission)
--   - child_skills              (lecture + écriture selon permission)
--   - child_preferences         (lecture + écriture selon permission)
--   - child_external_links      (lecture + écriture selon permission)
--   - child_session_notes       (lecture + écriture selon permission)
--   - child_ppa                 (lecture + écriture selon permission)
--
-- Notes :
-- - Les policies existantes (parent famille / éducateur direct) restent intactes
-- - PostgreSQL combine les multiples policies sur la même table avec OR
-- - Le helper SQL `is_collab_collaborator(child_id, can_write)` factorise
-- - Une migration de rollback est proposée à la fin (commentée)
-- ──────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────
-- Helper function : est-ce que l'utilisateur courant
-- a une collaboration acceptée sur cet enfant ?
-- ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_collab_collaborator(
  target_child_id UUID,
  require_write BOOLEAN DEFAULT FALSE
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM ppa_collaborations c
    JOIN educator_profiles e ON e.id = c.invited_educator_id
    WHERE c.child_id = target_child_id
      AND c.status = 'accepted'
      AND e.user_id = auth.uid()
      AND (NOT require_write OR c.permission = 'write')
  );
$$;

GRANT EXECUTE ON FUNCTION is_collab_collaborator(UUID, BOOLEAN) TO authenticated;


-- ─────────────────────────────────────────────────
-- 1. child_profiles — lecture seule pour collaborateur
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "collab_select_child_profiles" ON child_profiles;
CREATE POLICY "collab_select_child_profiles"
  ON child_profiles FOR SELECT
  TO authenticated
  USING (is_collab_collaborator(id, FALSE));


-- ─────────────────────────────────────────────────
-- 2. child_educational_goals — read + write si permission='write'
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "collab_select_child_educational_goals" ON child_educational_goals;
CREATE POLICY "collab_select_child_educational_goals"
  ON child_educational_goals FOR SELECT
  TO authenticated
  USING (is_collab_collaborator(child_id, FALSE));

DROP POLICY IF EXISTS "collab_insert_child_educational_goals" ON child_educational_goals;
CREATE POLICY "collab_insert_child_educational_goals"
  ON child_educational_goals FOR INSERT
  TO authenticated
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_update_child_educational_goals" ON child_educational_goals;
CREATE POLICY "collab_update_child_educational_goals"
  ON child_educational_goals FOR UPDATE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE))
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_delete_child_educational_goals" ON child_educational_goals;
CREATE POLICY "collab_delete_child_educational_goals"
  ON child_educational_goals FOR DELETE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE));


-- ─────────────────────────────────────────────────
-- 3. child_skills
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "collab_select_child_skills" ON child_skills;
CREATE POLICY "collab_select_child_skills"
  ON child_skills FOR SELECT
  TO authenticated
  USING (is_collab_collaborator(child_id, FALSE));

DROP POLICY IF EXISTS "collab_insert_child_skills" ON child_skills;
CREATE POLICY "collab_insert_child_skills"
  ON child_skills FOR INSERT
  TO authenticated
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_update_child_skills" ON child_skills;
CREATE POLICY "collab_update_child_skills"
  ON child_skills FOR UPDATE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE))
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_delete_child_skills" ON child_skills;
CREATE POLICY "collab_delete_child_skills"
  ON child_skills FOR DELETE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE));


-- ─────────────────────────────────────────────────
-- 4. child_preferences
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "collab_select_child_preferences" ON child_preferences;
CREATE POLICY "collab_select_child_preferences"
  ON child_preferences FOR SELECT
  TO authenticated
  USING (is_collab_collaborator(child_id, FALSE));

DROP POLICY IF EXISTS "collab_insert_child_preferences" ON child_preferences;
CREATE POLICY "collab_insert_child_preferences"
  ON child_preferences FOR INSERT
  TO authenticated
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_update_child_preferences" ON child_preferences;
CREATE POLICY "collab_update_child_preferences"
  ON child_preferences FOR UPDATE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE))
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_delete_child_preferences" ON child_preferences;
CREATE POLICY "collab_delete_child_preferences"
  ON child_preferences FOR DELETE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE));


-- ─────────────────────────────────────────────────
-- 5. child_external_links
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "collab_select_child_external_links" ON child_external_links;
CREATE POLICY "collab_select_child_external_links"
  ON child_external_links FOR SELECT
  TO authenticated
  USING (is_collab_collaborator(child_id, FALSE));

DROP POLICY IF EXISTS "collab_insert_child_external_links" ON child_external_links;
CREATE POLICY "collab_insert_child_external_links"
  ON child_external_links FOR INSERT
  TO authenticated
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_update_child_external_links" ON child_external_links;
CREATE POLICY "collab_update_child_external_links"
  ON child_external_links FOR UPDATE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE))
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_delete_child_external_links" ON child_external_links;
CREATE POLICY "collab_delete_child_external_links"
  ON child_external_links FOR DELETE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE));


-- ─────────────────────────────────────────────────
-- 6. child_session_notes
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "collab_select_child_session_notes" ON child_session_notes;
CREATE POLICY "collab_select_child_session_notes"
  ON child_session_notes FOR SELECT
  TO authenticated
  USING (is_collab_collaborator(child_id, FALSE));

DROP POLICY IF EXISTS "collab_insert_child_session_notes" ON child_session_notes;
CREATE POLICY "collab_insert_child_session_notes"
  ON child_session_notes FOR INSERT
  TO authenticated
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_update_child_session_notes" ON child_session_notes;
CREATE POLICY "collab_update_child_session_notes"
  ON child_session_notes FOR UPDATE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE))
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_delete_child_session_notes" ON child_session_notes;
CREATE POLICY "collab_delete_child_session_notes"
  ON child_session_notes FOR DELETE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE));


-- ─────────────────────────────────────────────────
-- 7. child_ppa
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "collab_select_child_ppa" ON child_ppa;
CREATE POLICY "collab_select_child_ppa"
  ON child_ppa FOR SELECT
  TO authenticated
  USING (is_collab_collaborator(child_id, FALSE));

DROP POLICY IF EXISTS "collab_insert_child_ppa" ON child_ppa;
CREATE POLICY "collab_insert_child_ppa"
  ON child_ppa FOR INSERT
  TO authenticated
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_update_child_ppa" ON child_ppa;
CREATE POLICY "collab_update_child_ppa"
  ON child_ppa FOR UPDATE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE))
  WITH CHECK (is_collab_collaborator(child_id, TRUE));

DROP POLICY IF EXISTS "collab_delete_child_ppa" ON child_ppa;
CREATE POLICY "collab_delete_child_ppa"
  ON child_ppa FOR DELETE
  TO authenticated
  USING (is_collab_collaborator(child_id, TRUE));


-- ──────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (à exécuter manuellement si besoin de revenir en arrière)
-- ──────────────────────────────────────────────────────────────────────────────
-- DROP POLICY IF EXISTS "collab_select_child_profiles" ON child_profiles;
-- DROP POLICY IF EXISTS "collab_select_child_educational_goals" ON child_educational_goals;
-- DROP POLICY IF EXISTS "collab_insert_child_educational_goals" ON child_educational_goals;
-- DROP POLICY IF EXISTS "collab_update_child_educational_goals" ON child_educational_goals;
-- DROP POLICY IF EXISTS "collab_delete_child_educational_goals" ON child_educational_goals;
-- DROP POLICY IF EXISTS "collab_select_child_skills" ON child_skills;
-- DROP POLICY IF EXISTS "collab_insert_child_skills" ON child_skills;
-- DROP POLICY IF EXISTS "collab_update_child_skills" ON child_skills;
-- DROP POLICY IF EXISTS "collab_delete_child_skills" ON child_skills;
-- DROP POLICY IF EXISTS "collab_select_child_preferences" ON child_preferences;
-- DROP POLICY IF EXISTS "collab_insert_child_preferences" ON child_preferences;
-- DROP POLICY IF EXISTS "collab_update_child_preferences" ON child_preferences;
-- DROP POLICY IF EXISTS "collab_delete_child_preferences" ON child_preferences;
-- DROP POLICY IF EXISTS "collab_select_child_external_links" ON child_external_links;
-- DROP POLICY IF EXISTS "collab_insert_child_external_links" ON child_external_links;
-- DROP POLICY IF EXISTS "collab_update_child_external_links" ON child_external_links;
-- DROP POLICY IF EXISTS "collab_delete_child_external_links" ON child_external_links;
-- DROP POLICY IF EXISTS "collab_select_child_session_notes" ON child_session_notes;
-- DROP POLICY IF EXISTS "collab_insert_child_session_notes" ON child_session_notes;
-- DROP POLICY IF EXISTS "collab_update_child_session_notes" ON child_session_notes;
-- DROP POLICY IF EXISTS "collab_delete_child_session_notes" ON child_session_notes;
-- DROP POLICY IF EXISTS "collab_select_child_ppa" ON child_ppa;
-- DROP POLICY IF EXISTS "collab_insert_child_ppa" ON child_ppa;
-- DROP POLICY IF EXISTS "collab_update_child_ppa" ON child_ppa;
-- DROP POLICY IF EXISTS "collab_delete_child_ppa" ON child_ppa;
-- DROP FUNCTION IF EXISTS is_collab_collaborator(UUID, BOOLEAN);
