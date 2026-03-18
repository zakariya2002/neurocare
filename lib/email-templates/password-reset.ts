export function getPasswordResetEmail(firstName: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe - NeuroCare</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fdf9f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(2, 126, 126, 0.15);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #027e7e 0%, #05a5a5 50%, #3a9e9e 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Réinitialisation de mot de passe
              </h1>
              <p style="margin: 15px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                NeuroCare
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #333333;">
                Bonjour ${firstName},
              </p>

              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #555555;">
                Vous avez demandé à réinitialiser votre mot de passe sur <strong style="color: #027e7e;">NeuroCare</strong>.
              </p>

              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555555;">
                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto 30px auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: #027e7e;">
                    <a href="${resetUrl}"
                       style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; background-color: #027e7e; border-radius: 8px;">
                      🔐 Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 0 0 30px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  ⚠️ <strong>Ce lien expire dans 1 heure.</strong><br>
                  Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                </p>
              </div>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #888888;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <a href="${resetUrl}" style="color: #027e7e; word-break: break-all;">${resetUrl}</a>
              </p>

              <p style="margin: 0; font-size: 16px; color: #555555;">
                À bientôt,<br>
                L'équipe <strong style="color: #027e7e;">NeuroCare</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #fdf9f4; border-radius: 0 0 16px 16px; border-top: 1px solid #e6f4f4;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                Vous recevez cet email car une demande de réinitialisation a été effectuée
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
