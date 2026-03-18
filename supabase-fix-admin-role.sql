-- ============================================
-- FIX CRITIQUE: Sécuriser le rôle admin
-- ============================================
-- PROBLÈME: user_metadata est modifiable par l'utilisateur via
-- supabase.auth.updateUser({ data: { role: 'admin' } })
-- → N'importe qui peut devenir admin
--
-- SOLUTION:
-- 1. Mettre le rôle admin dans app_metadata (non modifiable par l'utilisateur)
-- 2. Créer un trigger pour empêcher l'auto-promotion dans user_metadata
-- 3. Nettoyer les faux admins

-- ============================================
-- ÉTAPE 1: Définir TON compte comme admin dans app_metadata
-- Remplace l'email ci-dessous par ton email admin
-- ============================================

-- Mettre le rôle admin dans app_metadata pour ton compte
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'zakariyanebbache@gmail.com';

-- ============================================
-- ÉTAPE 2: Supprimer le rôle 'admin' de user_metadata pour TOUS les users
-- (les vrais admins l'auront dans app_metadata maintenant)
-- ============================================

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role' || '{"role": "family"}'::jsonb
WHERE raw_user_meta_data->>'role' = 'admin'
AND email != 'zakariyanebbache@gmail.com';

-- Pour ton compte admin, garde le rôle admin dans user_metadata aussi
-- (pour la rétrocompatibilité des parties non-critiques de l'app)
-- C'est OK car la vérification admin utilise maintenant app_metadata

-- ============================================
-- ÉTAPE 3: Trigger pour empêcher l'auto-promotion admin
-- Ce trigger s'exécute AVANT chaque UPDATE sur auth.users
-- et empêche un utilisateur de se mettre 'admin' dans user_metadata
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_admin_self_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- Si quelqu'un essaie de mettre 'admin' dans user_metadata
  -- et que ce n'est pas déjà un admin dans app_metadata
  IF NEW.raw_user_meta_data->>'role' = 'admin'
     AND (OLD.raw_app_meta_data->>'role' IS NULL OR OLD.raw_app_meta_data->>'role' != 'admin')
  THEN
    -- Remettre l'ancien rôle
    NEW.raw_user_meta_data = NEW.raw_user_meta_data || jsonb_build_object('role', COALESCE(OLD.raw_user_meta_data->>'role', 'family'));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS prevent_admin_self_promotion_trigger ON auth.users;

-- Créer le trigger
CREATE TRIGGER prevent_admin_self_promotion_trigger
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_self_promotion();

-- ============================================
-- ÉTAPE 4: Vérification
-- ============================================

-- Vérifie que ton compte a bien app_metadata.role = 'admin'
SELECT
  email,
  raw_user_meta_data->>'role' as user_role,
  raw_app_meta_data->>'role' as app_role
FROM auth.users
WHERE email = 'zakariyanebbache@gmail.com';

-- Liste tous les users qui ont 'admin' dans user_metadata (ne devrait y en avoir aucun sauf toi)
SELECT
  email,
  raw_user_meta_data->>'role' as user_role,
  raw_app_meta_data->>'role' as app_role
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';
