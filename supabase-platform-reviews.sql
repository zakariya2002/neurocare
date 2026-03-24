-- Avis sur la plateforme NeuroCare (pas sur un éducateur spécifique)
DROP TABLE IF EXISTS platform_reviews CASCADE;

CREATE TABLE platform_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name VARCHAR(100) NOT NULL,
  author_role VARCHAR(20) DEFAULT 'family' CHECK (author_role IN ('family', 'educator')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_reviews ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les avis approuvés
CREATE POLICY "platform_reviews_public_read"
  ON platform_reviews FOR SELECT TO public
  USING (is_approved = true);

-- Les utilisateurs connectés peuvent ajouter un avis
CREATE POLICY "platform_reviews_insert"
  ON platform_reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent modifier leur propre avis
CREATE POLICY "platform_reviews_update_own"
  ON platform_reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
