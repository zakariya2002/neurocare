import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NeuroCare <noreply@neuro-care.fr>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@neuro-care.fr';

// ─── STYLES COMMUNS ───
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fdf9f4;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    ${content}
    <div style="text-align:center;padding:20px;color:#888;font-size:12px;">
      <p>&copy; 2025 NeuroCare - Plateforme de mise en relation familles-professionnels</p>
      <p><a href="${APP_URL}" style="color:#027e7e;text-decoration:none;">neuro-care.fr</a></p>
    </div>
  </div>
</body>
</html>`;

const header = (title: string) => `
<div style="background-color:#027e7e;color:white;padding:24px 30px;text-align:center;border-radius:12px 12px 0 0;">
  <h1 style="margin:0;font-size:20px;">${title}</h1>
</div>`;

const body = (content: string) => `
<div style="background:white;padding:24px 30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
  ${content}
</div>`;

const button = (text: string, url: string) =>
  `<a href="${url}" style="display:inline-block;padding:12px 28px;background-color:#027e7e;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0;">${text}</a>`;

const infoBox = (text: string) =>
  `<div style="background-color:#e6f4f4;border-left:4px solid #027e7e;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;"><p style="margin:0;color:#027e7e;font-weight:500;">${text}</p></div>`;

const warningBox = (text: string) =>
  `<div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;"><p style="margin:0;color:#92400e;font-weight:500;">${text}</p></div>`;

// ─── TYPE DEFINITIONS ───
export type DiplomaStatusChange = 'submitted' | 'verified' | 'rejected';

interface EducatorEmailData {
  email: string;
  firstName: string;
  lastName: string;
  diplomaSubmittedAt?: string;
  diplomaRejectedReason?: string;
}

// ═══════════════════════════════════════════
// AGENT EMAILS & NOTIFS — Toutes les fonctions
// ═══════════════════════════════════════════

/**
 * 1. EMAIL DE BIENVENUE — Famille
 */
export async function sendFamilyWelcomeEmail(to: string, firstName: string): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Bienvenue sur NeuroCare',
      html: emailWrapper(`
        ${header('Bienvenue sur NeuroCare !')}
        ${body(`
          <p>Bonjour ${firstName},</p>
          <p>Votre compte famille a été créé avec succès.</p>
          ${infoBox('Vous pouvez dès maintenant rechercher des professionnels qualifiés et vérifiés.')}
          <p><strong>Prochaines étapes :</strong></p>
          <ul>
            <li>Complétez votre profil</li>
            <li>Recherchez un professionnel par ville ou spécialité</li>
            <li>Prenez rendez-vous en ligne</li>
          </ul>
          ${button('Rechercher un professionnel', `${APP_URL}/search`)}
          <p>L'équipe <strong style="color:#027e7e;">NeuroCare</strong></p>
        `)}
      `),
    });
  } catch (error) {
    console.error('Email bienvenue famille échoué:', error);
  }
}

/**
 * 2. EMAIL DE BIENVENUE — Éducateur
 */
export async function sendEducatorWelcomeEmail(to: string, firstName: string): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Bienvenue sur NeuroCare Pro',
      html: emailWrapper(`
        ${header('Bienvenue sur NeuroCare Pro !')}
        ${body(`
          <p>Bonjour ${firstName},</p>
          <p>Votre compte professionnel a été créé avec succès.</p>
          ${infoBox('Pour apparaître dans les résultats de recherche, veuillez soumettre votre diplôme pour vérification.')}
          <p><strong>Prochaines étapes :</strong></p>
          <ul>
            <li>Uploadez votre diplôme pour vérification</li>
            <li>Complétez votre profil (bio, spécialisations, tarifs)</li>
            <li>Configurez vos disponibilités</li>
          </ul>
          ${button('Compléter mon profil', `${APP_URL}/dashboard/educator`)}
          <p>L'équipe <strong style="color:#027e7e;">NeuroCare Pro</strong></p>
        `)}
      `),
    });
  } catch (error) {
    console.error('Email bienvenue éducateur échoué:', error);
  }
}

/**
 * 3. EMAIL CHANGEMENT STATUT DIPLÔME
 */
