// ─── Shared email layout components for NeuroCare ───
const LOGO_URL = 'https://neuro-care.fr/images/logo-neurocare.png';
const APP_URL = 'https://neuro-care.fr';

export const emailColors = {
  teal: '#027e7e',
  tealLight: '#05a5a5',
  tealBg: '#e6f4f4',
  pink: '#f0879f',
  pinkDark: '#d16a7f',
  pinkBg: '#fdf0f3',
  cream: '#fdf9f4',
  white: '#ffffff',
  text: '#1f2937',
  textLight: '#555555',
  textMuted: '#888888',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
};

export function emailLayout(content: string, options?: { preheader?: string }): string {
  return `
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${emailColors.cream}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${options?.preheader ? `<div style="display:none;font-size:1px;color:${emailColors.cream};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${options.preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${emailColors.cream};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: ${emailColors.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(2,126,126,0.08);">
          ${content}
        </table>

        <!-- Footer -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; margin-top: 24px;">
          <tr>
            <td align="center" style="padding: 0 16px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: ${emailColors.textMuted}; line-height: 1.5;">
                <a href="${APP_URL}" style="color: ${emailColors.teal}; text-decoration: none; font-weight: 600;">neuro-care.fr</a>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #b0b0b0; line-height: 1.5;">
                <a href="${APP_URL}/about" style="color: #b0b0b0; text-decoration: none;">Qui sommes-nous</a>
                &nbsp;&bull;&nbsp;
                <a href="${APP_URL}/contact" style="color: #b0b0b0; text-decoration: none;">Contact</a>
                &nbsp;&bull;&nbsp;
                <a href="${APP_URL}/legal/mentions-legales" style="color: #b0b0b0; text-decoration: none;">Mentions l&eacute;gales</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #c0c0c0;">
                &copy; 2026 NeuroCare &mdash; Tous droits r&eacute;serv&eacute;s
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailHeader(title: string, subtitle?: string, options?: { bgColor?: string; icon?: string }): string {
  const bg = options?.bgColor || emailColors.teal;

  return `
  <tr>
    <td style="background-color: ${bg}; padding: 32px 40px 28px; text-align: center;">
      <img src="${LOGO_URL}" alt="NeuroCare" width="140" height="140" style="display: inline-block; margin-bottom: 16px; max-width: 140px; height: auto;" />
      ${options?.icon ? `<div style="font-size: 36px; margin-bottom: 8px;">${options.icon}</div>` : ''}
      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3;">
        ${title}
      </h1>
      ${subtitle ? `<p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 400;">${subtitle}</p>` : ''}
    </td>
  </tr>`;
}

export function emailBody(content: string): string {
  return `
  <tr>
    <td style="padding: 32px 36px 36px;">
      ${content}
    </td>
  </tr>`;
}

export function emailButton(text: string, url: string, options?: { color?: string; fullWidth?: boolean }): string {
  const bgColor = options?.color || emailColors.teal;
  const widthStyle = options?.fullWidth ? 'display: block; width: 100%; box-sizing: border-box; text-align: center;' : 'display: inline-block;';

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" ${options?.fullWidth ? 'width="100%"' : ''} style="margin: 24px 0;">
    <tr>
      <td align="center">
        <a href="${url}" style="${widthStyle} padding: 14px 32px; background-color: ${bgColor}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 10px; line-height: 1;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

export function emailInfoBox(text: string): string {
  return `
  <div style="background-color: ${emailColors.tealBg}; border-left: 4px solid ${emailColors.teal}; padding: 14px 18px; margin: 20px 0; border-radius: 0 10px 10px 0;">
    <p style="margin: 0; color: ${emailColors.teal}; font-size: 14px; font-weight: 500; line-height: 1.5;">${text}</p>
  </div>`;
}

export function emailWarningBox(text: string): string {
  return `
  <div style="background-color: #fef9ee; border-left: 4px solid #f59e0b; padding: 14px 18px; margin: 20px 0; border-radius: 0 10px 10px 0;">
    <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500; line-height: 1.5;">${text}</p>
  </div>`;
}

export function emailSteps(steps: string[]): string {
  return `
  <div style="margin: 24px 0;">
    ${steps.map((step, i) => `
    <div style="display: flex; margin-bottom: ${i < steps.length - 1 ? '12px' : '0'};">
      <div style="flex-shrink: 0; width: 28px; height: 28px; background-color: ${emailColors.tealBg}; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px; font-weight: 700; color: ${emailColors.teal}; margin-right: 14px;">${i + 1}</div>
      <p style="margin: 0; padding-top: 4px; font-size: 15px; color: ${emailColors.text}; line-height: 1.5;">${step}</p>
    </div>`).join('')}
  </div>`;
}

export function emailDivider(): string {
  return `<hr style="border: none; border-top: 1px solid ${emailColors.borderLight}; margin: 28px 0;" />`;
}

export function emailSignature(team: string = 'NeuroCare'): string {
  return `
  <p style="margin: 28px 0 0; font-size: 15px; color: ${emailColors.textLight}; line-height: 1.5;">
    &Agrave; bient&ocirc;t,<br>
    L'&eacute;quipe <strong style="color: ${emailColors.teal};">${team}</strong>
  </p>`;
}

export function emailTable(rows: { label: string; value: string; strikethrough?: boolean }[]): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
    ${rows.map((row, i) => `
    <tr>
      <td style="padding: 10px 12px; color: ${emailColors.textMuted}; font-size: 14px; ${i < rows.length - 1 ? `border-bottom: 1px solid ${emailColors.borderLight};` : ''} width: 140px; vertical-align: top;">
        ${row.label}
      </td>
      <td style="padding: 10px 12px; color: ${row.strikethrough ? '#b0b0b0' : emailColors.text}; font-size: 14px; font-weight: 600; ${i < rows.length - 1 ? `border-bottom: 1px solid ${emailColors.borderLight};` : ''} ${row.strikethrough ? 'text-decoration: line-through;' : ''}">
        ${row.value}
      </td>
    </tr>`).join('')}
  </table>`;
}
