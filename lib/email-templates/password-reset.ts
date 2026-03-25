import { emailLayout, emailHeader, emailBody, emailButton, emailWarningBox, emailSignature } from './base';

export function getPasswordResetEmail(firstName: string, resetUrl: string): string {
  return emailLayout(`
    ${emailHeader('R\u00e9initialisation du mot de passe', 'NeuroCare')}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: #1f2937; line-height: 1.6;">
        Bonjour ${firstName},
      </p>

      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #555555;">
        Vous avez demand&eacute; &agrave; r&eacute;initialiser votre mot de passe sur <strong style="color: #027e7e;">NeuroCare</strong>.
      </p>

      <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.6; color: #555555;">
        Cliquez sur le bouton ci-dessous pour cr&eacute;er un nouveau mot de passe&nbsp;:
      </p>

      ${emailButton('R\u00e9initialiser mon mot de passe', resetUrl)}

      ${emailWarningBox('Ce lien est valide pendant 1 heure. Si vous n\'avez pas demand\u00e9 cette r\u00e9initialisation, ignorez cet email.')}

      <p style="margin: 24px 0 0; font-size: 12px; color: #888888; line-height: 1.5;">
        Si le bouton ne fonctionne pas, copiez ce lien&nbsp;:<br>
        <a href="${resetUrl}" style="color: #027e7e; word-break: break-all; font-size: 11px;">${resetUrl}</a>
      </p>

      ${emailSignature()}
    `)}
  `, { preheader: 'R\u00e9initialisez votre mot de passe NeuroCare' });
}
