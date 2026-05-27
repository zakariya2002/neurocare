import {
  emailLayout,
  emailHeader,
  emailBody,
  emailButton,
  emailInfoBox,
  emailDivider,
  emailColors,
} from './base';

export const ANNOUNCE_VISIBILITY_SUBJECT =
  '🎉 Bonne nouvelle : votre profil est désormais visible sur Neuro Care';

const DASHBOARD_URL = 'https://neuro-care.fr/dashboard/educator';

function footer(unsubscribeUrl = '{{unsubscribe_url}}'): string {
  return `
  <p style="margin: 0; font-size: 12px; color: #b0b0b0; text-align: center; line-height: 1.6;">
    Vous recevez cet email car vous &ecirc;tes inscrit·e en tant que professionnel sur Neuro Care.<br>
    <a href="${unsubscribeUrl}" style="color: #b0b0b0; text-decoration: underline;">Se d&eacute;sabonner</a>
  </p>`;
}

function signature(): string {
  return `
  <p style="margin: 28px 0 0; font-size: 15px; color: ${emailColors.textLight}; line-height: 1.7;">
    Cordialement,<br>
    <strong style="color: ${emailColors.teal};">Zakariya Nebbache</strong><br>
    <span style="font-size: 13px; color: ${emailColors.textMuted};">Fondateur — Neuro Care</span><br>
    <a href="https://neuro-care.fr" style="font-size: 13px; color: ${emailColors.teal}; text-decoration: none;">neuro-care.fr</a>
  </p>`;
}

export function buildAnnounceVisibilityProsEmail(prenom: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = ANNOUNCE_VISIBILITY_SUBJECT;

  const html = emailLayout(
    `
    ${emailHeader(
      'Vous êtes désormais visible',
      'Les familles peuvent vous découvrir sur Neuro Care',
    )}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
        Bonjour ${prenom},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        Bonne nouvelle&nbsp;: pour faciliter votre arriv&eacute;e sur Neuro Care, nous avons d&eacute;cid&eacute; d&rsquo;afficher
        votre profil <strong style="color: ${emailColors.text};">d&egrave;s maintenant</strong> dans notre annuaire public,
        sans attendre la validation compl&egrave;te de vos documents.
      </p>

      <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: ${emailColors.text};">
        Concr&egrave;tement, &agrave; partir d&rsquo;aujourd&rsquo;hui&nbsp;:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; Votre profil appara&icirc;t dans la recherche des familles
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; Vous &ecirc;tes visible sur la carte interactive
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; Les familles peuvent vous envoyer une demande
          </td>
        </tr>
      </table>

      ${emailInfoBox(
        'Une derni&egrave;re &eacute;tape pour r&eacute;pondre aux familles&nbsp;: <strong>finaliser la v&eacute;rification de votre profil</strong>.',
      )}

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        Pour la s&eacute;curit&eacute; des familles qui vous contactent, l&rsquo;acc&egrave;s aux messages re&ccedil;us est
        conditionn&eacute; &agrave; la v&eacute;rification de votre profil professionnel. Cette &eacute;tape
        nous prot&egrave;ge mutuellement.
      </p>

      <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: ${emailColors.text};">
        Quatre documents &agrave; t&eacute;l&eacute;verser&nbsp;:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            •&nbsp; Votre pi&egrave;ce d&rsquo;identit&eacute;
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            •&nbsp; Votre dipl&ocirc;me ou attestation de qualification
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            •&nbsp; Votre attestation de RC professionnelle
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            •&nbsp; Votre casier judiciaire (bulletin n&deg;3)
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        D&egrave;s que nos &eacute;quipes auront valid&eacute; vos documents (sous 24-48&nbsp;h ouvr&eacute;es),
        vous pourrez consulter et r&eacute;pondre &agrave; toutes les demandes des familles.
      </p>

      ${emailButton('Finaliser mon profil', DASHBOARD_URL)}

      ${emailDivider()}
      ${signature()}
    `)}

    <tr>
      <td style="padding: 16px 36px 24px;">
        ${footer()}
      </td>
    </tr>
    `,
  );

  const text = `Bonjour ${prenom},

Bonne nouvelle : pour faciliter votre arrivée sur Neuro Care, nous avons décidé d'afficher votre profil dès maintenant dans notre annuaire public, sans attendre la validation complète de vos documents.

Concrètement, à partir d'aujourd'hui :
✓ Votre profil apparaît dans la recherche des familles
✓ Vous êtes visible sur la carte interactive
✓ Les familles peuvent vous envoyer une demande

Une dernière étape pour répondre aux familles : finaliser la vérification de votre profil.

Pour la sécurité des familles qui vous contactent, l'accès aux messages reçus est conditionné à la vérification de votre profil professionnel.

Quatre documents à téléverser :
• Votre pièce d'identité
• Votre diplôme ou attestation de qualification
• Votre attestation de RC professionnelle
• Votre casier judiciaire (bulletin n°3)

Dès que nos équipes auront validé vos documents (sous 24-48 h ouvrées), vous pourrez consulter et répondre à toutes les demandes des familles.

Finaliser mon profil : ${DASHBOARD_URL}

Cordialement,
Zakariya Nebbache
Fondateur — Neuro Care
https://neuro-care.fr`;

  return { subject, html, text };
}
