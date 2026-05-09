import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Test: peut-on lire educator_profiles via la vue public_educator_profiles en tant qu'anon ?
const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

console.log('\n─── Test lecture anonyme de public_educator_profiles ───');
const { data: anonView, error: anonViewErr, count: anonViewCount } = await anon
  .from('public_educator_profiles')
  .select('id', { count: 'exact', head: true });
console.log('Accessible ?', anonViewErr ? '❌ ' + anonViewErr.message : `✅ ${anonViewCount} lignes visibles`);

console.log('\n─── Test lecture anonyme DIRECTE de educator_profiles ───');
const { data: anonTable, error: anonTableErr, count: anonTableCount } = await anon
  .from('educator_profiles')
  .select('id', { count: 'exact', head: true });
console.log('Accessible ?', anonTableErr ? '❌ ' + anonTableErr.message : `✅ ${anonTableCount} lignes visibles`);

console.log('\n─── Nombre de profils publiés (service role) ───');
const { count: publishedCount } = await supabase
  .from('educator_profiles')
  .select('id', { count: 'exact', head: true })
  .eq('profile_status', 'active');
console.log(`Profils actifs : ${publishedCount}`);

const { count: totalCount } = await supabase
  .from('educator_profiles')
  .select('id', { count: 'exact', head: true });
console.log(`Profils totaux : ${totalCount}`);

console.log('\n─── Diagnostic ───');
if (!anonViewErr && anonViewCount > 0 && (anonTableErr || anonTableCount === 0)) {
  console.log('✅ La vue fonctionne actuellement (SECURITY DEFINER masque la RLS de la table).');
  console.log('⚠️  Après passage en SECURITY INVOKER, la RLS de educator_profiles doit autoriser la lecture anon.');
  if (anonTableCount === 0) {
    console.log('❌ RISQUE : la RLS actuelle bloque anon sur la table → la vue sera vide après le fix.');
    console.log('   → Il faut AJOUTER une policy SELECT sur educator_profiles pour anon AVANT le fix.');
  }
} else if (!anonViewErr && !anonTableErr && anonTableCount > 0) {
  console.log('✅ La RLS de educator_profiles autorise déjà anon → le fix passera sans problème.');
}
