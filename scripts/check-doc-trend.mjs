// Vérifie quand les derniers documents ont été uploadés (regression check)
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('./.env.local', 'utf8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, '')]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// 20 derniers verification_documents
const { data: latest, error } = await supabase
  .from('verification_documents')
  .select('document_type, status, uploaded_at, file_url, educator_id')
  .order('uploaded_at', { ascending: false })
  .limit(20);

if (error) { console.error(error); process.exit(1); }

console.log('\n=== 20 derniers verification_documents ===\n');
for (const d of latest) {
  console.log(`${d.uploaded_at}  ${d.document_type.padEnd(16)}  ${d.status.padEnd(10)}  ${d.file_url ? '[file]' : '[NO FILE]'}  educator=${d.educator_id?.slice(0,8)}`);
}

// Compte par jour sur les 30 derniers jours
const thirtyDaysAgo = new Date(Date.now() - 30*24*3600*1000).toISOString();
const { data: recent } = await supabase
  .from('verification_documents')
  .select('uploaded_at')
  .gte('uploaded_at', thirtyDaysAgo);

const byDay = {};
for (const r of recent || []) {
  const day = r.uploaded_at.slice(0,10);
  byDay[day] = (byDay[day] || 0) + 1;
}
console.log('\n=== Uploads par jour (30 derniers jours) ===\n');
const days = Object.keys(byDay).sort();
for (const d of days) console.log(`${d}: ${byDay[d]}`);
console.log(`\nTOTAL 30j: ${recent?.length || 0}`);

// Combien de pros inscrits 30 derniers jours
const { count: prosCount } = await supabase
  .from('educator_profiles')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', thirtyDaysAgo);
console.log(`Pros inscrits 30j: ${prosCount}`);

// Vérifier les buckets storage et leurs policies
const { data: buckets } = await supabase.storage.listBuckets();
console.log('\n=== Buckets ===');
for (const b of buckets || []) {
  console.log(`  ${b.name}  (public=${b.public})`);
}

// Test d'écriture dans verification-documents (en tant qu'admin via service_role)
console.log('\n=== Test write verification-documents bucket ===');
const testPath = `_health-check/${Date.now()}.txt`;
const { error: writeErr } = await supabase.storage
  .from('verification-documents')
  .upload(testPath, new Blob(['test']), { upsert: true });
if (writeErr) {
  console.log(`  ❌ ÉCRITURE ÉCHOUE: ${writeErr.message}`);
} else {
  console.log(`  ✓ ÉCRITURE OK (en service_role)`);
  await supabase.storage.from('verification-documents').remove([testPath]);
}
