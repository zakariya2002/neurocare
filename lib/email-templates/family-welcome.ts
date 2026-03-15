export function getFamilyWelcomeEmail(firstName: string, confirmationUrl?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur NeuroCare</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fdf9f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(2, 126, 126, 0.15);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #027e7e 0%, #05a5a5 50%, #3a9e9e 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                Bienvenue sur NeuroCare !
              </h1>
              <p style="margin: 15px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                Nous sommes là pour vous accompagner
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #333333;">
                Bonjour ${firstName},
              </p>

              ${confirmationUrl ? `
              <!-- Email Confirmation Section -->
              <div style="background: linear-gradient(135deg, #e6f4f4 0%, #c9eaea 100%); border: 2px solid #027e7e; border-radius: 12px; padding: 25px; margin: 0 0 30px 0; text-align: center;">
                <div style="font-size: 40px; margin-bottom: 15px;">✉️</div>
                <h2 style="margin: 0 0 15px 0; color: #027e7e; font-size: 20px; font-weight: bold;">
                  Confirmez votre adresse email
                </h2>
                <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #333333;">
                  Pour activer votre compte et accéder à toutes les fonctionnalités, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
                </p>
                <table role="presentation" style="margin: 0 auto;">
                  <tr>
                    <td style="border-radius: 8px; background: linear-gradient(135deg, #027e7e 0%, #05a5a5 100%); box-shadow: 0 4px 6px rgba(2, 126, 126, 0.3);">
                      <a href="${confirmationUrl}"
                         style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                        ✓ Confirmer mon email
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 20px 0 0 0; font-size: 13px; color: #027e7e;">
                  Ce lien expire dans 24 heures.
                </p>
              </div>
              ` : ''}

              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #555555;">
                Nous sommes ravis de vous accueillir sur <strong style="color: #027e7e;">NeuroCare</strong>, la plateforme qui met en relation les familles et les professionnels spécialisés dans les troubles neurodéveloppementaux.
              </p>

              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555555;">
                ${confirmationUrl ? 'Une fois votre email confirmé, vous pourrez' : 'Votre compte est désormais actif et <strong style="color: #027e7e;">entièrement gratuit</strong>. Vous pouvez dès maintenant'} accéder à toutes nos fonctionnalités :
              </p>

              <div style="background-color: #e6f4f4; border-left: 4px solid #027e7e; padding: 20px; margin: 0 0 30px 0; border-radius: 0 8px 8px 0;">
                <ul style="margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 12px; color: #333333; font-size: 15px;">
                    🔍 <strong>Rechercher des professionnels</strong> près de chez vous
                  </li>
                  <li style="margin-bottom: 12px; color: #333333; font-size: 15px;">
                    📅 <strong>Prendre rendez-vous</strong> directement en ligne
                  </li>
                  <li style="margin-bottom: 12px; color: #333333; font-size: 15px;">
                    💬 <strong>Échanger avec les professionnels</strong> via notre messagerie sécurisée
                  </li>
                  <li style="margin-bottom: 0; color: #333333; font-size: 15px;">
                    ⭐ <strong>Consulter les avis</strong> et choisir le meilleur accompagnement
                  </li>
                </ul>
              </div>

              <!-- 100% Gratuit Badge -->
              <div style="background: linear-gradient(135deg, #fdf9f4 0%, #f8c3cf 50%, #fdf9f4 100%); border: 2px solid #f0879f; border-radius: 12px; padding: 20px; margin: 0 0 30px 0; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #d16a7f;">
                  💝 100% Gratuit pour les familles
                </p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #555555;">
                  Notre mission est de vous offrir un accès simplifié à des professionnels qualifiés pour accompagner votre enfant dans son développement.
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background: linear-gradient(135deg, #027e7e 0%, #05a5a5 100%); box-shadow: 0 4px 12px rgba(2, 126, 126, 0.3);">
                    <a href="https://neuro-care.fr/search"
                       style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                      🔍 Trouver un professionnel
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 20px 0; font-size: 16px; line-height: 1.6; color: #555555;">
                Nous sommes ravis de faire partie de votre parcours. N'hésitez pas à nous contacter si vous avez la moindre question !
              </p>

              <p style="margin: 0; font-size: 16px; color: #555555;">
                Avec tout notre soutien,<br>
                L'équipe <strong style="color: #027e7e;">NeuroCare</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #fdf9f4; border-radius: 0 0 16px 16px; border-top: 1px solid #e6f4f4;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                Vous recevez cet email car vous vous êtes inscrit sur NeuroCare
              </p>
              <p style="margin: 0; font-size: 14px; color: #888888;">
                © 2025 <span style="color: #027e7e; font-weight: 600;">NeuroCare</span> - Tous droits réservés
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
