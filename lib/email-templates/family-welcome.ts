import { emailLayout, emailHeader, emailBody, emailButton, emailInfoBox, emailSignature, emailDivider } from './base';

export function getFamilyWelcomeEmail(firstName: string, confirmationUrl?: string): string {
  return emailLayout(`
    ${emailHeader('Bienvenue sur NeuroCare !', 'Nous sommes l\u00e0 pour vous accompagner')}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: #1f2937; line-height: 1.6;">
        Bonjour ${firstName},
      </p>

      ${confirmationUrl ? `
      <div style="background-color: #e6f4f4; border: 2px solid #027e7e; border-radius: 12px; padding: 24px; margin: 0 0 28px; text-align: center;">
        <p style="margin: 0 0 6px; font-size: 32px;">&#9993;&#65039;</p>
        <h2 style="margin: 0 0 12px; color: #027e7e; font-size: 18px; font-weight: 700;">
          Confirmez votre adresse email
        </h2>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #333333;">
          Pour activer votre compte et acc&eacute;der &agrave; toutes les fonctionnalit&eacute;s, confirmez votre adresse email.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
          <tr>
            <td style="border-radius: 10px; background-color: #027e7e;">
              <a href="${confirmationUrl}" style="display: inline-block; padding: 14px 36px; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px;">
                Confirmer mon email
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 16px 0 0; font-size: 12px; color: #027e7e;">Ce lien expire dans 24 heures.</p>
      </div>
      <p style="margin: 0 0 20px; font-size: 12px; color: #888888; line-height: 1.5;">
        Si le bouton ne fonctionne pas, copiez ce lien&nbsp;:<br>
        <a href="${confirmationUrl}" style="color: #027e7e; word-break: break-all; font-size: 11px;">${confirmationUrl}</a>
      </p>
      ` : ''}

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #555555;">
        Nous sommes ravis de vous accueillir sur <strong style="color: #027e7e;">NeuroCare</strong>, la plateforme qui met en relation les familles avec des professionnels sp&eacute;cialis&eacute;s dans les troubles neurod&eacute;veloppementaux.
      </p>

      <p style="margin: 24px 0 12px; font-size: 15px; font-weight: 600; color: #1f2937;">Ce que vous pouvez faire&nbsp;:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #333; line-height: 1.5;">
            &#128270;&nbsp; <strong>Rechercher des professionnels</strong> pr&egrave;s de chez vous
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #333; line-height: 1.5;">
            &#128197;&nbsp; <strong>Prendre rendez-vous</strong> directement en ligne
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #333; line-height: 1.5;">
            &#128172;&nbsp; <strong>&Eacute;changer avec les professionnels</strong> via la messagerie
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #333; line-height: 1.5;">
            &#11088;&nbsp; <strong>Consulter les avis</strong> et choisir le meilleur accompagnement
          </td>
        </tr>
      </table>

      <div style="background-color: #fdf0f3; border: 2px solid #f0879f; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #d16a7f;">
          &#128157; 100&percnt; Gratuit pour les familles
        </p>
        <p style="margin: 8px 0 0; font-size: 13px; color: #555555; line-height: 1.5;">
          Notre mission est de vous offrir un acc&egrave;s simplifi&eacute; &agrave; des professionnels qualifi&eacute;s.
        </p>
      </div>

      ${emailButton('Trouver un professionnel', 'https://neuro-care.fr/search')}

      ${emailSignature()}
    `)}
  `, { preheader: confirmationUrl ? 'Confirmez votre email pour activer votre compte NeuroCare' : 'Bienvenue sur NeuroCare !' });
}
