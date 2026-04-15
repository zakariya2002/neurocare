-- ======================================================================
-- ⚠️  MIGRATION EN ATTENTE DE VALIDATION HUMAINE  ⚠️
-- ======================================================================
-- Date : 2026-04-15
-- Contexte : suppression de la table `subscriptions` (legacy, modèle
--            d'abonnement abandonné).
-- Modèle actuel : 100 % gratuit pour les pros + commission plateforme
--                 de 12 % sur les rendez-vous uniquement.
--
-- Fichiers applicatifs ayant été nettoyés avant ce drop :
--   - app/api/user/export-data/route.ts
--   - app/api/user/delete-account/route.ts
--   - app/api/export-data/route.ts
--
-- ⚠️  payment_transactions N'EST PAS DROPPÉE ICI  ⚠️
--   Justification : le webhook Stripe actuel
--     (app/api/webhooks/stripe/route.ts, fonction handlePaymentIntentFailed)
--   insère encore dans `payment_transactions` pour journaliser les paiements
--   de RDV échoués, et `app/api/admin/payments/route.ts` lit cette table
--   pour le dashboard admin. Elle reste donc utile au modèle commission 12 %.
--   La contrainte FK `subscription_id -> subscriptions(id)` sera retirée
--   ci-dessous pour rendre ce drop possible sans casser `payment_transactions`.
--
-- AVANT D'EXÉCUTER :
--   1. Faire un backup complet de la base prod.
--   2. Vérifier qu'AUCUN code applicatif ne fetch encore `subscriptions` :
--        grep -rn "from('subscriptions')" .
--        grep -rn "FROM subscriptions" .
--      (Seules occurrences attendues : fichiers d'archive supabase-*.sql.)
--   3. Vérifier les policies RLS et fonctions associées ci-dessous.
--   4. Exécuter sur staging d'abord, valider, puis prod.
--   5. Noter que `educator_profiles.subscription_status` est encore lu par
--      `app/api/admin/users/route.ts` et `app/admin/users/page.tsx` — la
--      colonne est conservée (le trigger de synchro sera supprimé, elle
--      gardera sa dernière valeur "figée"). Supprimer la colonne
--      ultérieurement dans une migration dédiée si souhaité.
-- ======================================================================

BEGIN;

-- ── 1. Triggers dépendant de `subscriptions` ─────────────────────────
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS sync_subscription_status        ON public.subscriptions;

-- ── 2. Fonctions dédiées aux abonnements ─────────────────────────────
DROP FUNCTION IF EXISTS public.update_subscription_updated_at()         CASCADE;
DROP FUNCTION IF EXISTS public.sync_educator_subscription_status()      CASCADE;
DROP FUNCTION IF EXISTS public.has_active_subscription(uuid)            CASCADE;
-- Variante sans paramètre nommé, au cas où :
DROP FUNCTION IF EXISTS public.has_active_subscription()                CASCADE;

-- ── 3. Policies RLS sur `subscriptions` ──────────────────────────────
DROP POLICY IF EXISTS "Educators can view own subscription"    ON public.subscriptions;
DROP POLICY IF EXISTS "Educators can update own subscription"  ON public.subscriptions;
DROP POLICY IF EXISTS "System can insert subscriptions"        ON public.subscriptions;

-- ── 4. Détacher `payment_transactions` de `subscriptions` ───────────
--     (la colonne subscription_id devient orpheline mais non bloquante
--      une fois la FK supprimée ; on peut la nullifier puis la garder
--      ou la droper — choix ici : garder la colonne pour ne rien perdre.)
ALTER TABLE IF EXISTS public.payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_subscription_id_fkey;

-- ── 5. Table `subscriptions` elle-même ───────────────────────────────
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- ── 6. ⚠️ NE PAS DROPPER ⚠️ — Conservées volontairement :
--     * public.payment_transactions  → utilisée par le webhook Stripe et
--                                      l'admin dashboard (paiements RDV).
--     * public.educator_profiles.subscription_status → encore lu par
--                                      l'admin users API / UI.
--     Si/quand ces usages disparaîtront, ajouter dans une migration future :
--        ALTER TABLE public.educator_profiles DROP COLUMN IF EXISTS subscription_status;
--        DROP TABLE  IF EXISTS public.payment_transactions CASCADE;  -- seulement si plus référencée

COMMIT;

-- Vérifications post-exécution (à lancer manuellement) :
--   SELECT to_regclass('public.subscriptions');        -- doit retourner NULL
--   SELECT to_regclass('public.payment_transactions'); -- doit retourner son oid
--   SELECT proname FROM pg_proc WHERE proname LIKE '%subscription%';
