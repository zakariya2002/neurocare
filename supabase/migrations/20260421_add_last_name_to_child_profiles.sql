-- Add an optional last_name column to child_profiles so families can record their child's full name.
-- Kept nullable to avoid breaking existing rows; UI keeps last name optional.

ALTER TABLE public.child_profiles
  ADD COLUMN IF NOT EXISTS last_name text;

COMMENT ON COLUMN public.child_profiles.last_name IS 'Family name of the child / proche (optional). Added 2026-04-21 to support the "Modifier le profil" form.';
