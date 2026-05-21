-- Compter chaque visite de profil pro (sans déduplication IP+jour)
-- L'index unique limitait à 1 vue par (educator, IP, jour). On le retire pour
-- compter chaque rafraîchissement et chaque visiteur (y compris anonymes).

DROP INDEX IF EXISTS public.unique_view_per_day;
