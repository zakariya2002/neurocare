import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const TARGET_EMAIL = 'fatimazeryouh@yahoo.com';

async function main() {
  // Find user
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) { console.error('listUsers error:', error); return; }

  const user = users.find(u => u.email === TARGET_EMAIL);
  if (!user) { console.log('User not found:', TARGET_EMAIL); return; }

  console.log('User found:', user.id);
  console.log('Email confirmed:', user.email_confirmed_at ? 'YES' : 'NO');
  console.log('Role:', user.user_metadata?.role);

  // Get first name
  let firstName = 'Fatima';
  const role = user.user_metadata?.role || 'family';

  if (role === 'family') {
    const { data } = await supabase.from('family_profiles').select('first_name').eq('user_id', user.id).single();
    if (data) firstName = data.first_name;
  } else if (role === 'educator') {
    const { data } = await supabase.from('educator_profiles').select('first_name').eq('user_id', user.id).single();
    if (data) firstName = data.first_name;
  }
  console.log('First name:', firstName);

  // Generate confirmation link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: TARGET_EMAIL,
    options: {
      redirectTo: 'https://neuro-care.fr/auth/login?confirmed=true'
    }
  });

  if (linkError) {
    console.error('generateLink error:', linkError.message);
    return;
  }

  const confirmationUrl = linkData.properties?.action_link;
  console.log('Confirmation URL generated:', !!confirmationUrl);

  if (!confirmationUrl) {
    console.error('No action_link in response');
    return;
  }

  // Send email via Resend
  const { data: emailData, error: emailError } = await resend.emails.send({
    from: 'NeuroCare <admin@neuro-care.fr>',
    to: [TARGET_EMAIL],
    subject: `Confirmez votre email - Bienvenue sur NeuroCare, ${firstName} !`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fdf9f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(2, 126, 126, 0.15);">
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #027e7e 0%, #05a5a5 50%, #3a9e9e 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">NeuroCare</h1>
              <p style="margin: 15px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Confirmez votre adresse email</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #333333;">Bonjour ${firstName},</p>
              <div style="background: linear-gradient(135deg, #e6f4f4 0%, #c9eaea 100%); border: 2px solid #027e7e; border-radius: 12px; padding: 25px; margin: 0 0 30px 0; text-align: center;">
                <div style="font-size: 40px; margin-bottom: 15px;">✉️</div>
                <h2 style="margin: 0 0 15px 0; color: #027e7e; font-size: 20px; font-weight: bold;">Confirmez votre adresse email</h2>
                <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #333333;">Pour activer votre compte et accéder à toutes les fonctionnalités, cliquez sur le bouton ci-dessous.</p>
                <table role="presentation" style="margin: 0 auto;">
                  <tr>
                    <td style="border-radius: 8px; background-color: #027e7e;">
                      <a href="${confirmationUrl}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; background-color: #027e7e; border-radius: 8px;">✓ Confirmer mon email</a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 20px 0 0 0; font-size: 13px; color: #027e7e;">Ce lien expire dans 24 heures.</p>
              </div>

              <!-- Fallback link -->
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #888888;">
                Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
                <a href="${confirmationUrl}" style="color: #027e7e; word-break: break-all; font-size: 12px;">${confirmationUrl}</a>
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #555555;">Nous sommes ravis de vous accueillir sur <strong style="color: #027e7e;">NeuroCare</strong>, la plateforme qui met en relation les familles et les professionnels spécialisés dans les troubles neurodéveloppementaux.</p>
              <p style="margin: 0; font-size: 16px; color: #555555;">Avec tout notre soutien,<br>L'équipe <strong style="color: #027e7e;">NeuroCare</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #fdf9f4; border-radius: 0 0 16px 16px; border-top: 1px solid #e6f4f4;">
              <p style="margin: 0; font-size: 14px; color: #888888;">© 2025 NeuroCare - Tous droits réservés</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (emailError) {
    console.error('Resend error:', emailError);
    return;
  }

  console.log('Email sent successfully!');
  console.log('Email ID:', emailData?.id);
}

main().catch(e => console.error('Fatal error:', e));
