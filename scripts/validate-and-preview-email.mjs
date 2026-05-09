// One-shot : valide test2@test.com sur Supabase + envoie une copie du mail de confirmation
// à zakariyanebbache@gmail.com pour preview.

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const TARGET_EMAIL = 'test2@test.com';
const PREVIEW_TO = 'zakariyanebbache@gmail.com';

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const resend = new Resend(env.RESEND_API_KEY);

async function main() {
  // 1) Trouver l'utilisateur
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw listErr;
  const user = list.users.find((u) => u.email === TARGET_EMAIL);
  if (!user) {
    console.error(`Utilisateur ${TARGET_EMAIL} introuvable.`);
    process.exit(1);
  }
  console.log(`User trouvé : ${user.id} (confirmé=${user.email_confirmed_at ? 'oui' : 'non'})`);

  // Récupérer le prénom (selon le rôle)
  let firstName = 'Aidant';
  const role = user.user_metadata?.role || 'family';
  const tableName = role === 'educator' ? 'educator_profiles' : 'family_profiles';
  const { data: profile } = await supabase.from(tableName).select('first_name').eq('user_id', user.id).maybeSingle();
  if (profile?.first_name) firstName = profile.first_name;
  console.log(`Prénom : ${firstName}, rôle : ${role}`);

  // 2) Générer le lien de confirmation AVANT de valider (sinon Supabase peut ne plus le générer)
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: TARGET_EMAIL,
    options: { redirectTo: 'https://neuro-care.fr/auth/login?confirmed=true' },
  });
  if (linkErr) {
    console.error('Erreur generateLink :', linkErr.message);
    process.exit(1);
  }
  const confirmationUrl = linkData.properties?.action_link;
  if (!confirmationUrl) {
    console.error('Pas de action_link retourné.');
    process.exit(1);
  }
  console.log('Lien de confirmation généré.');

  // 3) Envoyer la preview à zakariyanebbache@gmail.com
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#fdf9f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table role="presentation" style="width:600px;border-collapse:collapse;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(2,126,126,0.15);">
        <tr><td style="padding:20px 40px;background:#fff3cd;border-radius:16px 16px 0 0;border-bottom:1px solid #ffe0a3;">
          <p style="margin:0;color:#7a5c00;font-size:13px;"><strong>[PREVIEW]</strong> Ceci est une copie du mail qui a été envoyé à <strong>${TARGET_EMAIL}</strong> lors de l'inscription.</p>
        </td></tr>
        <tr><td style="padding:40px 40px 30px 40px;text-align:center;background:linear-gradient(135deg,#027e7e 0%,#05a5a5 50%,#3a9e9e 100%);">
          <h1 style="margin:0;color:#fff;font-size:32px;font-weight:bold;">NeuroCare</h1>
          <p style="margin:15px 0 0 0;color:#fff;font-size:16px;opacity:0.95;">Confirmez votre adresse email</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 20px 0;font-size:18px;color:#333;">Bonjour ${firstName},</p>
          <div style="background:linear-gradient(135deg,#e6f4f4 0%,#c9eaea 100%);border:2px solid #027e7e;border-radius:12px;padding:25px;margin:0 0 30px 0;text-align:center;">
            <div style="font-size:40px;margin-bottom:15px;">✉️</div>
            <h2 style="margin:0 0 15px 0;color:#027e7e;font-size:20px;font-weight:bold;">Confirmez votre adresse email</h2>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#333;">Pour activer votre compte et accéder à toutes les fonctionnalités, cliquez sur le bouton ci-dessous.</p>
            <table role="presentation" style="margin:0 auto;"><tr><td style="border-radius:8px;background:#027e7e;">
              <a href="${confirmationUrl}" style="display:inline-block;padding:16px 40px;color:#fff;text-decoration:none;font-weight:bold;font-size:16px;background:#027e7e;border-radius:8px;">✓ Confirmer mon email</a>
            </td></tr></table>
            <p style="margin:20px 0 0 0;font-size:13px;color:#027e7e;">Ce lien expire dans 24 heures.</p>
          </div>
          <p style="margin:0 0 20px 0;font-size:13px;line-height:1.6;color:#888;">
            Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
            <a href="${confirmationUrl}" style="color:#027e7e;word-break:break-all;font-size:12px;">${confirmationUrl}</a>
          </p>
          <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#555;">Nous sommes ravis de vous accueillir sur <strong style="color:#027e7e;">NeuroCare</strong>.</p>
          <p style="margin:0;font-size:16px;color:#555;">Avec tout notre soutien,<br>L'équipe <strong style="color:#027e7e;">NeuroCare</strong></p>
        </td></tr>
        <tr><td style="padding:30px;text-align:center;background:#fdf9f4;border-radius:0 0 16px 16px;border-top:1px solid #e6f4f4;">
          <p style="margin:0;font-size:14px;color:#888;">© 2026 NeuroCare - Tous droits réservés</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { data: emailData, error: emailErr } = await resend.emails.send({
    from: 'NeuroCare <admin@neuro-care.fr>',
    to: [PREVIEW_TO],
    subject: `[PREVIEW pour ${TARGET_EMAIL}] Confirmez votre email - Bienvenue sur NeuroCare`,
    html,
  });
  if (emailErr) {
    console.error('Erreur envoi Resend :', emailErr);
    process.exit(1);
  }
  console.log(`Preview envoyée à ${PREVIEW_TO} (id: ${emailData?.id})`);

  // 4) Valider l'email côté Supabase
  const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
  if (updErr) {
    console.error('Erreur validation :', updErr.message);
    process.exit(1);
  }
  console.log(`Email ${TARGET_EMAIL} validé (email_confirm=true).`);
}

main().catch((e) => {
  console.error('Erreur fatale :', e);
  process.exit(1);
});