export async function sendDiplomaStatusEmail(
  educator: EducatorEmailData,
  status: DiplomaStatusChange
): Promise<void> {
  const subjects: Record<DiplomaStatusChange, string> = {
    submitted: 'Diplôme reçu - Vérification en cours',
    verified: 'Diplôme vérifié - Votre profil est visible !',
    rejected: 'Diplôme refusé - Action requise',
  };

  const bodies: Record<DiplomaStatusChange, string> = {
    submitted: `
      <p>Bonjour ${educator.firstName},</p>
      <p>Nous avons bien reçu votre diplôme. Notre équipe va le vérifier dans les <strong>24 à 48 heures</strong>.</p>
      ${warningBox('Votre profil n\'est pas encore visible dans les recherches.')}
      <p>Vous recevrez un email dès que la vérification sera terminée.</p>
      ${button('Voir le statut', `${APP_URL}/dashboard/educator/diploma`)}
    `,
    verified: `
      <p>Bonjour ${educator.firstName},</p>
      ${infoBox('Votre diplôme a été vérifié avec succès ! Votre profil est maintenant visible.')}
      <p>Les familles peuvent désormais vous trouver et vous contacter.</p>
      <p><strong>Prochaines étapes :</strong></p>
      <ul>
        <li>Vérifiez que votre profil est complet</li>
        <li>Configurez vos disponibilités</li>
        <li>Répondez rapidement aux messages</li>
      </ul>
      ${button('Mon tableau de bord', `${APP_URL}/dashboard/educator`)}
    `,
    rejected: `
      <p>Bonjour ${educator.firstName},</p>
      ${warningBox('Votre diplôme n\'a pas pu être vérifié.')}
      ${educator.diplomaRejectedReason ? `<p><strong>Raison :</strong> ${educator.diplomaRejectedReason}</p>` : ''}
      <p><strong>Que faire ?</strong></p>
      <ul>
        <li>Vérifiez que votre document est lisible</li>
        <li>Assurez-vous qu'il s'agit du bon diplôme</li>
        <li>Re-soumettez votre diplôme</li>
      </ul>
      ${button('Re-soumettre', `${APP_URL}/dashboard/educator/diploma`)}
    `,
  };

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: educator.email,
      subject: subjects[status],
      html: emailWrapper(`
        ${header(subjects[status])}
        ${body(`${bodies[status]}<p>L'équipe <strong style="color:#027e7e;">NeuroCare Pro</strong></p>`)}
      `),
    });
  } catch (error) {
    console.error(`Email diplôme (${status}) échoué:`, error);
  }
}

/**
 * 4. NOTIFICATION ADMIN — Nouveau diplôme soumis
 */
export async function notifyAdminNewDiploma(educator: EducatorEmailData): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Nouveau diplôme à vérifier - ${educator.firstName} ${educator.lastName}`,
      html: emailWrapper(`
        ${header('Nouveau diplôme à vérifier')}
        ${body(`
          <p><strong>Éducateur :</strong> ${educator.firstName} ${educator.lastName}</p>
          <p><strong>Email :</strong> ${educator.email}</p>
          <p><strong>Date :</strong> ${educator.diplomaSubmittedAt || new Date().toLocaleDateString('fr-FR')}</p>
          ${button('Vérifier maintenant', `${APP_URL}/admin/verifications`)}
        `)}
      `),
    });
  } catch (error) {
    console.error('Email notification admin échoué:', error);
  }
}

/**
 * 5. EMAIL CONFIRMATION RENDEZ-VOUS — Famille
 */
