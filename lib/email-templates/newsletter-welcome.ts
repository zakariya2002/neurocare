import { emailLayout, emailHeader, emailBody, emailButton, emailSignature, emailDivider } from './base';

export function getNewsletterWelcomeEmail(firstName?: string, audience?: string, email?: string): string {
  const name = firstName || 'l\u00e0';
  const isPro = audience === 'pro';
  const isFamily = audience === 'famille';

  const audienceContent = isPro
    ? 'En tant que professionnel, vous recevrez des informations sur les derni\u00e8res pratiques, les opportunit\u00e9s de la plateforme, et des conseils pour d\u00e9velopper votre activit\u00e9.'
    : isFamily
      ? 'En tant que parent ou aidant, vous recevrez des conseils pratiques, des ressources utiles et les derni\u00e8res actualit\u00e9s pour accompagner au mieux votre enfant.'
      : 'Vous recevrez des conseils pratiques, des ressources utiles et les derni\u00e8res actualit\u00e9s sur l\'accompagnement des troubles neurod\u00e9veloppementaux.';

  return emailLayout(`
    ${emailHeader('Bienvenue dans notre newsletter !', 'Merci de rejoindre la communaut\u00e9 NeuroCare', { icon: '&#128236;' })}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: #1f2937; line-height: 1.6;">
        Bonjour ${name}&nbsp;!
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #555555;">
        Votre inscription &agrave; notre newsletter est confirm&eacute;e. Nous sommes ravis de vous compter parmi nos abonn&eacute;s&nbsp;!
      </p>

      <div style="background-color: #e6f4f4; border: 2px solid #027e7e; border-radius: 12px; padding: 24px; margin: 0 0 28px;">
        <h2 style="margin: 0 0 12px; color: #027e7e; font-size: 16px; font-weight: 700;">
          Ce que vous allez recevoir
        </h2>
        <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #333333;">
          ${audienceContent}
        </p>
        <p style="margin: 0; font-size: 13px; color: #027e7e; font-style: italic;">
          Fr&eacute;quence : 1 newsletter par mois (pas de spam, promis&nbsp;!)
        </p>
      </div>

      <p style="margin: 0 0 14px; font-size: 15px; font-weight: 600; color: #1f2937;">Au programme&nbsp;:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
        <tr><td style="padding: 10px 0; font-size: 14px; color: #333; line-height: 1.5; border-bottom: 1px solid #f3f4f6;">&#128161;&nbsp; <strong style="color: #027e7e;">Conseils pratiques</strong> &mdash; Astuces et strat&eacute;gies</td></tr>
        <tr><td style="padding: 10px 0; font-size: 14px; color: #333; line-height: 1.5; border-bottom: 1px solid #f3f4f6;">&#128218;&nbsp; <strong style="color: #027e7e;">Ressources &amp; outils</strong> &mdash; Guides, fiches, liens utiles</td></tr>
        <tr><td style="padding: 10px 0; font-size: 14px; color: #333; line-height: 1.5; border-bottom: 1px solid #f3f4f6;">&#127919;&nbsp; <strong style="color: #027e7e;">Actualit&eacute;s</strong> &mdash; Nouveaut&eacute;s plateforme et secteur</td></tr>
        <tr><td style="padding: 10px 0; font-size: 14px; color: #333; line-height: 1.5;">&#127873;&nbsp; <strong style="color: #027e7e;">Offres exclusives</strong> &mdash; Acc&egrave;s en avant-premi&egrave;re</td></tr>
      </table>

      ${emailButton('D\u00e9couvrir NeuroCare', 'https://neuro-care.fr')}

      ${emailSignature()}

      ${email ? `
      <p style="margin: 24px 0 0; font-size: 12px; color: #b0b0b0; text-align: center;">
        <a href="https://neuro-care.fr/unsubscribe?email=${encodeURIComponent(email)}" style="color: #b0b0b0; text-decoration: underline;">Se d&eacute;sabonner</a>
      </p>` : ''}
    `)}
  `, { preheader: 'Bienvenue dans la newsletter NeuroCare !' });
}
