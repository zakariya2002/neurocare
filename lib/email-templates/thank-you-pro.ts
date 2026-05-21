import { emailLayout, emailHeader, emailBody, emailButton, emailSignature, emailDivider, emailColors } from './base';

export function getProThankYouEmail(firstName: string): string {
  return emailLayout(`
    ${emailHeader('Merci de rejoindre l’aventure NeuroCare', 'Un message de notre équipe')}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
        Bonjour ${firstName},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: ${emailColors.textLight};">
        Merci d’avoir choisi de nous rejoindre. Votre inscription en tant que <strong style="color: ${emailColors.teal};">professionnel</strong> compte beaucoup pour nous, et nous voulions prendre le temps de vous remercier personnellement.
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: ${emailColors.textLight};">
        NeuroCare est un projet jeune, en plein d&eacute;veloppement. Notre volont&eacute; avant tout&nbsp;: <strong style="color: ${emailColors.teal};">aider un maximum de familles</strong> &agrave; trouver un accompagnement de qualit&eacute; pour leurs proches concern&eacute;s par un trouble du neurod&eacute;veloppement. Pour y arriver, nous avons besoin de professionnels engag&eacute;s comme vous.
      </p>

      ${emailDivider()}

      <p style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: ${emailColors.text};">
        &#127881; Une nouvelle fonctionnalit&eacute; pens&eacute;e pour vous
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: ${emailColors.textLight};">
        Les familles peuvent d&eacute;sormais publier des <strong style="color: ${emailColors.teal};">annonces d&eacute;taillant leurs besoins sp&eacute;cifiques</strong> (lieu, sp&eacute;cialit&eacute;, type d’accompagnement, disponibilit&eacute;s…). Vous pouvez les consulter et r&eacute;pondre directement &agrave; celles qui correspondent &agrave; votre profil &mdash; une nouvelle fa&ccedil;on de trouver des familles sans attendre qu’elles vous d&eacute;couvrent.
      </p>

      ${emailButton('Voir les annonces des familles', 'https://neuro-care.fr/annonces')}

      ${emailDivider()}

      <div style="background-color: ${emailColors.pinkBg}; border-left: 4px solid ${emailColors.pink}; padding: 18px 20px; margin: 24px 0; border-radius: 0 10px 10px 0;">
        <p style="margin: 0 0 8px; font-size: 15px; font-weight: 700; color: ${emailColors.pinkDark};">
          &#128226; Campagne de lancement &agrave; venir
        </p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #444;">
          Nous d&eacute;ployons prochainement une campagne pour faire conna&icirc;tre NeuroCare aupr&egrave;s d’un maximum de familles. <strong>Plus de familles sur la plateforme, c’est plus de visibilit&eacute; pour votre profil</strong> et plus d’opportunit&eacute;s d’accompagnement.
        </p>
      </div>

      <p style="margin: 24px 0 20px; font-size: 15px; line-height: 1.7; color: ${emailColors.textLight};">
        Pour profiter au mieux de cette dynamique, pensez &agrave; <strong>compl&eacute;ter votre profil</strong> (bio, sp&eacute;cialisations, disponibilit&eacute;s) et &agrave; <strong>soumettre vos documents de v&eacute;rification</strong> &mdash; un profil v&eacute;rifi&eacute; et complet est mis en avant aupr&egrave;s des familles.
      </p>

      ${emailButton('Compléter mon profil', 'https://neuro-care.fr/dashboard/educator', { color: emailColors.teal })}

      ${emailDivider()}

      <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: ${emailColors.textLight};">
        Si vous avez une question, une suggestion ou un retour &agrave; nous partager, r&eacute;pondez simplement &agrave; cet email &mdash; nous lisons tout.
      </p>

      ${emailSignature('NeuroCare')}
    `)}
  `, { preheader: 'Merci de rejoindre NeuroCare — découvrez les annonces des familles et la campagne à venir' });
}
