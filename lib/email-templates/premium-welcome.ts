export function getPremiumWelcomeEmail(firstName: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue dans la famille Premium NeuroCare Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fdf9f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 8px 30px rgba(2, 126, 126, 0.2);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #027e7e 0%, #05a5a5 40%, #f0879f 100%); border-radius: 16px 16px 0 0; position: relative;">
              <div style="font-size: 48px; margin-bottom: 10px;">⭐</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                Bienvenue dans la famille Premium !
              </h1>
              <p style="margin: 15px 0 0 0; color: #ffffff; font-size: 18px; opacity: 0.95;">
                Vous êtes maintenant un membre VIP
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 20px; color: #333333; font-weight: bold;">
                Félicitations ${firstName} ! 🎉
              </p>

              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #555555;">
                C'est officiel : vous faites désormais partie de la <strong style="color: #027e7e;">famille Premium NeuroCare Pro</strong> ! Nous sommes ravis de vous compter parmi nos membres d'élite.
              </p>

              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555555;">
                Votre abonnement Premium débloque des avantages exclusifs qui vont transformer votre expérience sur la plateforme :
              </p>

              <div style="background: linear-gradient(135deg, #e6f4f4 0%, #c9eaea 50%, #f8c3cf 100%); border: 2px solid #027e7e; padding: 25px; margin: 0 0 30px 0; border-radius: 12px;">
                <h3 style="margin: 0 0 15px 0; color: #027e7e; font-size: 18px;">
                  🌟 Vos avantages Premium
                </h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 12px; color: #333333; font-size: 15px;">
                    ✨ <strong>Réservations illimitées</strong> - Plus de limite mensuelle !
                  </li>
                  <li style="margin-bottom: 12px; color: #333333; font-size: 15px;">
                    💬 <strong>Conversations illimitées</strong> - Échangez sans contrainte
                  </li>
                  <li style="margin-bottom: 12px; color: #333333; font-size: 15px;">
                    🔝 <strong>Visibilité prioritaire</strong> - Votre profil en tête des recherches
                  </li>
                  <li style="margin-bottom: 12px; color: #333333; font-size: 15px;">
                    ⭐ <strong>Badge Premium</strong> - Inspirez confiance avec votre badge
                  </li>
                  <li style="margin-bottom: 0; color: #333333; font-size: 15px;">
                    📊 <strong>Statistiques avancées</strong> - Bientôt disponible !
                  </li>
                </ul>
              </div>

              <div style="background: linear-gradient(135deg, #fdf9f4 0%, #f8c3cf 100%); border-left: 4px solid #f0879f; padding: 20px; margin: 0 0 30px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 15px; color: #d16a7f;">
                  💡 <strong>Astuce :</strong> Votre badge Premium ⭐ apparaît maintenant automatiquement sur votre profil et dans les résultats de recherche. Les familles verront que vous êtes un professionnel engagé !
                </p>
              </div>

              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555555;">
                Votre période d'essai gratuite de <strong style="color: #027e7e;">30 jours</strong> commence maintenant. Profitez-en pleinement pour découvrir tous les avantages Premium !
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto 30px auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: #027e7e;">
                    <a href="https://neuro-care.fr/dashboard/educator"
                       style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; background-color: #027e7e; border-radius: 8px;">
                      ⭐ Découvrir mon statut Premium
                    </a>
                  </td>
                </tr>
              </table>

              <div style="border-top: 2px solid #e6f4f4; padding-top: 25px;">
                <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #555555;">
                  Merci de votre confiance et de votre engagement envers notre communauté. Ensemble, nous faisons la différence dans la vie des personnes avec des troubles neurodéveloppementaux et de leurs familles.
                </p>

                <p style="margin: 0; font-size: 16px; color: #555555;">
                  Bienvenue dans la famille Premium ! 🤝<br>
                  L'équipe <strong style="color: #027e7e;">NeuroCare Pro</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #fdf9f4; border-radius: 0 0 16px 16px; border-top: 1px solid #e6f4f4;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                Vous recevez cet email car vous êtes devenu membre Premium
              </p>
              <p style="margin: 0 0 15px 0; font-size: 13px; color: #666666;">
                Gérez votre abonnement dans <a href="https://neuro-care.fr/dashboard/educator/subscription" style="color: #027e7e; text-decoration: underline; font-weight: 600;">votre espace</a>
              </p>
              <p style="margin: 0; font-size: 14px; color: #888888;">
                © 2025 <span style="color: #027e7e; font-weight: 600;">NeuroCare Pro</span> - Tous droits réservés
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
