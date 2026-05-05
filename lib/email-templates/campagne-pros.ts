import {
  emailLayout,
  emailHeader,
  emailBody,
  emailButton,
  emailInfoBox,
  emailDivider,
  emailColors,
} from './base';

const CAMPAGNE_URL = 'https://neuro-care.fr/campagne';

export const CAMPAGNE_PROS_SUBJECTS = {
  v1: 'Les familles TND vous cherchent — et ne vous trouvent pas',
  v2: "J'ai construit quelque chose pour vous",
  v3: '1 personne sur 6 a un TND. Vous êtes prêt·e ?',
};

function campagneFooter(unsubscribeUrl = '{{unsubscribe_url}}'): string {
  return `
  <p style="margin: 0; font-size: 12px; color: #b0b0b0; text-align: center; line-height: 1.6;">
    Vous recevez cet email car vous &ecirc;tes professionnel de sant&eacute; sp&eacute;cialis&eacute; TND.<br>
    <a href="${unsubscribeUrl}" style="color: #b0b0b0; text-decoration: underline;">Se d&eacute;sabonner</a>
  </p>`;
}

function campagneSignature(): string {
  return `
  <p style="margin: 28px 0 0; font-size: 15px; color: ${emailColors.textLight}; line-height: 1.7;">
    Cordialement,<br>
    <strong style="color: ${emailColors.teal};">Zakariya Nebbache</strong><br>
    <span style="font-size: 13px; color: ${emailColors.textMuted};">Fondateur — NeuroCare</span><br>
    <a href="https://neuro-care.fr" style="font-size: 13px; color: ${emailColors.teal}; text-decoration: none;">neuro-care.fr</a>
  </p>`;
}

