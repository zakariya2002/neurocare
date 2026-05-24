import { emailLayout, emailHeader, emailBody, emailButton, emailSignature, emailDivider, emailColors } from './base';

export function getFamilyThankYouEmail(firstName: string): string {
  return emailLayout(`
    ${emailHeader('Merci de rejoindre NeuroCare', 'Un message de notre équipe')}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
        Bonjour ${firstName},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: ${emailColors.textLight};">
        Merci d’avoir cr&eacute;&eacute; votre compte sur NeuroCare. Nous voulions prendre le temps de vous accueillir personnellement &mdash; chaque famille qui nous rejoint compte.
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: ${emailColors.textLight};">
        NeuroCare est un projet jeune, en plein d&eacute;veloppement. Notre volont&eacute; avant tout&nbsp;: <strong style="color: ${emailColors.teal};">aider un maximum de familles</strong> &agrave; trouver un accompagnement de qualit&eacute; pour leurs proches concern&eacute;s par un trouble du neurod&eacute;veloppement.
      </p>

      ${emailDivider()}

      <p style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: ${emailColors.text};">
        &#127881; Nouveau&nbsp;: postez une annonce selon vos besoins
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: ${emailColors.textLight};">
        Vous pouvez d&eacute;sormais <strong style="color: ${emailColors.teal};">publier une annonce</strong> d&eacute;crivant pr&eacute;cis&eacute;ment ce que vous recherchez&nbsp;: type d’accompagnement, sp&eacute;cialit&eacute;, lieu, disponibilit&eacute;s, budget&hellip; Les professionnels v&eacute;rifi&eacute;s qui correspondent &agrave; votre demande pourront vous r&eacute;pondre directement. Plus besoin d’&eacute;plucher des dizaines de profils&nbsp;: ce sont eux qui viennent &agrave; vous.
      </p>

      ${emailButton('Publier ma première annonce', 'https://neuro-care.fr/dashboard/family/announcements/new')}

      ${emailDivider()}

      <div style="background-color: ${emailColors.pinkBg}; border-left: 4px solid ${emailColors.pink}; padding: 18px 20px; margin: 24px 0; border-radius: 0 10px 10px 0;">
        <p style="margin: 0 0 8px; font-size: 15px; font-weight: 700; color: ${emailColors.pinkDark};">
          &#128157; 100&percnt; gratuit pour les familles
        </p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #444;">
          La recherche, les annonces et la prise de contact sont enti&egrave;rement gratuites. Notre engagement, c’est de vous simplifier l’acc&egrave;s &agrave; des professionnels qualifi&eacute;s.
        </p>
      </div>

      <p style="margin: 24px 0 20px; font-size: 15px; line-height: 1.7; color: ${emailColors.textLight};">
        Nous d&eacute;ployons prochainement une campagne pour faire grandir la communaut&eacute; NeuroCare. Plus de professionnels engag&eacute;s, c’est plus de choix et plus de proximit&eacute; pour vous.
      </p>

      ${emailButton('Rechercher un professionnel', 'https://neuro-care.fr/recherche', { color: emailColors.teal })}

      ${emailDivider()}

      <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: ${emailColors.textLight};">
        Si vous avez une question, un besoin sp&eacute;cifique ou un retour &agrave; nous partager, r&eacute;pondez simplement &agrave; cet email &mdash; nous lisons tout.
      </p>

      ${emailSignature()}
    `)}
  `, { preheader: 'Merci de rejoindre NeuroCare — publiez votre première annonce et trouvez le bon professionnel' });
}
