import { emailLayout, emailHeader, emailBody, emailButton, emailInfoBox, emailSignature, emailDivider } from './base';

export function getEducatorWelcomeEmail(firstName: string, confirmationUrl?: string): string {
  return emailLayout(`
    ${emailHeader('Bienvenue sur NeuroCare Pro !', 'Plateforme pour les professionnels du neurod\u00e9veloppement')}
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
        Nous sommes ravis de vous accueillir en tant que <strong>professionnel</strong> sur NeuroCare Pro&nbsp;! Vous faites maintenant partie d'une communaut&eacute; d&eacute;di&eacute;e &agrave; accompagner les familles.
      </p>

      ${emailInfoBox('Pour appara\u00eetre dans les r\u00e9sultats de recherche, veuillez soumettre vos documents de v\u00e9rification.')}

      <p style="margin: 24px 0 12px; font-size: 15px; font-weight: 600; color: #1f2937;">Prochaines &eacute;tapes&nbsp;:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #333; line-height: 1.5;">
            <strong style="color: #027e7e;">1.</strong>&nbsp; Uploadez vos documents (dipl&ocirc;me, casier, CNI, assurance)
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #333; line-height: 1.5;">
            <strong style="color: #027e7e;">2.</strong>&nbsp; Compl&eacute;tez votre profil (bio, sp&eacute;cialisations, tarifs)
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: #333; line-height: 1.5;">
            <strong style="color: #027e7e;">3.</strong>&nbsp; Configurez vos disponibilit&eacute;s
          </td>
        </tr>
      </table>

      ${emailButton('Acc\u00e9der \u00e0 mon tableau de bord', 'https://neuro-care.fr/dashboard/educator')}

      ${emailDivider()}

      <div style="background-color: #fdf0f3; border-left: 4px solid #f0879f; padding: 18px; margin: 0 0 24px; border-radius: 0 10px 10px 0;">
        <p style="margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #d16a7f;">
          Obtenez l'agr&eacute;ment SAP
        </p>
        <p style="margin: 0 0 12px; font-size: 13px; line-height: 1.5; color: #333;">
          Permettez &agrave; vos clients de b&eacute;n&eacute;ficier du CESU pr&eacute;financ&eacute; et du cr&eacute;dit d'imp&ocirc;t de 50&percnt;&nbsp;! L'agr&eacute;ment est <strong style="color: #027e7e;">100&percnt; GRATUIT</strong>.
        </p>
        ${emailButton('Consulter le guide SAP', 'https://neuro-care.fr/educators/sap-accreditation', { color: '#f0879f' })}
      </div>

      ${emailSignature('NeuroCare Pro')}
    `)}
  `, { preheader: confirmationUrl ? 'Confirmez votre email pour activer votre compte NeuroCare Pro' : 'Bienvenue sur NeuroCare Pro !' });
}