// ──────────────────────────────────────────────────────────────────────────────
// V1 — Angle : La demande existe, vous êtes invisible
// Ton : factuel, sobre, ancré dans la réalité du terrain
// ──────────────────────────────────────────────────────────────────────────────
export function getCampagneProsV1(prenom: string, raisonSociale: string): string {
  return emailLayout(
    `
    ${emailHeader(
      'Les familles TND vous cherchent',
      'Et ne vous trouvent pas',
    )}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
        Bonjour ${prenom},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        En France, <strong style="color: ${emailColors.text};">1 personne sur 6</strong> a un trouble du
        neurod&eacute;veloppement (TND) — autisme, TDAH, DYS, DCD ou autres. Cela repr&eacute;sente plusieurs
        millions de familles qui cherchent, parfois pendant des mois, un professionnel qualifi&eacute; comme vous.
      </p>

      ${emailInfoBox(
        'Les familles attendent souvent <strong>plus d&rsquo;un an</strong> avant de trouver un professionnel qualifi&eacute; pour accompagner leur enfant.',
      )}

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        Le probl&egrave;me n'est pas un manque de professionnels comp&eacute;tents. C'est un probl&egrave;me de
        <strong style="color: ${emailColors.text};">visibilit&eacute;</strong>. Les familles ne savent pas o&ugrave;
        vous trouver. Les annuaires g&eacute;n&eacute;ralistes ne sont pas adapt&eacute;s. Et le bouche-&agrave;-oreille
        ne suffit plus face &agrave; l'ampleur de la demande.
      </p>

      <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: ${emailColors.text};">
        NeuroCare est la plateforme qui change &ccedil;a.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; Un profil d&eacute;taill&eacute; qui met en avant vos sp&eacute;cialit&eacute;s TND
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; Des familles qui vous trouvent directement, sans interm&eacute;diaire
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; <strong>Inscription gratuite</strong> — 10&nbsp;% de commission uniquement sur les rendez-vous confirm&eacute;s
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; Aucun abonnement, aucun engagement
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        ${raisonSociale ? `En rejoignant NeuroCare, <strong style="color: ${emailColors.text};">${raisonSociale}</strong> sera visible par des milliers de familles qui cherchent activement un professionnel dans votre domaine.` : 'En rejoignant NeuroCare, votre cabinet sera visible par des milliers de familles qui cherchent activement un professionnel dans votre domaine.'}
      </p>

      ${emailButton('D&eacute;couvrir NeuroCare &amp; m&rsquo;inscrire', CAMPAGNE_URL)}

      ${emailDivider()}
      ${campagneSignature()}
    `)}

    <tr>
      <td style="padding: 16px 36px 24px;">
        ${campagneFooter()}
      </td>
    </tr>
  `,
    { preheader: 'En France, 1 personne sur 6 a un TND — les familles vous cherchent sur NeuroCare.' },
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// V2 — Angle : Personnel, fondateur qui s'adresse directement
// Ton : chaleureux, humain, personnel — presque comme une lettre
// ──────────────────────────────────────────────────────────────────────────────
export function getCampagneProsV2(prenom: string, raisonSociale: string): string {
  return emailLayout(
    `
    ${emailHeader(
      'Un projet construit pour vous',
      'Message du fondateur de NeuroCare',
    )}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
        Bonjour ${prenom},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        Je m&rsquo;appelle Zakariya. J&rsquo;ai construit NeuroCare parce que trouver un professionnel
        du neurod&eacute;veloppement en France est un <strong style="color: ${emailColors.text};">parcours
        du combattant</strong> pour les familles. Des d&eacute;lais trop longs, des annuaires incomplets,
        des appels rest&eacute;s sans r&eacute;ponse.
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        En parlant avec des ergoth&eacute;rapeutes, des psychomotriciens et des orthophonistes, j&rsquo;ai
        compris l&rsquo;autre face du probl&egrave;me&nbsp;: vous &ecirc;tes des professionnels tr&egrave;s
        qualifi&eacute;s, mais votre visibilit&eacute; ne refl&egrave;te pas votre expertise.
        Les familles qui auraient besoin de vous ne vous trouvent tout simplement pas.
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        Alors j&rsquo;ai construit NeuroCare pour connecter ces deux r&eacute;alit&eacute;s.
      </p>

      ${emailInfoBox(
        '<strong>Ce que NeuroCare vous apporte&nbsp;:</strong> un profil professionnel d&eacute;di&eacute; TND, des familles qui vous contactent directement, et une mise en relation simple et transparente.',
      )}

      <p style="margin: 24px 0 12px; font-size: 15px; font-weight: 600; color: ${emailColors.text};">
        Notre mod&egrave;le est simple et honnête&nbsp;:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; <strong>Inscription 100&nbsp;% gratuite</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; <strong>10&nbsp;% de commission</strong> uniquement sur les rendez-vous confirm&eacute;s — rien si vous n&rsquo;avez pas de rendez-vous
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; Vous gardez le contr&ocirc;le de votre agenda et de vos tarifs
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; Aucun engagement, vous pouvez quitter quand vous voulez
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        ${raisonSociale ? `Je serais honor&eacute; d&rsquo;accueillir <strong style="color: ${emailColors.text};">${raisonSociale}</strong> parmi les premiers professionnels NeuroCare. Votre expertise m&eacute;rite d&rsquo;&ecirc;tre visible.` : 'Je serais honor&eacute; de vous accueillir parmi les premiers professionnels NeuroCare. Votre expertise m&eacute;rite d&rsquo;&ecirc;tre visible.'}
      </p>

      ${emailButton('D&eacute;couvrir NeuroCare &amp; m&rsquo;inscrire', CAMPAGNE_URL)}

      <p style="margin: 0 0 10px; font-size: 13px; color: ${emailColors.textMuted}; line-height: 1.5;">
        Une question&nbsp;? R&eacute;pondez directement &agrave; cet email, je lis tous les messages.
      </p>

      ${emailDivider()}
      ${campagneSignature()}
    `)}

    <tr>
      <td style="padding: 16px 36px 24px;">
        ${campagneFooter()}
      </td>
    </tr>
  `,
    { preheader: `${prenom}, j'ai construit NeuroCare pour connecter votre expertise aux familles qui vous cherchent.` },
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// V3 — Angle : La stratégie nationale comme contexte de légitimité
// Ton : sérieux, ancré dans le cadre institutionnel, valorise l'expertise du pro
// ──────────────────────────────────────────────────────────────────────────────
export function getCampagneProsV3(prenom: string, raisonSociale: string): string {
  return emailLayout(
    `
    ${emailHeader(
      '1 personne sur 6 a un TND',
      'La stratégie nationale identifie le défi — NeuroCare y répond',
    )}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
        Bonjour ${prenom},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        La <strong style="color: ${emailColors.text};">Strat&eacute;gie nationale pour les TND 2023&ndash;2027</strong>
        identifie un d&eacute;fi clair&nbsp;: garantir l&rsquo;accompagnement de chaque personne concern&eacute;e
        par des professionnels bien form&eacute;s, accessibles et identifi&eacute;s. En France, cela concerne
        pr&egrave;s de <strong style="color: ${emailColors.text};">11 millions de personnes</strong>.
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        L&rsquo;&Eacute;tat reconna&icirc;t le probl&egrave;me. Les professionnels comp&eacute;tents existent.
        Ce qui manque, c&rsquo;est le lien entre les deux.
      </p>

      ${emailInfoBox(
        'NeuroCare est la plateforme de mise en relation d&eacute;di&eacute;e aux professionnels sp&eacute;cialis&eacute;s TND — ergoth&eacute;rapeutes, psychomotriciens, orthophonistes, et autres sp&eacute;cialistes du neurod&eacute;veloppement.',
      )}

      <p style="margin: 24px 0 12px; font-size: 15px; font-weight: 600; color: ${emailColors.text};">
        Rejoindre NeuroCare, c&rsquo;est&nbsp;:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; Valoriser votre formation et votre expertise aupr&egrave;s des familles concern&eacute;es
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; Participer concr&egrave;tement &agrave; la r&eacute;ponse au d&eacute;fi national de l&rsquo;acc&egrave;s aux soins TND
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; &Ecirc;tre trouv&eacute; par des familles qui ont d&eacute;j&agrave; identifi&eacute; leur besoin
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailColors.text}; line-height: 1.5;">
            &#10003;&nbsp; <strong>Inscription gratuite</strong> — 10&nbsp;% de commission sur les rendez-vous confirm&eacute;s uniquement
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${emailColors.textLight};">
        ${raisonSociale ? `<strong style="color: ${emailColors.text};">${raisonSociale}</strong> a les comp&eacute;tences. NeuroCare vous donne la visibilit&eacute; pour que les familles qui en ont besoin vous trouvent.` : 'Vous avez les comp&eacute;tences. NeuroCare vous donne la visibilit&eacute; pour que les familles qui en ont besoin vous trouvent.'}
      </p>

      ${emailButton('D&eacute;couvrir NeuroCare &amp; m&rsquo;inscrire', CAMPAGNE_URL)}

      <p style="margin: 0 0 10px; font-size: 13px; color: ${emailColors.textMuted}; line-height: 1.5;">
        Votre profil est v&eacute;rifi&eacute; par notre &eacute;quipe avant mise en ligne — pour garantir la
        qualit&eacute; et la s&eacute;curit&eacute; pour les familles.
      </p>

      ${emailDivider()}
      ${campagneSignature()}
    `)}

    <tr>
      <td style="padding: 16px 36px 24px;">
        ${campagneFooter()}
      </td>
    </tr>
  `,
    { preheader: '11 millions de personnes concernées par un TND en France. Votre expertise leur est indispensable.' },
  );
}
