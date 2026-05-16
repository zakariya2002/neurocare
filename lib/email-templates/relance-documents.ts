import { emailLayout, emailHeader, emailBody, emailButton, emailInfoBox, emailWarningBox, emailSignature, emailDivider } from './base';

const UPLOAD_URL = 'https://neuro-care.fr/dashboard/educator/documents';

/**
 * J+1 — Bienvenue + rappel documents
 */
export function getRelanceJ1Email(firstName: string, docsUploaded: number): string {
  const missing = 4 - docsUploaded;
  return emailLayout(`
    ${emailHeader('Bienvenue sur NeuroCare Pro !', 'Finalisez votre inscription en quelques minutes')}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: #1f2937; line-height: 1.6;">
        Bonjour ${firstName},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #555555;">
        Nous sommes ravis de vous compter parmi les professionnels de NeuroCare&nbsp;!
        Pour que votre profil soit visible par les familles, il ne vous reste qu'une
        &eacute;tape&nbsp;: <strong>soumettre vos documents de v&eacute;rification</strong>.
      </p>

      ${emailInfoBox(`Il vous reste <strong>${missing} document${missing > 1 ? 's' : ''}</strong> &agrave; envoyer sur 4.`)}

      <p style="margin: 24px 0 12px; font-size: 15px; font-weight: 600; color: #1f2937;">
        Les 4 documents requis&nbsp;:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #333; line-height: 1.5;">
            <strong style="color: #027e7e;">1.</strong>&nbsp; Dipl&ocirc;me (ME, ES ou &eacute;quivalent)
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #333; line-height: 1.5;">
            <strong style="color: #027e7e;">2.</strong>&nbsp; Extrait de casier judiciaire (bulletin n&deg;3)
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #333; line-height: 1.5;">
            <strong style="color: #027e7e;">3.</strong>&nbsp; Pi&egrave;ce d'identit&eacute; (CNI ou passeport)
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #333; line-height: 1.5;">
            <strong style="color: #027e7e;">4.</strong>&nbsp; Attestation d'assurance professionnelle
          </td>
        </tr>
      </table>

      ${emailButton('Envoyer mes documents', UPLOAD_URL)}

      <p style="margin: 0 0 10px; font-size: 13px; color: #888888; line-height: 1.5;">
        L'envoi prend moins de 5 minutes. Vos documents sont trait&eacute;s de mani&egrave;re
        s&eacute;curis&eacute;e et confidentielle.
      </p>

      ${emailDivider()}
      ${emailSignature('NeuroCare Pro')}
    `)}
  `);
}

/**
 * J+3 — Rappel amical
 */
export function getRelanceJ3Email(firstName: string, docsUploaded: number): string {
  const missing = 4 - docsUploaded;
  return emailLayout(`
    ${emailHeader('Vos documents sont en attente', 'Des familles cherchent un professionnel comme vous')}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: #1f2937; line-height: 1.6;">
        Bonjour ${firstName},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #555555;">
        Nous avons remarqu&eacute; que votre dossier n'est pas encore complet.
        <strong>${missing} document${missing > 1 ? 's' : ''} sur 4</strong>
        ${missing > 1 ? 'manquent' : 'manque'} pour finaliser votre v&eacute;rification.
      </p>

      ${emailInfoBox('Des familles recherchent activement des professionnels dans votre r&eacute;gion. Votre profil ne sera visible qu\'apr&egrave;s v&eacute;rification de vos documents.')}

      <p style="margin: 24px 0 12px; font-size: 15px; line-height: 1.6; color: #555555;">
        En soumettant vos documents, vous pourrez&nbsp;:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #333; line-height: 1.5;">
            &#10003;&nbsp; Appara&icirc;tre dans les r&eacute;sultats de recherche
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #333; line-height: 1.5;">
            &#10003;&nbsp; Recevoir des demandes de rendez-vous
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #333; line-height: 1.5;">
            &#10003;&nbsp; Obtenir le badge de professionnel v&eacute;rifi&eacute;
          </td>
        </tr>
      </table>

      ${emailButton('Compl\u00e9ter mon dossier', UPLOAD_URL)}

      ${emailDivider()}
      ${emailSignature('NeuroCare Pro')}
    `)}
  `);
}

/**
 * J+7 — Dernier rappel (plus urgent)
 */
export function getRelanceJ7Email(firstName: string, docsUploaded: number): string {
  const missing = 4 - docsUploaded;
  return emailLayout(`
    ${emailHeader('Dernier rappel : finalisez votre profil', 'Votre inscription est incompl\u00e8te')}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: #1f2937; line-height: 1.6;">
        Bonjour ${firstName},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #555555;">
        Cela fait maintenant une semaine que vous vous &ecirc;tes inscrit(e) sur NeuroCare Pro,
        mais votre dossier est toujours incomplet.
        <strong>${missing} document${missing > 1 ? 's' : ''} sur 4</strong>
        ${missing > 1 ? 'n\'ont pas encore &eacute;t&eacute; envoy&eacute;s' : 'n\'a pas encore &eacute;t&eacute; envoy&eacute;'}.
      </p>

      ${emailWarningBox('<strong>Important :</strong> Sans documents v&eacute;rifi&eacute;s, votre profil ne sera pas visible par les familles et vous ne pourrez pas recevoir de demandes de rendez-vous.')}

      <p style="margin: 24px 0 12px; font-size: 15px; line-height: 1.6; color: #555555;">
        L'envoi de vos documents ne prend que quelques minutes et nous permet de
        garantir la s&eacute;curit&eacute; des familles qui utilisent notre plateforme.
      </p>

      ${emailButton('Finaliser mon inscription maintenant', UPLOAD_URL, { color: '#f0879f' })}

      <p style="margin: 20px 0 10px; font-size: 13px; color: #888888; line-height: 1.5;">
        Besoin d'aide ? R&eacute;pondez directement &agrave; cet email ou contactez-nous &agrave;
        <a href="mailto:contact@neuro-care.fr" style="color: #027e7e;">contact@neuro-care.fr</a>.
      </p>

      ${emailDivider()}
      ${emailSignature('NeuroCare Pro')}
    `)}
  `);
}
