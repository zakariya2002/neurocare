import { emailLayout, emailHeader, emailBody, emailButton, emailInfoBox, emailSignature, emailDivider, emailColors } from './base';

export function getPremiumWelcomeEmail(firstName: string): string {
  return emailLayout(`
    ${emailHeader('Bienvenue dans la famille Premium !', 'Vous \u00eates maintenant un membre VIP', { icon: '&#11088;' })}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 18px; color: #1f2937; font-weight: 700;">
        F&eacute;licitations ${firstName}&nbsp;!
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #555555;">
        C'est officiel&nbsp;: vous faites d&eacute;sormais partie de la <strong style="color: #027e7e;">famille Premium NeuroCare Pro</strong>&nbsp;!
      </p>

      <div style="background-color: #e6f4f4; border: 2px solid #027e7e; padding: 24px; margin: 0 0 28px; border-radius: 12px;">
        <h3 style="margin: 0 0 16px; color: #027e7e; font-size: 16px; font-weight: 700;">
          Vos avantages Premium
        </h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding: 8px 0; font-size: 14px; color: #333; line-height: 1.5;">&#10024;&nbsp; <strong>R&eacute;servations illimit&eacute;es</strong> &mdash; Plus de limite mensuelle</td></tr>
          <tr><td style="padding: 8px 0; font-size: 14px; color: #333; line-height: 1.5;">&#128172;&nbsp; <strong>Conversations illimit&eacute;es</strong> &mdash; &Eacute;changez sans contrainte</td></tr>
          <tr><td style="padding: 8px 0; font-size: 14px; color: #333; line-height: 1.5;">&#128316;&nbsp; <strong>Visibilit&eacute; prioritaire</strong> &mdash; Profil en t&ecirc;te des recherches</td></tr>
          <tr><td style="padding: 8px 0; font-size: 14px; color: #333; line-height: 1.5;">&#11088;&nbsp; <strong>Badge Premium</strong> &mdash; Inspirez confiance</td></tr>
        </table>
      </div>

      ${emailInfoBox('Votre badge Premium appara\u00eet d\u00e9sormais automatiquement sur votre profil et dans les r\u00e9sultats de recherche.')}

      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #555555;">
        Votre p&eacute;riode d'essai gratuite de <strong style="color: #027e7e;">30 jours</strong> commence maintenant. Profitez-en pleinement&nbsp;!
      </p>

      ${emailButton('D\u00e9couvrir mon statut Premium', 'https://neuro-care.fr/dashboard/educator')}

      ${emailDivider()}

      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #555555;">
        Merci de votre confiance. Ensemble, nous faisons la diff&eacute;rence dans la vie des personnes avec des troubles neurod&eacute;veloppementaux.
      </p>

      ${emailSignature('NeuroCare Pro')}
    `)}
  `, { preheader: 'Bienvenue dans la famille Premium NeuroCare Pro !' });
}
