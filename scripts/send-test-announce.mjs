// Envoi d'un email de test "annonce visibilité pros" via Resend.
// Usage: node --env-file=.env.local scripts/send-test-announce.mjs [destinataire]
import { Resend } from 'resend';
import { buildAnnounceVisibilityProsEmail } from '../lib/email-templates/announce-visibility-pros.ts';

const to = process.argv[2] || 'zakariyanebbache@gmail.com';
const prenom = 'Zakariya';

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY manquant. Lance avec : node --env-file=.env.local scripts/send-test-announce.mjs');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);
const { subject, html, text } = buildAnnounceVisibilityProsEmail(prenom);

console.log(`→ Envoi à ${to}…`);
const { data, error } = await resend.emails.send({
  from: 'NeuroCare Pro <admin@neuro-care.fr>',
  to: [to],
  subject: `[TEST] ${subject}`,
  html,
  text,
});

if (error) {
  console.error('❌ Resend a renvoyé une erreur :', error);
  process.exit(1);
}
console.log('✔ Envoyé. Resend ID :', data?.id);