export async function sendAppointmentConfirmationFamily(
  to: string,
  data: {
    familyName: string;
    educatorName: string;
    date: string;
    time: string;
    amount: string;
  }
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Rendez-vous confirmé avec ${data.educatorName}`,
      html: emailWrapper(`
        ${header('Rendez-vous confirmé')}
        ${body(`
          <p>Bonjour ${data.familyName},</p>
          <p>Votre rendez-vous a été confirmé.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#666;">Professionnel</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${data.educatorName}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#666;">Date</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${data.date}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#666;">Heure</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${data.time}</td></tr>
            <tr><td style="padding:8px;color:#666;">Montant</td><td style="padding:8px;font-weight:600;">${data.amount}</td></tr>
          </table>
          ${button('Mes rendez-vous', `${APP_URL}/dashboard/family/bookings`)}
          <p>L'équipe <strong style="color:#027e7e;">NeuroCare</strong></p>
        `)}
      `),
    });
  } catch (error) {
    console.error('Email confirmation RDV famille échoué:', error);
  }
}

/**
 * 6. EMAIL NOTIFICATION RENDEZ-VOUS — Éducateur
 */
export async function sendAppointmentNotificationEducator(
  to: string,
  data: {
    educatorName: string;
    familyName: string;
    date: string;
    time: string;
    status: 'new' | 'accepted' | 'cancelled';
  }
): Promise<void> {
  const subjects: Record<string, string> = {
    new: `Nouvelle demande de rendez-vous de ${data.familyName}`,
    accepted: `Rendez-vous confirmé avec ${data.familyName}`,
    cancelled: `Rendez-vous annulé - ${data.familyName}`,
  };

  const contents: Record<string, string> = {
    new: `
      <p>Bonjour ${data.educatorName},</p>
      <p>Vous avez reçu une nouvelle demande de rendez-vous.</p>
      ${infoBox(`${data.familyName} souhaite un rendez-vous le ${data.date} à ${data.time}`)}
      <p>Veuillez accepter ou refuser cette demande depuis votre tableau de bord.</p>
      ${button('Voir la demande', `${APP_URL}/dashboard/educator/appointments`)}
    `,
    accepted: `
      <p>Bonjour ${data.educatorName},</p>
      ${infoBox(`Votre rendez-vous avec ${data.familyName} le ${data.date} à ${data.time} est confirmé.`)}
      ${button('Mes rendez-vous', `${APP_URL}/dashboard/educator/appointments`)}
    `,
    cancelled: `
      <p>Bonjour ${data.educatorName},</p>
      ${warningBox(`Le rendez-vous avec ${data.familyName} prévu le ${data.date} à ${data.time} a été annulé.`)}
      ${button('Mon tableau de bord', `${APP_URL}/dashboard/educator`)}
    `,
  };

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: subjects[data.status],
      html: emailWrapper(`
        ${header(subjects[data.status])}
        ${body(`${contents[data.status]}<p>L'équipe <strong style="color:#027e7e;">NeuroCare Pro</strong></p>`)}
      `),
    });
  } catch (error) {
    console.error(`Email RDV éducateur (${data.status}) échoué:`, error);
  }
}

/**
 * 7. EMAIL CONFIRMATION PAIEMENT
 */
export async function sendPaymentConfirmation(
  to: string,
  data: {
    name: string;
    amount: string;
    educatorName: string;
    date: string;
    invoiceUrl?: string;
  }
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Paiement confirmé - ${data.amount}`,
      html: emailWrapper(`
        ${header('Paiement confirmé')}
        ${body(`
          <p>Bonjour ${data.name},</p>
          <p>Votre paiement a bien été enregistré.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#666;">Montant</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${data.amount}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#666;">Professionnel</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${data.educatorName}</td></tr>
            <tr><td style="padding:8px;color:#666;">Date</td><td style="padding:8px;font-weight:600;">${data.date}</td></tr>
          </table>
          ${infoBox('Votre reçu est disponible dans votre espace personnel. Vous pouvez le télécharger pour vos démarches de remboursement.')}
          ${button('Voir mon reçu', `${APP_URL}/dashboard/family/bookings`)}
          <p>L'équipe <strong style="color:#027e7e;">NeuroCare</strong></p>
        `)}
      `),
    });
  } catch (error) {
    console.error('Email confirmation paiement échoué:', error);
  }
}

/**
 * 8. EMAIL RÉINITIALISATION MOT DE PASSE
 */
export async function sendPasswordResetEmail(
  to: string,
  data: { firstName: string; resetUrl: string }
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Réinitialisation de votre mot de passe NeuroCare',
      html: emailWrapper(`
        ${header('Réinitialisation du mot de passe')}
        ${body(`
          <p>Bonjour ${data.firstName},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          ${button('Réinitialiser mon mot de passe', data.resetUrl)}
          ${warningBox('Ce lien est valide pendant 1 heure. Si vous n\'avez pas fait cette demande, ignorez cet email.')}
          <p>L'équipe <strong style="color:#027e7e;">NeuroCare</strong></p>
        `)}
      `),
    });
  } catch (error) {
    console.error('Email reset password échoué:', error);
  }
}

// ─── EXPORT GROUPÉ ───
export const emailService = {
  sendFamilyWelcomeEmail,
  sendEducatorWelcomeEmail,
  sendDiplomaStatusEmail,
  notifyAdminNewDiploma,
  sendAppointmentConfirmationFamily,
  sendAppointmentNotificationEducator,
  sendPaymentConfirmation,
  sendPasswordResetEmail,
};
