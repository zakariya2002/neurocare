import { Resend } from 'resend';
import { getEducatorWelcomeEmail } from './email-templates/educator-welcome';
import { getFamilyWelcomeEmail } from './email-templates/family-welcome';
import { getPasswordResetEmail } from './email-templates/password-reset';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEducatorWelcomeEmail(email: string, firstName: string, confirmationUrl?: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'NeuroCare Pro <admin@neuro-care.fr>',
      to: [email],
      subject: confirmationUrl
        ? `Confirmez votre email - Bienvenue sur NeuroCare Pro, ${firstName} !`
        : `Bienvenue sur NeuroCare Pro, ${firstName} !`,
      html: getEducatorWelcomeEmail(firstName, confirmationUrl),
    });

    if (error) {
      console.error('Erreur envoi email éducateur:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erreur envoi email éducateur:', error);
    return { success: false, error };
  }
}

export async function sendFamilyWelcomeEmail(email: string, firstName: string, confirmationUrl?: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'NeuroCare <admin@neuro-care.fr>',
      to: [email],
      subject: confirmationUrl
        ? `Confirmez votre email - Bienvenue sur NeuroCare, ${firstName} !`
        : `Bienvenue sur NeuroCare, ${firstName} !`,
      html: getFamilyWelcomeEmail(firstName, confirmationUrl),
    });

    if (error) {
      console.error('Erreur envoi email famille:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erreur envoi email famille:', error);
    return { success: false, error };
  }
}

const ADMIN_EMAIL = 'zakariyanebbache@gmail.com';

export async function notifyAdminNewSignup(
  userEmail: string,
  firstName: string,
  lastName: string,
  role: 'educator' | 'family',
  location?: string
) {
  try {
    const roleLabel = role === 'educator' ? 'Professionnel' : 'Famille';
    const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

    await resend.emails.send({
      from: 'NeuroCare <admin@neuro-care.fr>',
      to: [ADMIN_EMAIL],
      subject: `Nouvelle inscription ${roleLabel} : ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: #027e7e; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="margin: 0;">Nouvelle inscription</h2>
          </div>
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280; width: 100px;">Type</td><td style="padding: 8px 0; font-weight: 600;">${roleLabel}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Nom</td><td style="padding: 8px 0; font-weight: 600;">${firstName} ${lastName}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0;">${userEmail}</td></tr>
              ${location ? `<tr><td style="padding: 8px 0; color: #6b7280;">Ville</td><td style="padding: 8px 0;">${location}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; color: #6b7280;">Date</td><td style="padding: 8px 0;">${now}</td></tr>
            </table>
            <div style="margin-top: 20px; text-align: center;">
              <a href="https://neuro-care.fr/admin/users" style="display: inline-block; padding: 10px 24px; background: #027e7e; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Voir dans l'admin</a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    // Ne jamais bloquer l'inscription si la notif admin échoue
    console.error('Erreur notification admin:', error);
  }
}

export async function sendPasswordResetEmail(email: string, firstName: string, resetUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'NeuroCare <admin@neuro-care.fr>',
      to: [email],
      subject: `🔐 Réinitialisation de votre mot de passe NeuroCare`,
      html: getPasswordResetEmail(firstName, resetUrl),
    });

    if (error) {
      console.error('Erreur envoi email réinitialisation:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erreur envoi email réinitialisation:', error);
    return { success: false, error };
  }
}
