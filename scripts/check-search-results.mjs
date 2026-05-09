import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Tester avec la clé ANON (= ce que voit le navigateur)
const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const { data, error } = await anon
  .from('public_educator_profiles')
  .select('id, first_name, last_name, location, profession_type, years_of_experience, hourly_rate, rating, verification_badge, suspended_until')
  .eq('verification_badge', true)
  .gte('years_of_experience', 1)
  .order('rating', { ascending: false });

if (error) { console.error('Error:', error); process.exit(1); }

console.log(`Résultats avec clé ANON + filtres de la page : ${data.length}\n`);
for (const r of data) {
  console.log(`- ${r.first_name} ${r.last_name} | ${r.profession_type} | ${r.location} | exp=${r.years_of_experience} | rate=${r.hourly_rate}€ | suspended=${r.suspended_until}`);
}

// Sans le filtre years_of_experience
const { data: noExp } = await anon
  .from('public_educator_profiles')
  .select('id, first_name, years_of_experience')
  .eq('verification_badge', true);

console.log(`\nSans filtre experience : ${noExp.length}`);
for (const r of noExp) {
  console.log(`- ${r.first_name} | exp=${r.years_of_experience}`);
}
