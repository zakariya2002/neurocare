import { Resend } from 'resend';
import { emailLayout, emailHeader, emailBody, emailButton, emailInfoBox, emailWarningBox, emailSignature, emailTable, emailDivider, emailColors } from './email-templates/base';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NeuroCare <noreply@neuro-care.fr>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@neuro-care.fr';

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
// EMAILS & NOTIFICATIONS
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
      html: emailLayout(`
        ${emailHeader('Bienvenue sur NeuroCare !', 'Nous sommes l\u00e0 pour vous accompagner')}
        ${emailBody(`
          <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${firstName},</p>
          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">Votre compte famille a \u00e9t\u00e9 cr\u00e9\u00e9 avec succ\u00e8s.</p>
          ${emailInfoBox('Vous pouvez d\u00e8s maintenant rechercher des professionnels qualifi\u00e9s et v\u00e9rifi\u00e9s.')}
          <p style="margin: 20px 0 10px; font-size: 15px; font-weight: 600; color: ${emailColors.text};">Prochaines \u00e9tapes :</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; Compl\u00e9tez votre profil</td></tr>
            <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; Recherchez un professionnel par ville ou sp\u00e9cialit\u00e9</td></tr>
            <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; Prenez rendez-vous en ligne</td></tr>
          </table>
          ${emailButton('Rechercher un professionnel', `${APP_URL}/search`)}
          ${emailSignature()}
        `)}
      `),
    });
  } catch (error) {
    console.error('Email bienvenue famille \u00e9chou\u00e9:', error);
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
      html: emailLayout(`
        ${emailHeader('Bienvenue sur NeuroCare Pro !', 'Plateforme pour les professionnels du neurod\u00e9veloppement')}
        ${emailBody(`
          <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${firstName},</p>
          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">Votre compte professionnel a \u00e9t\u00e9 cr\u00e9\u00e9 avec succ\u00e8s.</p>
          ${emailInfoBox('Pour appara\u00eetre dans les r\u00e9sultats de recherche, veuillez soumettre vos documents pour v\u00e9rification.')}
          <p style="margin: 20px 0 10px; font-size: 15px; font-weight: 600; color: ${emailColors.text};">Prochaines \u00e9tapes :</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; Uploadez vos documents pour v\u00e9rification</td></tr>
            <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; Compl\u00e9tez votre profil (bio, sp\u00e9cialisations, tarifs)</td></tr>
            <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; Configurez vos disponibilit\u00e9s</td></tr>
          </table>
          ${emailButton('Compl\u00e9ter mon profil', `${APP_URL}/dashboard/educator`)}
          ${emailSignature('NeuroCare Pro')}
        `)}
      `),
    });
  } catch (error) {
    console.error('Email bienvenue \u00e9ducateur \u00e9chou\u00e9:', error);
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
    submitted: 'Dipl\u00f4me re\u00e7u - V\u00e9rification en cours',
    verified: 'Dipl\u00f4me v\u00e9rifi\u00e9 - Votre profil est visible !',
    rejected: 'Dipl\u00f4me refus\u00e9 - Action requise',
  };

  const bodies: Record<DiplomaStatusChange, string> = {
    submitted: `
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${educator.firstName},</p>
      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">Nous avons bien re\u00e7u votre dipl\u00f4me. Notre \u00e9quipe va le v\u00e9rifier dans les <strong>24 \u00e0 48 heures</strong>.</p>
      ${emailWarningBox('Votre profil n\'est pas encore visible dans les recherches.')}
      <p style="margin: 0 0 8px; font-size: 14px; color: ${emailColors.textLight};">Vous recevrez un email d\u00e8s que la v\u00e9rification sera termin\u00e9e.</p>
      ${emailButton('Voir le statut', `${APP_URL}/dashboard/educator/diploma`)}
    `,
    verified: `
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${educator.firstName},</p>
      ${emailInfoBox('Votre dipl\u00f4me a \u00e9t\u00e9 v\u00e9rifi\u00e9 avec succ\u00e8s ! Votre profil est maintenant visible.')}
      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">Les familles peuvent d\u00e9sormais vous trouver et vous contacter.</p>
      <p style="margin: 20px 0 10px; font-size: 15px; font-weight: 600; color: ${emailColors.text};">Prochaines \u00e9tapes :</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; V\u00e9rifiez que votre profil est complet</td></tr>
        <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; Configurez vos disponibilit\u00e9s</td></tr>
        <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; R\u00e9pondez rapidement aux messages</td></tr>
      </table>
      ${emailButton('Mon tableau de bord', `${APP_URL}/dashboard/educator`)}
    `,
    rejected: `
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${educator.firstName},</p>
      ${emailWarningBox('Votre dipl\u00f4me n\'a pas pu \u00eatre v\u00e9rifi\u00e9.')}
      ${educator.diplomaRejectedReason ? `<p style="margin: 0 0 20px; font-size: 14px; color: ${emailColors.text};"><strong>Raison :</strong> ${educator.diplomaRejectedReason}</p>` : ''}
      <p style="margin: 20px 0 10px; font-size: 15px; font-weight: 600; color: ${emailColors.text};">Que faire ?</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; V\u00e9rifiez que votre document est lisible</td></tr>
        <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; Assurez-vous qu'il s'agit du bon dipl\u00f4me</td></tr>
        <tr><td style="padding: 8px 0; font-size: 14px; color: #333;">&#8226;&nbsp; Re-soumettez votre dipl\u00f4me</td></tr>
      </table>
      ${emailButton('Re-soumettre', `${APP_URL}/dashboard/educator/diploma`)}
    `,
  };

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: educator.email,
      subject: subjects[status],
      html: emailLayout(`
        ${emailHeader(subjects[status])}
        ${emailBody(`${bodies[status]}${emailSignature('NeuroCare Pro')}`)}
      `),
    });
  } catch (error) {
    console.error(`Email dipl\u00f4me (${status}) \u00e9chou\u00e9:`, error);
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
      subject: `Nouveau dipl\u00f4me \u00e0 v\u00e9rifier - ${educator.firstName} ${educator.lastName}`,
      html: emailLayout(`
        ${emailHeader('Nouveau dipl\u00f4me \u00e0 v\u00e9rifier')}
        ${emailBody(`
          ${emailTable([
            { label: '\u00c9ducateur', value: `${educator.firstName} ${educator.lastName}` },
            { label: 'Email', value: educator.email },
            { label: 'Date', value: educator.diplomaSubmittedAt || new Date().toLocaleDateString('fr-FR') },
          ])}
          ${emailButton('V\u00e9rifier maintenant', `${APP_URL}/admin/verifications`)}
        `)}
      `),
    });
  } catch (error) {
    console.error('Email notification admin \u00e9chou\u00e9:', error);
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
      subject: `Rendez-vous confirm\u00e9 avec ${data.educatorName}`,
      html: emailLayout(`
        ${emailHeader('Rendez-vous confirm\u00e9', undefined, { icon: '&#9989;' })}
        ${emailBody(`
          <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${data.familyName},</p>
          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">Votre rendez-vous a \u00e9t\u00e9 confirm\u00e9.</p>
          ${emailTable([
            { label: 'Professionnel', value: data.educatorName },
            { label: 'Date', value: data.date },
            { label: 'Heure', value: data.time },
            { label: 'Montant', value: data.amount },
          ])}
          ${emailButton('Mes rendez-vous', `${APP_URL}/dashboard/family/bookings`)}
          ${emailSignature()}
        `)}
      `),
    });
  } catch (error) {
    console.error('Email confirmation RDV famille \u00e9chou\u00e9:', error);
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
    accepted: `Rendez-vous confirm\u00e9 avec ${data.familyName}`,
    cancelled: `Rendez-vous annul\u00e9 - ${data.familyName}`,
  };

  const contents: Record<string, string> = {
    new: `
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${data.educatorName},</p>
      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">Vous avez re\u00e7u une nouvelle demande de rendez-vous.</p>
      ${emailInfoBox(`${data.familyName} souhaite un rendez-vous le ${data.date} \u00e0 ${data.time}`)}
      <p style="margin: 0 0 8px; font-size: 14px; color: ${emailColors.textLight};">Veuillez accepter ou refuser depuis votre tableau de bord.</p>
      ${emailButton('Voir la demande', `${APP_URL}/dashboard/educator/appointments`)}
    `,
    accepted: `
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${data.educatorName},</p>
      ${emailInfoBox(`Votre rendez-vous avec ${data.familyName} le ${data.date} \u00e0 ${data.time} est confirm\u00e9.`)}
      ${emailButton('Mes rendez-vous', `${APP_URL}/dashboard/educator/appointments`)}
    `,
    cancelled: `
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${data.educatorName},</p>
      ${emailWarningBox(`Le rendez-vous avec ${data.familyName} pr\u00e9vu le ${data.date} \u00e0 ${data.time} a \u00e9t\u00e9 annul\u00e9.`)}
      ${emailButton('Mon tableau de bord', `${APP_URL}/dashboard/educator`)}
    `,
  };

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: subjects[data.status],
      html: emailLayout(`
        ${emailHeader(subjects[data.status])}
        ${emailBody(`${contents[data.status]}${emailSignature('NeuroCare Pro')}`)}
      `),
    });
  } catch (error) {
    console.error(`Email RDV \u00e9ducateur (${data.status}) \u00e9chou\u00e9:`, error);
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
      subject: `Paiement confirm\u00e9 - ${data.amount}`,
      html: emailLayout(`
        ${emailHeader('Paiement confirm\u00e9', undefined, { icon: '&#9989;' })}
        ${emailBody(`
          <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${data.name},</p>
          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">Votre paiement a bien \u00e9t\u00e9 enregistr\u00e9.</p>
          ${emailTable([
            { label: 'Montant', value: data.amount },
            { label: 'Professionnel', value: data.educatorName },
            { label: 'Date', value: data.date },
          ])}
          ${emailInfoBox('Votre re\u00e7u est disponible dans votre espace personnel.')}
          ${emailButton('Voir mon re\u00e7u', `${APP_URL}/dashboard/family/bookings`)}
          ${emailSignature()}
        `)}
      `),
    });
  } catch (error) {
    console.error('Email confirmation paiement \u00e9chou\u00e9:', error);
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
      subject: 'R\u00e9initialisation de votre mot de passe NeuroCare',
      html: emailLayout(`
        ${emailHeader('R\u00e9initialisation du mot de passe')}
        ${emailBody(`
          <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${data.firstName},</p>
          <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">Vous avez demand\u00e9 la r\u00e9initialisation de votre mot de passe.</p>
          ${emailButton('R\u00e9initialiser mon mot de passe', data.resetUrl)}
          ${emailWarningBox('Ce lien est valide pendant 1 heure. Si vous n\'avez pas fait cette demande, ignorez cet email.')}
          ${emailSignature()}
        `)}
      `),
    });
  } catch (error) {
    console.error('Email reset password \u00e9chou\u00e9:', error);
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
