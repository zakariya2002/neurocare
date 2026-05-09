// Inspection technique : permissions GRANT et RLS sur la vue / table.
// Utilise le service role pour avoir le pouvoir.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Test 1 : la vue retourne-t-elle 5 lignes en service role ?
const { data: r1, error: e1 } = await svc
  .from('public_educator_profiles')
  .select('id, first_name')
  .eq('verification_badge', true)
  .gte('years_of_experience', 1);
console.log('Service role sur la vue : ', r1?.length || 0, 'résultats', e1?.message || '');

// Test 2 : la table directe ?
const { data: r2 } = await svc
  .from('educator_profiles')
  .select('id, first_name, profile_visible, verification_badge, years_of_experience')
  .eq('profile_visible', true)
  .eq('verification_badge', true)
  .gte('years_of_experience', 1);
console.log('Service role sur la table : ', r2?.length || 0, 'résultats');

// Test 3 : essayer de lire pg_policy via une fonction RPC custom
// Si pas de fonction custom dispo, on skippe
console.log('\n--- Pour aller plus loin, exécuter dans Supabase SQL Editor ---\n');
console.log(`-- Policies sur educator_profiles
SELECT polname, polcmd, polroles::regrole[]
FROM pg_policy
WHERE polrelid = 'public.educator_profiles'::regclass;

-- GRANT sur la vue
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='public_educator_profiles';

-- Définition de la vue
SELECT pg_get_viewdef('public.public_educator_profiles', true);
`);
