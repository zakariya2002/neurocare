import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Peek at one row of the view to see which columns it exposes
const { data: viewRow } = await supabase
  .from('public_educator_profiles')
  .select('*')
  .limit(1)
  .single();

console.log('\n─── Colonnes exposées par la vue public_educator_profiles ───');
console.log(Object.keys(viewRow || {}).join(', '));

// Peek at full educator_profiles to see status-like columns
const { data: tableRow } = await supabase
  .from('educator_profiles')
  .select('*')
  .limit(1)
  .single();

console.log('\n─── Colonnes de la table educator_profiles ───');
console.log(Object.keys(tableRow || {}).join(', '));

// Distribution des profile_status et autres flags potentiels
const { data: rows } = await supabase
  .from('educator_profiles')
  .select('profile_status, is_published, is_verified, account_status')
  .limit(100);

console.log('\n─── Distribution des flags ───');
const tally = {};
for (const r of rows || []) {
  const k = JSON.stringify({
    profile_status: r.profile_status,
    is_published: r.is_published,
    is_verified: r.is_verified,
    account_status: r.account_status,
  });
  tally[k] = (tally[k] || 0) + 1;
}
for (const [k, v] of Object.entries(tally)) console.log(`${v}× ${k}`);

// Policies sur educator_profiles
console.log('\n─── Policies existantes sur educator_profiles ───');
const { data: policies } = await supabase
  .rpc('pg_policies_list', {}) // may not exist, fallback below
  .maybeSingle();
// Fallback direct sql via supabase-js: not available, show message
console.log('(Pour voir les policies exactement, lance en SQL : SELECT policyname, cmd, qual FROM pg_policies WHERE schemaname = \'public\' AND tablename = \'educator_profiles\';)');
