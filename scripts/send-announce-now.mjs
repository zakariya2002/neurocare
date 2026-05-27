// Envoi PROD : annonce visibilité à TOUS les pros non vérifiés + zakariyanebbache@gmail.com.
// Usage: npx tsx --env-file=.env.local scripts/send-announce-now.mjs [--dry]
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { buildAnnounceVisibilityProsEmail } from '../lib/email-templates/announce-visibility-pros.ts';

const DRY = process.argv.includes('--dry');
const EXTRA = ['zakariyanebbache@gmail.com'];

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables Supabase manquantes (.env.local)');
  process.exit(1);
}
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY manquant');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'NeuroCare Pro <admin@neuro-care.fr>';

async function getRecipients() {
  const { data: profiles, error } = await supabase
    .from('educator_profiles')
    .select('id, user_id, first_name, suspended_until')
    .eq('verification_badge', false);
  if (error) throw error;

  const now = Date.now();
  const candidates = (profiles || []).filter((p) => {
    if (!p.user_id) return false;
    if (p.suspended_until) {
      const until = new Date(p.suspended_until).getTime();
      if (Number.isFinite(until) && until > now) return false;
    }
    return true;
  });

  const recipients = [];
  const BATCH = 20;
  for (let i = 0; i < candidates.length; i += BATCH) {
    const slice = candidates.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map(async (p) => {
        try {
          const { data } = await supabase.auth.admin.getUserById(p.user_id);
          const email = data?.user?.email;
          if (!email) return null;
          return { email, prenom: p.first_name || 'Bonjour' };
        } catch {
          return null;
        }
      }),
    );
    for (const r of results) if (r) recipients.push(r);
  }
  return recipients;
}

const recipients = await getRecipients();
const seen = new Set(recipients.map((r) => r.email.toLowerCase()));
for (const email of EXTRA) {
  if (!seen.has(email.toLowerCase())) {
    recipients.push({ email, prenom: 'Zakariya' });
  }
}

console.log(`\n📋 Destinataires : ${recipients.length}`);
for (const r of recipients) console.log(`  - ${r.email}  (${r.prenom})`);

if (DRY) {
  console.log('\n⚠️  Mode --dry : aucun envoi.');
  process.exit(0);
}

console.log(`\n🚀 Envoi en cours…\n`);
let sent = 0, failed = 0;
const failures = [];
for (const r of recipients) {
  try {
    const { subject, html, text } = buildAnnounceVisibilityProsEmail(r.prenom);
    const { error } = await resend.emails.send({
      from: FROM,
      to: [r.email],
      subject,
      html,
      text,
    });
    if (error) {
      failed++;
      failures.push({ email: r.email, error: error.message || 'unknown' });
      console.log(`  ✘ ${r.email}  → ${error.message || 'erreur'}`);
    } else {
      sent++;
      console.log(`  ✔ ${r.email}`);
    }
  } catch (err) {
    failed++;
    failures.push({ email: r.email, error: err?.message || 'exception' });
    console.log(`  ✘ ${r.email}  → ${err?.message || 'exception'}`);
  }
  await new Promise((r) => setTimeout(r, 110));
}

console.log(`\n✅ Total envoyés : ${sent}/${recipients.length}  —  Échecs : ${failed}`);
if (failures.length) {
  console.log('\n⚠️  Échecs :');
  for (const f of failures) console.log(`  - ${f.email}: ${f.error}`);
}
