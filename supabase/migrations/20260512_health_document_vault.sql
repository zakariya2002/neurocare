-- HDS-required: contains health data (article 9 RGPD)
-- This schema must reside on an HDS-certified host before production rollout.
--
-- Migration : Coffre-fort de documents santé/scolarité (B2).
-- Schema   : health.* — documents médicaux, MDPH, scolarité-médicale (PPS, PAP, PAI,
--            GEVA-Sco), administratifs liés au handicap, identité enfant.
-- Feature  : FEATURES.coffreFortSante (off par défaut).
-- Sécurité : RLS sur les 3 tables. Bucket privé `health-vault-documents`,
--            policies user-scoped sur le préfixe de chemin {user_id}/...
--            Lecture étendue aux pros via partage explicite (child_document_shares).

CREATE SCHEMA IF NOT EXISTS health;

-- ============================================================================
-- Table 1 : health.child_documents
-- Métadonnées d'un document attaché à un enfant.
-- Le binaire vit dans le bucket `health-vault-documents` (privé).
-- ============================================================================

CREATE TABLE IF NOT EXISTS health.child_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK logique vers public.child_profiles(id) — pas de FK cross-schema en prod HDS.
  child_id uuid NOT NULL,
  -- FK logique vers auth.users(id) — propriétaire (parent qui a uploadé).
  user_id uuid NOT NULL,

  doc_type text NOT NULL CHECK (doc_type IN (
    'mdph','medical','scolarite_medical','administratif','identite'
  )),
  doc_subtype text CHECK (doc_subtype IS NULL OR length(doc_subtype) <= 80),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description text CHECK (description IS NULL OR length(description) <= 1000),

  -- Chemin relatif dans le bucket (sans le nom du bucket lui-même)
  -- format : {user_id}/{child_id}/{uuid}-{filename}
  storage_path text NOT NULL CHECK (length(storage_path) BETWEEN 1 AND 500),
  mime_type text NOT NULL CHECK (length(mime_type) BETWEEN 1 AND 100),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760), -- 10 Mo

  issued_at date,
  expires_at date,
  issuer_name text CHECK (issuer_name IS NULL OR length(issuer_name) <= 200),
  tags text[] NOT NULL DEFAULT '{}',

  -- Réservé pour OCR ultérieur (MVP : NULL)
  ocr_extracted_text text,

  uploaded_by uuid NOT NULL,

  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_documents_child
  ON health.child_documents (child_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_child_documents_user
  ON health.child_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_child_documents_expires_at
  ON health.child_documents (expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_child_documents_doc_type
  ON health.child_documents (child_id, doc_type);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION health.set_child_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_child_documents_updated_at ON health.child_documents;
CREATE TRIGGER trg_child_documents_updated_at
  BEFORE UPDATE ON health.child_documents
  FOR EACH ROW
  EXECUTE FUNCTION health.set_child_documents_updated_at();

ALTER TABLE health.child_documents ENABLE ROW LEVEL SECURITY;

-- Famille propriétaire : tous droits
DROP POLICY IF EXISTS "owner_select_child_documents" ON health.child_documents;
CREATE POLICY "owner_select_child_documents"
  ON health.child_documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_insert_child_documents" ON health.child_documents;
CREATE POLICY "owner_insert_child_documents"
  ON health.child_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "owner_update_child_documents" ON health.child_documents;
CREATE POLICY "owner_update_child_documents"
  ON health.child_documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_delete_child_documents" ON health.child_documents;
CREATE POLICY "owner_delete_child_documents"
  ON health.child_documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Note : la policy "shared_select_child_documents" qui autorise la lecture
-- aux pros destinataires d'un partage est créée plus bas, après la définition
-- de la table health.child_document_shares et de la fonction
-- health.has_document_share().

COMMENT ON TABLE health.child_documents IS
  'B2 Coffre-fort — métadonnées d''un document santé/scolarité d''un enfant. HDS-required.';

-- ============================================================================
-- Table 2 : health.child_document_shares
-- Partage explicite d'un document avec un autre utilisateur (pro).
-- ============================================================================

CREATE TABLE IF NOT EXISTS health.child_document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK logique vers health.child_documents(id)
  document_id uuid NOT NULL,
  -- FK logique vers auth.users(id)
  shared_with_user_id uuid NOT NULL,
  access_level text NOT NULL CHECK (access_level IN ('read','download')),
  -- FK logique vers auth.users(id) — celui qui partage (parent)
  granted_by uuid NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT child_document_shares_unique UNIQUE (document_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_child_document_shares_doc
  ON health.child_document_shares (document_id);
CREATE INDEX IF NOT EXISTS idx_child_document_shares_recipient
  ON health.child_document_shares (shared_with_user_id);

ALTER TABLE health.child_document_shares ENABLE ROW LEVEL SECURITY;

-- Le grantor (parent) voit / gère ses partages.
DROP POLICY IF EXISTS "grantor_select_document_shares" ON health.child_document_shares;
CREATE POLICY "grantor_select_document_shares"
  ON health.child_document_shares FOR SELECT
  TO authenticated
  USING (granted_by = auth.uid());

DROP POLICY IF EXISTS "grantor_insert_document_shares" ON health.child_document_shares;
CREATE POLICY "grantor_insert_document_shares"
  ON health.child_document_shares FOR INSERT
  TO authenticated
  WITH CHECK (granted_by = auth.uid());

DROP POLICY IF EXISTS "grantor_update_document_shares" ON health.child_document_shares;
CREATE POLICY "grantor_update_document_shares"
  ON health.child_document_shares FOR UPDATE
  TO authenticated
  USING (granted_by = auth.uid())
  WITH CHECK (granted_by = auth.uid());

DROP POLICY IF EXISTS "grantor_delete_document_shares" ON health.child_document_shares;
CREATE POLICY "grantor_delete_document_shares"
  ON health.child_document_shares FOR DELETE
  TO authenticated
  USING (granted_by = auth.uid());

-- Le destinataire peut consulter ses propres entrées (pour lister les docs partagés).
DROP POLICY IF EXISTS "recipient_select_document_shares" ON health.child_document_shares;
CREATE POLICY "recipient_select_document_shares"
  ON health.child_document_shares FOR SELECT
  TO authenticated
  USING (shared_with_user_id = auth.uid());

COMMENT ON TABLE health.child_document_shares IS
  'B2 Coffre-fort — partage granulaire au document près. HDS-required.';

-- ============================================================================
-- Helper : un utilisateur a-t-il un partage actif sur un document donné ?
-- ============================================================================
-- Définie ici (après la table child_document_shares) pour que la résolution
-- des noms en LANGUAGE sql trouve la table.
-- En prod HDS, voir migration B1 (20260512_health_daily_logs.sql) pour la
-- discussion sur les jointures cross-schema vers public.* (pas utilisé ici).

CREATE OR REPLACE FUNCTION health.has_document_share(target_document_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = health, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM health.child_document_shares s
    WHERE s.document_id = target_document_id
      AND s.shared_with_user_id = auth.uid()
      AND (s.expires_at IS NULL OR s.expires_at > NOW())
  );
$$;

GRANT EXECUTE ON FUNCTION health.has_document_share(uuid) TO authenticated;

-- Pro destinataire d'un partage : lecture seule via has_document_share()
DROP POLICY IF EXISTS "shared_select_child_documents" ON health.child_documents;
CREATE POLICY "shared_select_child_documents"
  ON health.child_documents FOR SELECT
  TO authenticated
  USING (health.has_document_share(id));

-- ============================================================================
-- Table 3 : health.child_document_access_log
-- Audit log : qui a vu / téléchargé / partagé / modifié quoi, quand.
-- ============================================================================

CREATE TABLE IF NOT EXISTS health.child_document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK logique vers health.child_documents(id)
  document_id uuid NOT NULL,
  -- FK logique vers auth.users(id) — auteur de l'action
  user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN (
    'view','download','signed_url','share_grant','share_revoke','update','delete','create'
  )),
  ip text CHECK (ip IS NULL OR length(ip) <= 64),
  user_agent text CHECK (user_agent IS NULL OR length(user_agent) <= 500),
  occurred_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_document_access_log_doc
  ON health.child_document_access_log (document_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_child_document_access_log_user
  ON health.child_document_access_log (user_id, occurred_at DESC);

ALTER TABLE health.child_document_access_log ENABLE ROW LEVEL SECURITY;

-- Lecture : auteur de l'événement OU propriétaire du document.
DROP POLICY IF EXISTS "select_document_access_log" ON health.child_document_access_log;
CREATE POLICY "select_document_access_log"
  ON health.child_document_access_log FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM health.child_documents d
      WHERE d.id = child_document_access_log.document_id
        AND d.user_id = auth.uid()
    )
  );

-- Insertion : tout utilisateur authentifié pose une trace pour ses propres actions.
-- (les routes API contrôlent en amont qui peut faire quoi)
DROP POLICY IF EXISTS "insert_document_access_log" ON health.child_document_access_log;
CREATE POLICY "insert_document_access_log"
  ON health.child_document_access_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Pas d'UPDATE / DELETE volontairement : l'audit log est append-only.

COMMENT ON TABLE health.child_document_access_log IS
  'B2 Coffre-fort — journal d''audit append-only des accès / actions sur les documents. HDS-required.';

-- ============================================================================
-- Storage bucket : health-vault-documents
-- Privé, RLS user-scoped (1 dossier racine par user_id propriétaire).
-- En prod HDS, ce bucket DEVRA être recréé sur l'instance HDS.
-- Les pros invités lisent UNIQUEMENT via signed URL générée côté server après
-- vérification d'un partage actif (cf. /api/family/children/.../documents/[docId]/url).
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('health-vault-documents', 'health-vault-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "vault_documents_owner_select" ON storage.objects;
CREATE POLICY "vault_documents_owner_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'health-vault-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "vault_documents_owner_insert" ON storage.objects;
CREATE POLICY "vault_documents_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'health-vault-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "vault_documents_owner_update" ON storage.objects;
CREATE POLICY "vault_documents_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'health-vault-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "vault_documents_owner_delete" ON storage.objects;
CREATE POLICY "vault_documents_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'health-vault-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- ROLLBACK (à exécuter manuellement si besoin)
-- ============================================================================
-- DROP POLICY IF EXISTS "vault_documents_owner_select" ON storage.objects;
-- DROP POLICY IF EXISTS "vault_documents_owner_insert" ON storage.objects;
-- DROP POLICY IF EXISTS "vault_documents_owner_update" ON storage.objects;
-- DROP POLICY IF EXISTS "vault_documents_owner_delete" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'health-vault-documents';
-- DROP TABLE IF EXISTS health.child_document_access_log;
-- DROP TABLE IF EXISTS health.child_document_shares;
-- DROP TABLE IF EXISTS health.child_documents;
-- DROP FUNCTION IF EXISTS health.has_document_share(uuid);
-- DROP FUNCTION IF EXISTS health.set_child_documents_updated_at();
