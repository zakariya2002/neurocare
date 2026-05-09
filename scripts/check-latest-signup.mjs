// Script de vérification : dernière inscription + documents reçus
// Usage : node scripts/check-latest-signup.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const REQUIRED_DOCS = ['diploma', 'criminal_record', 'id_card', 'insurance'];

async function main() {
  console.log('\n=== 5 dernières inscriptions (tous types) ===\n');

  const { data: latestUsers, error: usersErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 10,
  });
  if (usersErr) throw usersErr;

  const sorted = (latestUsers?.users || [])
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  for (const u of sorted) {
    const { data: ep } = await supabase
      .from('educator_profiles')
      .select('id, first_name, last_name, profession_type, verification_status, created_at')
      .eq('user_id', u.id)
      .maybeSingle();
    const { data: fp } = await supabase
      .from('family_profiles')
      .select('id, first_name, last_name, created_at')
      .eq('user_id', u.id)
      .maybeSingle();

    const kind = ep ? 'PRO' : fp ? 'FAMILLE' : 'SANS PROFIL';
    const name = ep ? `${ep.first_name} ${ep.last_name}` : fp ? `${fp.first_name} ${fp.last_name}` : '-';
    console.log(`[${kind}] ${u.email}  •  ${name}  •  inscrit le ${new Date(u.created_at).toLocaleString('fr-FR')}`);
    if (ep) {
      console.log(`         profession=${ep.profession_type || 'NULL'}  status=${ep.verification_status || 'NULL'}`);
    }
  }

  // Trouver le PRO le plus récent
  console.log('\n=== Documents du dernier PRO inscrit ===\n');

  const { data: latestPros } = await supabase
    .from('educator_profiles')
    .select('id, first_name, last_name, profession_type, verification_status, created_at, user_id, rpps_number, diploma_type, cv_url, region, diploma_url')
    .order('created_at', { ascending: false })
    .limit(3);

  if (!latestPros || latestPros.length === 0) {
    console.log('Aucun pro inscrit.');
    return;
  }

  for (const pro of latestPros) {
    const { data: userData } = await supabase.auth.admin.getUserById(pro.user_id);
    const email = userData?.user?.email || 'N/A';

    const { data: docs } = await supabase
      .from('verification_documents')
      .select('document_type, status, file_url, uploaded_at')
      .eq('educator_id', pro.id)
      .order('uploaded_at', { ascending: false });

    console.log(`──────────────────────────────────────────`);
    console.log(`${pro.first_name} ${pro.last_name}  (${email})`);
    console.log(`  Profession: ${pro.profession_type || 'NULL'}`);
    console.log(`  Région: ${pro.region || 'NULL'}`);
    console.log(`  RPPS: ${pro.rpps_number || 'NULL'}`);
    console.log(`  Diploma type: ${pro.diploma_type || 'NULL'}`);
    console.log(`  diploma_url (col legacy): ${pro.diploma_url ? 'OUI → ' + pro.diploma_url : 'NON'}`);
    console.log(`  CV: ${pro.cv_url ? 'OUI' : 'NON'}`);
    console.log(`  Statut vérification: ${pro.verification_status || 'NULL'}`);
    console.log(`  Inscrit le: ${new Date(pro.created_at).toLocaleString('fr-FR')}`);
    console.log(`  Documents (${docs?.length || 0}/4 attendus) :`);

    const uploadedTypes = (docs || []).map(d => d.document_type);
    for (const required of REQUIRED_DOCS) {
      const doc = docs?.find(d => d.document_type === required);
      if (doc) {
        console.log(`    ✓ ${required.padEnd(16)} → ${doc.status.padEnd(8)}  (${doc.file_url ? 'fichier OK' : 'PAS DE FICHIER'})`);
      } else {
        console.log(`    ✗ ${required.padEnd(16)} → MANQUANT`);
      }
    }

    // Check for unexpected types
    const extras = uploadedTypes.filter(t => !REQUIRED_DOCS.includes(t));
    if (extras.length > 0) {
      console.log(`  ⚠️  Types inattendus: ${extras.join(', ')}`);
    }
    console.log('');
  }
}

main().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
