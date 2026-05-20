import {
  emailLayout,
  emailHeader,
  emailBody,
  emailButton,
  emailInfoBox,
  emailSignature,
  emailDivider,
  emailColors,
} from './base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr';

export interface AnnouncementPublishedParams {
  announcementId: string;
  title: string;
  familyFirstName: string;
}

export function buildAnnouncementPublishedEmail(params: AnnouncementPublishedParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { announcementId, title, familyFirstName } = params;
  const url = `${APP_URL}/dashboard/family/announcements/${announcementId}`;
  const subject = `Votre annonce « ${title} » est en ligne sur Neuro Care`;

  const html = emailLayout(
    `
    ${emailHeader('Votre annonce est en ligne !', 'Les professionnels peuvent désormais y répondre')}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
        Bonjour ${familyFirstName},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        Bonne nouvelle&nbsp;! Votre annonce <strong style="color: ${emailColors.teal};">&laquo;&nbsp;${title}&nbsp;&raquo;</strong>
        a &eacute;t&eacute; valid&eacute;e par notre &eacute;quipe et est d&eacute;sormais visible par les professionnels.
      </p>

      ${emailButton('Voir mon annonce', url, { color: emailColors.pink })}

      ${emailInfoBox('Votre annonce restera publi&eacute;e pendant <strong>60 jours</strong>. Vous recevrez un rappel 7 jours avant son expiration.')}

      ${emailDivider()}
      ${emailSignature()}
    `)}
  `,
    { preheader: `Votre annonce « ${title} » est en ligne` }
  );

  const text = [
    `Bonjour ${familyFirstName},`,
    '',
    `Bonne nouvelle ! Votre annonce « ${title} » a été validée par notre équipe et est désormais visible par les professionnels.`,
    '',
    `Voir mon annonce : ${url}`,
    '',
    'Votre annonce restera publiée pendant 60 jours. Vous recevrez un rappel 7 jours avant son expiration.',
    '',
    "À bientôt,",
    "L'équipe NeuroCare",
  ].join('\n');

  return { subject, html, text };
}
