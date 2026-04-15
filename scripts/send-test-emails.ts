import { Resend } from 'resend';
import { getEducatorWelcomeEmail } from '../lib/email-templates/educator-welcome';
import { getFamilyWelcomeEmail } from '../lib/email-templates/family-welcome';
import { getPasswordResetEmail } from '../lib/email-templates/password-reset';
import { getNewsletterWelcomeEmail } from '../lib/email-templates/newsletter-welcome';
import { getFamilyAppointmentConfirmedEmail } from '../lib/email-templates/family-appointment-confirmed';
import { getFamilyAppointmentCancelledEmail } from '../lib/email-templates/family-appointment-cancelled';

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = 'contact@neuro-care.fr';
const FROM = 'NeuroCare <admin@neuro-care.fr>';

const emails = [
  {
    subject: '[TEST 1/6] Bienvenue Éducateur (avec confirmation)',
    html: getEducatorWelcomeEmail('Zakariya', 'https://neuro-care.fr/auth/login?confirmed=true'),
  },
  {
    subject: '[TEST 2/6] Bienvenue Famille (avec confirmation)',
    html: getFamilyWelcomeEmail('Marie', 'https://neuro-care.fr/auth/login?confirmed=true'),
  },
  {
    subject: '[TEST 3/6] Réinitialisation mot de passe',
    html: getPasswordResetEmail('Zakariya', 'https://neuro-care.fr/auth/reset-password?token=test'),
  },
  {
    subject: '[TEST 4/6] Newsletter bienvenue',
    html: getNewsletterWelcomeEmail('Marie', 'famille', 'contact@neuro-care.fr'),
  },
  {
    subject: '[TEST 5/6] RDV confirmé',
    html: getFamilyAppointmentConfirmedEmail({
      firstName: 'Marie',
      educatorName: 'Dr. Sophie Martin',
      appointmentDate: 'Mercredi 26 mars 2026',
      appointmentTime: '14h00',
      childName: 'Lucas',
      address: '12 rue de la Paix, Paris',
    }),
  },
  {
    subject: '[TEST 6/6] RDV annulé',
    html: getFamilyAppointmentCancelledEmail({
      firstName: 'Marie',
      educatorName: 'Dr. Sophie Martin',
      appointmentDate: 'Mercredi 26 mars 2026',
      appointmentTime: '14h00',
      reason: 'Indisponibilité du professionnel',
      cancelledBy: 'educator',
    }),
  },
];

async function main() {
  console.log(`Envoi de ${emails.length} emails de test à ${TO}...\n`);

  for (const email of emails) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM,
        to: [TO],
        subject: email.subject,
        html: email.html,
      });

      if (error) {
        console.error(`❌ ${email.subject}: ${error.message}`);
      } else {
        console.log(`✅ ${email.subject} (ID: ${data?.id})`);
      }
    } catch (err: any) {
      console.error(`❌ ${email.subject}: ${err.message}`);
    }

    // Petit délai entre chaque envoi
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nTerminé !');
}

main().catch(e => console.error('Erreur fatale:', e));
