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

export interface AnnouncementExpirySoonParams {
  announcementId: string;
  title: string;
  responseCount: number;
  familyFirstName: string;
}

export function buildAnnouncementExpirySoonEmail(
  params: AnnouncementExpirySoonParams
): { subject: string; html: string; text: string } {
  const { announcementId, title, responseCount, familyFirstName } = params;
  const detailUrl = `${APP_URL}/dashboard/family/announcements/${announcementId}`;
  const fulfilledUrl = `${APP_URL}/dashboard/family/announcements/${announcementId}?action=mark-fulfilled`;
  const subject = `Votre annonce « ${title} » expire dans 7 jours`;
  const responseLabel = responseCount > 1 ? 'réponses' : 'réponse';

  const html = emailLayout(
    `
    ${emailHeader('Votre annonce expire bientôt', 'Plus que 7 jours avant expiration', { bgColor: emailColors.pink })}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
        Bonjour ${familyFirstName},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        Votre annonce <strong style="color: ${emailColors.teal};">&laquo;&nbsp;${title}&nbsp;&raquo;</strong> arrive bient&ocirc;t &agrave; expiration sur Neuro Care.
      </p>

      ${emailInfoBox(`Vous avez re&ccedil;u <strong>${responseCount}</strong> ${responseLabel} &agrave; ce jour.`)}

      <p style="margin: 20px 0 12px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        &bull;&nbsp; Si vous avez trouv&eacute; un professionnel, marquez l'annonce comme <strong>pourvue</strong>.
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        &bull;&nbsp; Si vous cherchez encore, vous pourrez la <strong>renouveler</strong> apr&egrave;s expiration.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
        <tr>
          <td align="center" style="padding-right: 8px;">
            <a href="${fulfilledUrl}" style="display: inline-block; padding: 14px 28px; background-color: ${emailColors.teal}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 10px; line-height: 1;">
              Marquer pourvue
            </a>
          </td>
          <td align="center" style="padding-left: 8px;">
            <a href="${detailUrl}" style="display: inline-block; padding: 14px 28px; background-color: ${emailColors.pink}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 10px; line-height: 1;">
              Voir mon annonce
            </a>
          </td>
        </tr>
      </table>

      ${emailDivider()}
      ${emailSignature()}
    `)}
  `,
    { preheader: `Votre annonce « ${title} » expire dans 7 jours` }
  );

  const text = [
    `Bonjour ${familyFirstName},`,
    '',
    `Votre annonce « ${title} » arrive bientôt à expiration sur Neuro Care.`,
    '',
    `Vous avez reçu ${responseCount} ${responseLabel} à ce jour.`,
    '',
    "- Si vous avez trouvé un professionnel, marquez l'annonce comme pourvue.",
    '- Si vous cherchez encore, vous pourrez la renouveler après expiration.',
    '',
    `Marquer pourvue : ${fulfilledUrl}`,
    `Voir mon annonce : ${detailUrl}`,
    '',
    "À bientôt,",
    "L'équipe NeuroCare",
  ].join('\n');

  return { subject, html, text };
}
