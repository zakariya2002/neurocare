-- ============================================
-- Coordination multi-pros : partage du PPA entre éducateurs
-- ============================================
-- Permet à un éducateur (qui a déjà accès via un appointment) d'inviter un autre
-- éducateur à consulter (read) ou éditer (write) le PPA d'un enfant.
-- La famille (parent) peut révoquer à tout moment.

CREATE TABLE IF NOT EXISTS public.ppa_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.educator_profiles(id) ON DELETE CASCADE,
  invited_educator_id UUID NOT NULL REFERENCES public.educator_profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'write')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'left')),
  message TEXT,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT CHECK (revoked_by IN ('family', 'inviter', 'invitee')),
  CONSTRAINT no_self_invite CHECK (invited_by <> invited_educator_id)
);

-- Pas de doublon actif (pending OU accepted) pour le même couple enfant + invité
CREATE UNIQUE INDEX IF NOT EXISTS idx_ppa_collab_unique_active
  ON public.ppa_collaborations (child_id, invited_educator_id)
  WHERE status IN ('pending', 'accepted');

CREATE INDEX IF NOT EXISTS idx_ppa_collab_child ON public.ppa_collaborations(child_id);
CREATE INDEX IF NOT EXISTS idx_ppa_collab_invited ON public.ppa_collaborations(invited_educator_id, status);
CREATE INDEX IF NOT EXISTS idx_ppa_collab_inviter ON public.ppa_collaborations(invited_by, status);

-- ─── RLS ───
ALTER TABLE public.ppa_collaborations ENABLE ROW LEVEL SECURITY;

-- Inviter peut voir / créer / révoquer ses propres invitations
CREATE POLICY "Inviter sees own invites" ON public.ppa_collaborations
  FOR SELECT USING (
    invited_by IN (SELECT id FROM public.educator_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Inviter can create" ON public.ppa_collaborations
  FOR INSERT WITH CHECK (
    invited_by IN (SELECT id FROM public.educator_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Inviter can update own" ON public.ppa_collaborations
  FOR UPDATE USING (
    invited_by IN (SELECT id FROM public.educator_profiles WHERE user_id = auth.uid())
  );

-- Invité voit / accepte / refuse / quitte les invitations qui le concernent
CREATE POLICY "Invitee sees their invites" ON public.ppa_collaborations
  FOR SELECT USING (
    invited_educator_id IN (SELECT id FROM public.educator_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Invitee can respond" ON public.ppa_collaborations
  FOR UPDATE USING (
    invited_educator_id IN (SELECT id FROM public.educator_profiles WHERE user_id = auth.uid())
  );

-- Famille (parent de l'enfant) voit / révoque les collaborations sur ses enfants
CREATE POLICY "Family sees collaborations on children" ON public.ppa_collaborations
  FOR SELECT USING (
    child_id IN (
      SELECT cp.id FROM public.child_profiles cp
      JOIN public.family_profiles fp ON fp.id = cp.family_id
      WHERE fp.user_id = auth.uid()
    )
  );

CREATE POLICY "Family can revoke" ON public.ppa_collaborations
  FOR UPDATE USING (
    child_id IN (
      SELECT cp.id FROM public.child_profiles cp
      JOIN public.family_profiles fp ON fp.id = cp.family_id
      WHERE fp.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.ppa_collaborations IS 'Invitations de collaboration sur le PPA d''un enfant entre éducateurs.';
