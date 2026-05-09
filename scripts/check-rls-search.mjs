// Reproduit le bug : déconnecté = X résultats, connecté famille = 0 résultats.
// Compare les requêtes anon vs auth.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;

const SELECT = 'id, first_name, last_name, location, profession_type, verification_badge';
const QUERY = (c) => c.from('public_educator_profiles').select(SELECT).eq('verification_badge', true).gte('years_of_experience', 1);

console.log('=== Test 1 : anonyme (= visiteur déconnecté) ===');
const anon = createClient(URL, ANON, { auth: { persistSession: false } });
const { data: anonData, error: anonErr } = await QUERY(anon);
console.log('Erreur :', anonErr?.message || 'aucune');
console.log('Résultats :', anonData?.length || 0);

console.log('\n=== Test 2 : authentifié comme famille ===');
// Utilise service role pour set un mdp connu sur test2@test.com puis se connecter
const svcClient = createClient(URL, SVC, { auth: { persistSession: false } });
const { data: list } = await svcClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
const testUser = list.users.find((u) => u.email === 'test2@test.com');
if (!testUser) {
  console.log('test2@test.com introuvable. Skip.');
} else {
  const TEMP_PWD = 'TempTest!2026' + Math.floor(Math.random() * 99999);
  await svcClient.auth.admin.updateUserById(testUser.id, { password: TEMP_PWD });

  const family = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: authErr } = await family.auth.signInWithPassword({
    email: 'test2@test.com',
    password: TEMP_PWD,
  });
  if (authErr) {
    console.log('Login failed :', authErr.message);
  } else {
    console.log('Login OK. user_metadata.role =', testUser.user_metadata?.role);

    console.log('\n  → vue public_educator_profiles (auth)');
    const { data: vueData, error: vueErr } = await family
      .from('public_educator_profiles')
      .select('id, first_name')
      .eq('verification_badge', true)
      .gte('years_of_experience', 1);
    console.log('    Erreur :', vueErr?.message || 'aucune');
    console.log('    Résultats :', vueData?.length || 0);

    console.log('\n  → table directe educator_profiles (auth)');
    const { data: tabData, error: tabErr } = await family
      .from('educator_profiles')
      .select('id, first_name, profile_visible, verification_badge')
      .eq('profile_visible', true)
      .eq('verification_badge', true);
    console.log('    Erreur :', tabErr?.message || 'aucune');
    console.log('    Résultats :', tabData?.length || 0);
  }
}

console.log('\nSQL à lancer manuellement sur Supabase SQL Editor pour voir les RLS :');
console.log(`SELECT polname, polcmd, polroles::regrole[], pg_get_expr(polqual, polrelid)
FROM pg_policy
WHERE polrelid IN ('public.educator_profiles'::regclass);`);
