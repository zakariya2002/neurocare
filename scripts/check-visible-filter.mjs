import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// IDs exposés par la vue
const { data: viewIds } = await supabase
  .from('public_educator_profiles')
  .select('id');
const setView = new Set((viewIds || []).map(r => r.id));

// Tous les educator_profiles
const { data: all, error: allErr } = await supabase
  .from('educator_profiles')
  .select('id, profile_visible, verification_badge, verification_status, diploma_verification_status');
if (allErr) { console.error(allErr); process.exit(1); }

console.log(`View exposes ${setView.size} / ${all.length} rows\n`);
console.log('ID      ', 'inView', 'visible', 'verif_badge', 'verif_status', 'diploma_status');
console.log('─'.repeat(90));
for (const r of all) {
  const inView = setView.has(r.id) ? 'OUI' : ' . ';
  console.log(
    r.id.slice(0,8),
    inView.padEnd(6),
    String(r.profile_visible).padEnd(7),
    String(r.verification_badge).padEnd(11),
    String(r.verification_status).padEnd(12),
    String(r.diploma_verification_status),
  );
}
