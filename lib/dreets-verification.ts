/**
 * Service de vérification des diplômes auprès de la DREETS
 *
 * Envoie automatiquement un email à la DREETS de la région concernée
 * pour vérifier l'authenticité du diplôme d'un éducateur.
 */

// Emails des DREETS par région (emails officiels)
// Source: DREETS_CONTACTS.md pour plus d'informations et contacts spécifiques
const DREETS_EMAILS: { [region: string]: string } = {
  'Île-de-France': 'drieets-idf@drieets.gouv.fr', // Note: DRIEETS en IDF
  'Auvergne-Rhône-Alpes': 'dreets-ara@dreets.gouv.fr',
  'Provence-Alpes-Côte d\'Azur': 'dreets-paca@dreets.gouv.fr',
  'Nouvelle-Aquitaine': 'dreets-na@dreets.gouv.fr',
  'Occitanie': 'dreets-occitanie@dreets.gouv.fr',
  'Hauts-de-France': 'dreets-hdf@dreets.gouv.fr',
  'Grand Est': 'dreets-ge@dreets.gouv.fr',
  'Bretagne': 'dreets-bretagne@dreets.gouv.fr',
  'Pays de la Loire': 'dreets-pdl@dreets.gouv.fr',
  'Normandie': 'dreets-normandie@dreets.gouv.fr',
  'Bourgogne-Franche-Comté': 'dreets-bfc@dreets.gouv.fr',
  'Centre-Val de Loire': 'dreets-cvl@dreets.gouv.fr',
  'Corse': 'dreets-corse@dreets.gouv.fr',
  // Outre-mer (DEETS)
  'Guadeloupe': 'deets-guadeloupe@deets.gouv.fr',
  'Guyane': 'deets-guyane@deets.gouv.fr',
  'La Réunion': 'deets-reunion@deets.gouv.fr',
  'Martinique': 'deets-martinique@deets.gouv.fr',
  'Mayotte': 'deets-mayotte@deets.gouv.fr',
  // Email par défaut si région non trouvée
  'default': 'contact@neuro-care.fr' // Email de votre plateforme pour traitement manuel
};

export interface DREETSVerificationRequest {
  educatorId: string;
  educatorFirstName: string;
  educatorLastName: string;
  educatorEmail: string;
  educatorPhone: string;
  diplomaUrl: string;
  diplomaNumber?: string;
  deliveryDate?: string;
  region?: string;
  ocrAnalysis?: string;
}

/**
 * Envoie une demande de vérification à la DREETS
 */
export async function sendDREETSVerificationRequest(
  request: DREETSVerificationRequest
): Promise<{ success: boolean; message: string }> {
  try {
    // Déterminer l'email DREETS selon la région
    let dreetsEmail = request.region
      ? DREETS_EMAILS[request.region] || DREETS_EMAILS['default']
      : DREETS_EMAILS['default'];

    // En mode développement, envoyer à l'admin au lieu de DREETS
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_APP_URL?.includes('neuro-care.fr');
    if (isDevelopment) {
      dreetsEmail = process.env.ADMIN_EMAIL || 'zakariyanebbache@gmail.com';
    }

    const emailData = {
      to: dreetsEmail,
      cc: process.env.ADMIN_EMAIL || 'admin@neuro-care.fr',
      subject: `Demande de vérification de diplôme - ${request.educatorLastName} ${request.educatorFirstName}`,
      html: generateDREETSEmailTemplate(request),
      attachments: [
        {
          filename: `diplome_${request.educatorLastName}_${request.educatorFirstName}.pdf`,
          path: request.diplomaUrl
        }
      ]
    };

    // Envoi avec Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'NeuroCare <verification@neuro-care.fr>',
          to: dreetsEmail,
          cc: process.env.ADMIN_EMAIL,
          subject: emailData.subject,
          html: emailData.html,
          // Note: Les pièces jointes avec Resend nécessitent un traitement spécial
          // Pour l'instant on log l'URL du diplôme dans le corps de l'email
        });
      } catch (error) {
        console.error('Erreur envoi Resend:', error);
        throw error;
      }
    }

    return {
      success: true,
      message: 'Demande de vérification envoyée à la DREETS'
    };

  } catch (error) {
    console.error('Erreur envoi DREETS:', error);
    return {
      success: false,
      message: 'Erreur lors de l\'envoi de la demande à la DREETS'
    };
  }
}

/**
 * Génère le template HTML de l'email pour la DREETS
 */
