import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('./.env.local', 'utf8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, '')]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Get Pauline's profile id
const { data: pauline } = await supabase
  .from('educator_profiles')
  .select('id, user_id')
  .eq('first_name', 'Pauline')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

console.log('Pauline profile id:', pauline?.id);
console.log('Pauline user id:', pauline?.user_id);

// List buckets
const { data: buckets } = await supabase.storage.listBuckets();
console.log('\nBuckets:', buckets?.map(b => b.name).join(', '));

// Check verification-documents bucket for her
for (const bucketName of ['verification-documents', 'diplomas', 'verification_documents']) {
  try {
    const { data: files, error } = await supabase.storage.from(bucketName).list(pauline.id, { limit: 100 });
    if (error) { console.log(`  ${bucketName}: ${error.message}`); continue; }
    console.log(`\n${bucketName}/${pauline.id}/ →`, files?.length || 0, 'files');
    files?.forEach(f => console.log(`    - ${f.name}`));
  } catch(e) { console.log(`  ${bucketName}: ${e.message}`); }
}

// Also try with user_id as folder (REAL path used by upload code)
console.log('\n--- Recherche par user_id (path réel utilisé par le code d\'upload) ---');
for (const bucketName of ['verification-documents', 'diplomas', 'cvs']) {
  try {
    const { data: files, error } = await supabase.storage.from(bucketName).list(pauline.user_id, { limit: 100 });
    if (error) { console.log(`  ${bucketName}: ERREUR ${error.message}`); continue; }
    console.log(`  ${bucketName}/${pauline.user_id}/ → ${files?.length || 0} fichier(s)`);
    files?.forEach(f => console.log(`     - ${f.name}`));
  } catch(e) { console.log(`  ${bucketName}: ${e.message}`); }
}
