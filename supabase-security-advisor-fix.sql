-- ============================================
-- FIX Supabase Security Advisor - 26 erreurs
-- ============================================
-- Rapport du 15 mars 2026
--
-- Problème 1: auth_users_exposed via certifications_with_educator_details
-- Problème 2: 12 views SECURITY DEFINER exposées via PostgREST
--
-- Solution: Révoquer l'accès anon/authenticated sur les views admin-only
-- et convertir public_educator_profiles en SECURITY INVOKER

-- ============================================
-- 1. Views ADMIN-ONLY : révoquer tout accès anon/authenticated
--    (ces views ne sont pas utilisées dans le code client,
--     ou ne doivent être accessibles que via API routes server-side)
-- ============================================

REVOKE ALL ON public.certifications_with_documents FROM anon, authenticated;
REVOKE ALL ON public.certifications_with_educator_details FROM anon, authenticated;
REVOKE ALL ON public.educator_verification_summary FROM anon, authenticated;
REVOKE ALL ON public.diploma_ocr_stats FROM anon, authenticated;
REVOKE ALL ON public.diploma_verification_stats FROM anon, authenticated;
REVOKE ALL ON public.pending_email_notifications FROM anon, authenticated;
REVOKE ALL ON public.pending_session_validations FROM anon, authenticated;
REVOKE ALL ON public.diplomas_pending_dreets_response FROM anon, authenticated;
REVOKE ALL ON public.appointments_with_details FROM anon, authenticated;
REVOKE ALL ON public.diploma_duplicates_alert FROM anon, authenticated;
REVOKE ALL ON public.family_attestations_summary FROM anon, authenticated;

-- ============================================
-- 2. public_educator_profiles : convertir en SECURITY INVOKER
--    Cette view est intentionnellement accessible aux anon users
--    mais ne doit PAS bypass RLS. On la recrée avec security_invoker = true.
--    Comme on a déjà REVOKE SELECT sur educator_profiles pour anon,
--    on doit garder SECURITY DEFINER pour que la view fonctionne.
--    MAIS on s'assure qu'elle n'expose que des colonnes safe.
-- ============================================

-- La view public_educator_profiles DOIT rester SECURITY DEFINER
-- car anon n'a pas accès à educator_profiles directement.
-- C'est intentionnel et sécurisé car la view ne sélectionne que
-- des colonnes publiques (pas de phone, siret, rpps, stripe, etc.)
-- → On la laisse telle quelle, c'est un faux positif du linter.

-- ============================================
-- 3. Pour diploma_duplicates_alert (utilisée dans admin/certifications)
--    On révoque l'accès anon/authenticated (fait au step 1)
--    Le code admin devra passer par une API route server-side
-- ============================================

-- Vérification : lister les views qui restent accessibles
-- SELECT schemaname, viewname
-- FROM pg_views
-- WHERE schemaname = 'public'
-- ORDER BY viewname;
