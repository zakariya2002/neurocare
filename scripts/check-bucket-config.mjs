// Vérifie la config du bucket verification-documents (mime types autorisés, taille max)
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('./.env.local', 'utf8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, '')]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Get full bucket config
const { data: buckets, error } = await supabase.storage.listBuckets();
if (error) { console.error(error); process.exit(1); }

console.log('=== Config détaillée des buckets ===\n');
for (const b of buckets) {
  if (['verification-documents', 'diplomas', 'cvs'].includes(b.name)) {
    console.log(`📦 ${b.name}`);
    console.log(`   public: ${b.public}`);
    console.log(`   file_size_limit: ${b.file_size_limit ?? 'aucune'}`);
    console.log(`   allowed_mime_types: ${JSON.stringify(b.allowed_mime_types) || 'aucune restriction'}`);
    console.log('');
  }
}

// Test upload PDF, JPEG, PNG (les formats que le code accepte)
console.log('=== Test upload par mime type ===\n');
const tests = [
  { name: 'application/pdf', ext: 'pdf', content: new Uint8Array([0x25, 0x50, 0x44, 0x46]) }, // %PDF
  { name: 'image/jpeg', ext: 'jpg', content: new Uint8Array([0xFF, 0xD8, 0xFF]) },
  { name: 'image/png', ext: 'png', content: new Uint8Array([0x89, 0x50, 0x4E, 0x47]) },
];

for (const t of tests) {
  const path = `_health-check/test-${Date.now()}.${t.ext}`;
  const { error: upErr } = await supabase.storage
    .from('verification-documents')
    .upload(path, t.content, { contentType: t.name, upsert: true });
  if (upErr) {
    console.log(`  ❌ ${t.name}: ${upErr.message}`);
  } else {
    console.log(`  ✓ ${t.name}: OK`);
    await supabase.storage.from('verification-documents').remove([path]);
  }
}

// Vérifier les RLS policies sur la table verification_documents
console.log('\n=== RLS policies sur verification_documents ===');
const { data: policies, error: polErr } = await supabase
  .rpc('exec_sql', { sql: "SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'public.verification_documents'::regclass" })
  .single();
if (polErr) {
  // Fallback: try simpler query
  console.log('  (impossible de query pg_policy directement)');
}

// Compter combien de pros ont AU MOINS commencé un upload (un fichier dans cvs ou diplomas)
console.log('\n=== Pros 30j : qui a tenté QUELQUE CHOSE ? ===\n');
const thirtyDaysAgo = new Date(Date.now() - 30*24*3600*1000).toISOString();
const { data: recentPros } = await supabase
  .from('educator_profiles')
  .select('id, first_name, last_name, created_at, cv_url, diploma_url, verification_status, user_id')
  .gte('created_at', thirtyDaysAgo)
  .order('created_at', { ascending: false });

let withCv = 0, withDiploma = 0, withAnyDoc = 0;
for (const p of recentPros || []) {
  const { count } = await supabase
    .from('verification_documents')
    .select('*', { count: 'exact', head: true })
    .eq('educator_id', p.id);
  if (p.cv_url) withCv++;
  if (p.diploma_url) withDiploma++;
  if (count > 0) withAnyDoc++;
}
console.log(`Total pros 30j: ${recentPros?.length || 0}`);
console.log(`  → avec CV uploadé: ${withCv}`);
console.log(`  → avec diploma_url: ${withDiploma}`);
console.log(`  → avec >=1 verification_document: ${withAnyDoc}`);
