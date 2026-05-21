-- Favoris pro sur les annonces familles
-- Permet à un éducateur de "liker" une annonce (heart) sans nécessairement y répondre.

CREATE TABLE IF NOT EXISTS public.educator_announcement_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  educator_id uuid NOT NULL REFERENCES public.educator_profiles(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES public.family_announcements(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (educator_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_educator_favorites_educator
  ON public.educator_announcement_favorites (educator_id);
CREATE INDEX IF NOT EXISTS idx_educator_favorites_announcement
  ON public.educator_announcement_favorites (announcement_id);

ALTER TABLE public.educator_announcement_favorites ENABLE ROW LEVEL SECURITY;

-- Sélection : un pro voit uniquement ses propres favoris
DROP POLICY IF EXISTS "educator_favorites_select_own" ON public.educator_announcement_favorites;
CREATE POLICY "educator_favorites_select_own"
  ON public.educator_announcement_favorites
  FOR SELECT
  USING (
    educator_id IN (
      SELECT id FROM public.educator_profiles WHERE user_id = auth.uid()
    )
  );

-- Insertion : un pro ne peut créer un favori que pour lui-même
DROP POLICY IF EXISTS "educator_favorites_insert_own" ON public.educator_announcement_favorites;
CREATE POLICY "educator_favorites_insert_own"
  ON public.educator_announcement_favorites
  FOR INSERT
  WITH CHECK (
    educator_id IN (
      SELECT id FROM public.educator_profiles WHERE user_id = auth.uid()
    )
  );

-- Suppression : un pro ne peut supprimer que ses propres favoris
DROP POLICY IF EXISTS "educator_favorites_delete_own" ON public.educator_announcement_favorites;
CREATE POLICY "educator_favorites_delete_own"
  ON public.educator_announcement_favorites
  FOR DELETE
  USING (
    educator_id IN (
      SELECT id FROM public.educator_profiles WHERE user_id = auth.uid()
    )
  );
