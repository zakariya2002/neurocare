import { Resend } from 'resend';
import {
  emailLayout,
  emailHeader,
  emailBody,
  emailButton,
  emailInfoBox,
  emailSignature,
  emailColors,
} from './email-templates/base';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NeuroCare <noreply@neuro-care.fr>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr';

export async function sendCollaborationInviteEmail(params: {
  to: string;
  inviteeFirstName: string;
  inviterFullName: string;
  childFirstName: string;
  permission: 'read' | 'write';
  message?: string;
}): Promise<void> {
  const { to, inviteeFirstName, inviterFullName, childFirstName, permission, message } = params;
  const permLabel = permission === 'write' ? 'consulter et modifier' : 'consulter';
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Invitation à collaborer sur le suivi de ${childFirstName}`,
      html: emailLayout(`
        ${emailHeader('Invitation à collaborer', 'Sur le suivi d’un enfant')}
        ${emailBody(`
          <p style="margin: 0 0 16px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${inviteeFirstName},</p>
          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
            <strong>${inviterFullName}</strong> vous invite à <strong>${permLabel}</strong> le dossier complet de <strong>${childFirstName}</strong> sur NeuroCare (profil, PPA, historique de séances, notes).
          </p>
          ${message ? emailInfoBox(`Message : « ${message.replace(/[<>]/g, '')} »`) : ''}
          <p style="margin: 16px 0; font-size: 14px; color: ${emailColors.textLight};">
            Vous pouvez accepter ou refuser depuis votre espace.
          </p>
          ${emailButton('Voir l’invitation', `${APP_URL}/dashboard/educator/collaborations`)}
          ${emailSignature()}
        `)}
      `),
    });
  } catch (e) {
    console.error('[email] sendCollaborationInviteEmail', e);
  }
}

export async function sendCollaborationResponseEmail(params: {
  to: string;
  recipientFirstName: string;
  inviteeFullName: string;
  accepted: boolean;
}): Promise<void> {
  const { to, recipientFirstName, inviteeFullName, accepted } = params;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: accepted
        ? `${inviteeFullName} a accepté votre invitation`
        : `${inviteeFullName} a décliné votre invitation`,
      html: emailLayout(`
        ${emailHeader(
          accepted ? 'Invitation acceptée' : 'Invitation déclinée',
          accepted ? 'Vous pouvez désormais collaborer' : 'Aucune action requise'
        )}
        ${emailBody(`
          <p style="margin: 0 0 16px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${recipientFirstName},</p>
          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
            <strong>${inviteeFullName}</strong> a ${accepted ? 'accepté' : 'décliné'} votre invitation à collaborer sur le suivi.
          </p>
          ${emailButton('Voir mes collaborations', `${APP_URL}/dashboard/educator/collaborations`)}
          ${emailSignature()}
        `)}
      `),
    });
  } catch (e) {
    console.error('[email] sendCollaborationResponseEmail', e);
  }
}

export async function sendCollaborationFamilyNotice(params: {
  to: string;
  familyFirstName: string;
  childFirstName: string;
  educatorFullName: string;
  event: 'created' | 'revoked';
  permission: 'read' | 'write';
}): Promise<void> {
  const { to, familyFirstName, childFirstName, educatorFullName, event, permission } = params;
  const permLabel = permission === 'write' ? 'consultation et modification' : 'consultation';
  const subject =
    event === 'created'
      ? `Un professionnel a accès au dossier de ${childFirstName}`
      : `Accès retiré : ${educatorFullName} n'a plus accès au dossier de ${childFirstName}`;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: emailLayout(`
        ${emailHeader(
          event === 'created' ? 'Nouvel accès au dossier' : 'Accès au dossier révoqué',
          'Information de transparence'
        )}
        ${emailBody(`
          <p style="margin: 0 0 16px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">Bonjour ${familyFirstName},</p>
          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
            ${event === 'created'
              ? `<strong>${educatorFullName}</strong> a désormais accès en <strong>${permLabel}</strong> au dossier complet de ${childFirstName} (profil, PPA, historique, notes).`
              : `L'accès de <strong>${educatorFullName}</strong> au dossier de ${childFirstName} a été révoqué.`}
          </p>
          <p style="margin: 0 0 16px; font-size: 14px; color: ${emailColors.textLight};">
            Vous pouvez gérer les accès à tout moment depuis l'espace de votre enfant.
          </p>
          ${emailButton('Gérer les accès', `${APP_URL}/dashboard/family/children`)}
          ${emailSignature()}
        `)}
      `),
    });
  } catch (e) {
    console.error('[email] sendCollaborationFamilyNotice', e);
  }
}
