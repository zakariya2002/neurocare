import {
  emailLayout,
  emailHeader,
  emailBody,
  emailButton,
  emailSignature,
  emailDivider,
  emailColors,
} from './base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr';

export interface AnnouncementNewResponseParams {
  announcementId: string;
  title: string;
  educatorFirstName: string;
  educatorLastInitial: string;
  messageExcerpt: string;
  proposedHourlyRate?: number | null;
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

export function buildAnnouncementNewResponseEmail(
  params: AnnouncementNewResponseParams
): { subject: string; html: string; text: string } {
  const {
    announcementId,
    title,
    educatorFirstName,
    educatorLastInitial,
    messageExcerpt,
    proposedHourlyRate,
    familyFirstName,
  } = params;
  const url = `${APP_URL}/dashboard/family/announcements/${announcementId}`;
  const subject = `Un professionnel a répondu à votre annonce « ${title} »`;
  const proName = `${educatorFirstName} ${educatorLastInitial}.`;
  const excerptHtml = escapeHtml(messageExcerpt);

  const rateBlock = typeof proposedHourlyRate === 'number'
    ? `
      <div style="background-color: ${emailColors.pinkBg}; border-left: 4px solid ${emailColors.pink}; padding: 14px 18px; margin: 20px 0; border-radius: 0 10px 10px 0;">
        <p style="margin: 0; color: ${emailColors.pinkDark}; font-size: 14px; font-weight: 600; line-height: 1.5;">
          Tarif propos&eacute; : ${proposedHourlyRate}&nbsp;&euro;&nbsp;/&nbsp;heure
        </p>
      </div>`
    : '';

  const html = emailLayout(
    `
    ${emailHeader('Vous avez reçu une réponse !', 'Un professionnel souhaite vous aider')}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
        Bonjour ${familyFirstName},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        <strong style="color: ${emailColors.teal};">${proName}</strong> vous a envoy&eacute; un message en r&eacute;ponse &agrave; votre annonce <strong>&laquo;&nbsp;${title}&nbsp;&raquo;</strong>&nbsp;:
      </p>

      <div style="background-color: ${emailColors.tealBg}; border-left: 4px solid ${emailColors.teal}; padding: 16px 20px; margin: 20px 0; border-radius: 0 10px 10px 0; font-style: italic;">
        <p style="margin: 0; color: ${emailColors.text}; font-size: 14px; line-height: 1.6;">
          &laquo;&nbsp;${excerptHtml}&nbsp;&raquo;
        </p>
      </div>

      ${rateBlock}

      ${emailButton('Voir la réponse', url, { color: emailColors.pink })}

      ${emailDivider()}
      ${emailSignature()}
    `)}
  `,
    { preheader: `${proName} a répondu à votre annonce` }
  );

  const textLines = [
    `Bonjour ${familyFirstName},`,
    '',
    `${proName} vous a envoyé un message en réponse à votre annonce « ${title} » :`,
    '',
    `« ${messageExcerpt} »`,
  ];
  if (typeof proposedHourlyRate === 'number') {
    textLines.push('', `Tarif proposé : ${proposedHourlyRate} € / heure`);
  }
  textLines.push('', `Voir la réponse : ${url}`, '', "À bientôt,", "L'équipe NeuroCare");

  return { subject, html, text: textLines.join('\n') };
}