function generateDREETSEmailTemplate(request: DREETSVerificationRequest): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .info-box { background: #f3f4f6; padding: 15px; margin: 15px 0; border-left: 4px solid #1e3a8a; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
        td:first-child { font-weight: bold; width: 200px; }
        .important { background: #fef3c7; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Demande de Vérification de Diplôme</h1>
          <p>Plateforme NeuroCare</p>
        </div>

        <div class="content">
          <p>Madame, Monsieur,</p>

          <p>
            Dans le cadre de notre plateforme de mise en relation entre familles et éducateurs spécialisés,
            nous sollicitons votre expertise pour vérifier l'authenticité du diplôme d'un éducateur souhaitant
            exercer via notre service.
          </p>

          <div class="info-box">
            <h3>📋 Informations de l'éducateur</h3>
            <table>
              <tr>
                <td>Nom :</td>
                <td><strong>${request.educatorLastName}</strong></td>
              </tr>
              <tr>
                <td>Prénom :</td>
                <td><strong>${request.educatorFirstName}</strong></td>
              </tr>
              <tr>
                <td>Email :</td>
                <td>${request.educatorEmail}</td>
              </tr>
              <tr>
                <td>Téléphone :</td>
                <td>${request.educatorPhone}</td>
              </tr>
              ${request.diplomaNumber ? `
              <tr>
                <td>N° de diplôme :</td>
                <td><strong>${request.diplomaNumber}</strong></td>
              </tr>
              ` : ''}
              ${request.deliveryDate ? `
              <tr>
                <td>Date de délivrance :</td>
                <td>${request.deliveryDate}</td>
              </tr>
              ` : ''}
              ${request.region ? `
              <tr>
                <td>Région :</td>
                <td>${request.region}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${request.ocrAnalysis ? `
          <div class="info-box">
            <h3>🔍 Analyse automatique (OCR)</h3>
            <pre style="white-space: pre-wrap; font-size: 12px; background: #f9fafb; padding: 10px; border-radius: 5px;">${request.ocrAnalysis}</pre>
          </div>
          ` : ''}

          <div class="important">
            <h3>📎 Document à vérifier</h3>
            <p>
              <strong>Lien sécurisé vers le diplôme :</strong><br>
              <a href="${request.diplomaUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                🔗 Télécharger le diplôme
              </a>
            </p>
            <p style="font-size: 12px; color: #666;">
              Ce lien est sécurisé et permet de télécharger le diplôme au format PDF/Image.
            </p>
            <br>
            <p>
              <strong>Merci de vérifier son authenticité et de nous confirmer :</strong>
            </p>
            <ul>
              <li>✓ Le diplôme est authentique et valide</li>
              <li>✗ Le diplôme n'est pas reconnu / est invalide</li>
            </ul>
          </div>

          <h3>📞 Comment nous répondre ?</h3>
          <p>
            Merci de répondre à cet email en indiquant :
          </p>
          <ol>
            <li>La validité du diplôme (OUI / NON)</li>
            <li>Le numéro d'enregistrement si applicable</li>
            <li>Toute information complémentaire pertinente</li>
          </ol>

          <p style="margin-top: 30px;">
            Nous vous remercions par avance pour votre collaboration qui contribue à garantir
            la sécurité et la qualité des services proposés aux familles d'enfants autistes.
          </p>

          <p>
            Cordialement,<br>
            <strong>L'équipe NeuroCare</strong>
          </p>
        </div>

        <div class="footer">
          <p>
            <strong>NeuroCare</strong><br>
            Plateforme de mise en relation familles-éducateurs<br>
            ${process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr'}<br>
            ${process.env.ADMIN_EMAIL || 'contact@neuro-care.fr'}
          </p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">
            Cet email est envoyé automatiquement dans le cadre de la vérification des diplômes
            des professionnels inscrits sur notre plateforme. Si vous recevez cet email par erreur,
            merci de nous en informer.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envoie une notification à l'admin quand la DREETS répond
 */
export async function notifyAdminDREETSResponse(
  educatorName: string,
  isVerified: boolean,
  dreetsResponse: string
): Promise<void> {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'NeuroCare <verification@neuro-care.fr>',
      to: process.env.ADMIN_EMAIL || 'admin@neuro-care.fr',
      subject: `Réponse DREETS - ${educatorName}`,
      html: `
        <h2>Réponse de la DREETS reçue</h2>
        <p><strong>Éducateur:</strong> ${educatorName}</p>
        <p><strong>Résultat:</strong> ${isVerified ? '✅ Diplôme vérifié' : '❌ Diplôme non vérifié'}</p>
        <p><strong>Réponse DREETS:</strong></p>
        <pre>${dreetsResponse}</pre>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/verify-diplomas">
            Voir dans le dashboard admin
          </a>
        </p>
      `
    });
  } catch (error) {
    console.error('Erreur notification admin DREETS:', error);
  }
}

/**
 * Utilitaire pour convertir un fichier en base64 (pour les pièces jointes)
 */
async function fetchFileAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Export du service
export const dreetsService = {
  sendDREETSVerificationRequest,
  notifyAdminDREETSResponse,
  DREETS_EMAILS,
};
