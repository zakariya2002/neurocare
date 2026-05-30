-- Cache persistant des géocodages (api-adresse.data.gouv.fr).
-- Évite que la carte /search retombe à 50 pros à chaque cold start Vercel
-- (le cache en mémoire ne survit pas aux redémarrages serverless).
--
-- Logique côté serveur :
-- 1. À chaque appel /api/educators/geocoded, on lit ce cache en batch pour
--    toutes les villes des pros visibles → ces pros sont rendus immédiatement.
-- 2. Les villes pas encore en cache sont géocodées (max 50 par appel pour
--    respecter le quota d'api-adresse) puis upsertées ici.
-- 3. not_found = true marque les villes qu'on n'arrive pas à géocoder,
--    pour éviter de retenter à chaque requête.

create table if not exists public.geocode_cache (
  query        text primary key,
  latitude     double precision,
  longitude    double precision,
  not_found    boolean      not null default false,
  updated_at   timestamptz  not null default now()
);

create index if not exists geocode_cache_not_found_idx
  on public.geocode_cache (not_found);

-- RLS : aucune lecture/écriture côté anon ou authenticated. Seul le
-- service_role (utilisé par l'API serveur) y accède via bypass RLS.
alter table public.geocode_cache enable row level security;
