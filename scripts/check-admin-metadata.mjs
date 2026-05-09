import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (error) {
  console.error('Erreur:', error);
  process.exit(1);
}

const admins = data.users.filter(u =>
  u.user_metadata?.role === 'admin' || u.app_metadata?.role === 'admin'
);

console.log(`\n${admins.length} utilisateur(s) marqué(s) admin\n`);
console.log('─'.repeat(100));
console.log('EMAIL'.padEnd(40), 'user_meta', 'app_meta', 'STATUT');
console.log('─'.repeat(100));

let needFix = 0;
for (const u of admins) {
  const um = u.user_metadata?.role === 'admin' ? '✅' : '  ';
  const am = u.app_metadata?.role === 'admin' ? '✅' : '  ';
  let statut = '';
  if (u.app_metadata?.role === 'admin') {
    statut = 'OK (sécurisé)';
  } else {
    statut = '⚠️  À MIGRER (user_metadata seulement)';
    needFix++;
  }
  console.log((u.email || u.id).padEnd(40), '   ' + um + '    ', '   ' + am + '    ', statut);
}
console.log('─'.repeat(100));
console.log(`\n${needFix} admin(s) à migrer vers app_metadata\n`);
