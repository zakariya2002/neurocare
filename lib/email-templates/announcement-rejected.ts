import {
  emailLayout,
  emailHeader,
  emailBody,
  emailButton,
  emailWarningBox,
  emailSignature,
  emailDivider,
  emailColors,
} from './base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr';

export interface AnnouncementRejectedParams {
  announcementId: string;
  title: string;
  rejectionReason: string;
  familyFirstName: string;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildAnnouncementRejectedEmail(params: AnnouncementRejectedParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { announcementId, title, rejectionReason, familyFirstName } = params;
  const url = `${APP_URL}/dashboard/family/announcements/${announcementId}/edit`;
  const subject = `Votre annonce « ${title} » n'a pas pu être publiée`;
  const reasonHtml = escapeHtml(rejectionReason);

  const html = emailLayout(
    `
    ${emailHeader('Votre annonce nécessite des modifications', 'Notre équipe a relu votre annonce')}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
        Bonjour ${familyFirstName},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        Notre &eacute;quipe a relu votre annonce <strong>&laquo;&nbsp;${title}&nbsp;&raquo;</strong> mais elle ne peut &ecirc;tre publi&eacute;e en l'&eacute;tat.
      </p>

      ${emailWarningBox(`<strong>Raison du refus :</strong><br>${reasonHtml}`)}

      ${emailButton('Modifier mon annonce', url, { color: emailColors.pink })}

      <p style="margin: 0 0 10px; font-size: 13px; color: ${emailColors.textMuted}; line-height: 1.5;">
        Une fois modifi&eacute;e, votre annonce sera renvoy&eacute;e &agrave; mod&eacute;ration.
      </p>

      ${emailDivider()}
      ${emailSignature()}
    `)}
  `,
    { preheader: `Votre annonce « ${title} » nécessite des modifications` }
  );

  const text = [
    `Bonjour ${familyFirstName},`,
    '',
    `Notre équipe a relu votre annonce « ${title} » mais elle ne peut être publiée en l'état.`,
    '',
    `Raison du refus : ${rejectionReason}`,
    '',
    `Modifier mon annonce : ${url}`,
    '',
    'Une fois modifiée, votre annonce sera renvoyée à modération.',
    '',
    "À bientôt,",
    "L'équipe NeuroCare",
  ].join('\n');

  return { subject, html, text };
}
