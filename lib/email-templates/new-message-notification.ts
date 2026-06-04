import {
  emailLayout,
  emailHeader,
  emailBody,
  emailButton,
  emailDivider,
  emailColors,
} from './base';

export interface NewMessageNotifParams {
  recipientFirstName: string;
  senderFirstName: string;
  senderRole: 'family' | 'educator';
  /** Aperçu du dernier message (tronqué côté serveur). Optionnel : non envoyé si conversation pas encore acceptée par le pro. */
  preview?: string;
  /** Type d'événement déclencheur : nouvelle demande de famille, ou simple nouveau message. */
  kind: 'new_request' | 'new_message';
}

export function buildNewMessageNotificationEmail(
  params: NewMessageNotifParams,
): { subject: string; html: string; text: string } {
  const { recipientFirstName, senderFirstName, senderRole, preview, kind } = params;

  const messagesUrl = 'https://neuro-care.fr/messages';

  let title: string;
  let subject: string;
  let intro: string;
  let cta: string;

  if (kind === 'new_request' && senderRole === 'family') {
    title = 'Nouvelle demande de famille';
    subject = `💬 Nouvelle demande de ${senderFirstName} sur Neuro Care`;
    intro = `<strong>${senderFirstName}</strong> vient de vous adresser une demande d'accompagnement via Neuro Care. Consultez son questionnaire et choisissez d'accepter ou non l'échange.`;
    cta = 'Voir la demande';
  } else {
    title = 'Nouveau message';
    subject = `💬 ${senderFirstName} vous a envoyé un message sur Neuro Care`;
    intro = `<strong>${senderFirstName}</strong> vient de vous envoyer un nouveau message sur Neuro Care.`;
    cta = 'Lire le message';
  }

  const safePreview = preview
    ? preview.length > 200
      ? `${preview.slice(0, 200)}…`
      : preview
    : null;

  const html = emailLayout(
    `
    ${emailHeader(title, 'Connectez-vous pour répondre')}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
        Bonjour ${recipientFirstName},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        ${intro}
      </p>

      ${
        safePreview
          ? `<div style="background-color: ${emailColors.tealBg}; border-left: 4px solid ${emailColors.teal}; padding: 14px 18px; margin: 0 0 24px; border-radius: 0 10px 10px 0;">
              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: ${emailColors.teal}; text-transform: uppercase; letter-spacing: 0.5px;">
                Aperçu du message
              </p>
              <p style="margin: 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(safePreview)}</p>
            </div>`
          : ''
      }

      ${emailButton(cta, messagesUrl)}

      ${emailDivider()}

      <p style="margin: 0; font-size: 13px; color: ${emailColors.textMuted}; line-height: 1.6;">
        Pour des raisons de confidentialité, le message complet n'est consultable que sur la plateforme.
      </p>
    `)}
    `,
    { preheader: `${senderFirstName} vous a écrit sur Neuro Care` },
  );

  const text = `Bonjour ${recipientFirstName},

${senderFirstName} ${kind === 'new_request' ? "vient de vous adresser une demande d'accompagnement" : 'vient de vous envoyer un message'} sur Neuro Care.

${safePreview ? `Aperçu :\n${safePreview}\n\n` : ''}Lire et répondre : ${messagesUrl}

— L'équipe Neuro Care`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
