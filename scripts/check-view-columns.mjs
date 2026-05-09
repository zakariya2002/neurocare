import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// Test la requête EXACTE de app/search/page.tsx
const SELECT = 'id, first_name, last_name, bio, avatar_url, location, profession_type, specializations, hourly_rate, years_of_experience, rating, total_reviews, subscription_status, suspended_until, verification_badge, gender';

console.log('Test : requête identique à la page /search\n');
const { data, error } = await anon
  .from('public_educator_profiles')
  .select(SELECT)
  .eq('verification_badge', true)
  .gte('years_of_experience', 1)
  .order('rating', { ascending: false });

if (error) {
  console.log('ERREUR :', JSON.stringify(error, null, 2));
} else {
  console.log(`OK : ${data.length} résultats`);
  for (const r of data) console.log(`- ${r.first_name} ${r.last_name} (gender=${r.gender})`);
}

console.log('\n---\nColonnes effectivement exposées par la vue :');
const { data: peek } = await anon.from('public_educator_profiles').select('*').limit(1);
if (peek?.[0]) console.log(Object.keys(peek[0]).sort().join(', '));
