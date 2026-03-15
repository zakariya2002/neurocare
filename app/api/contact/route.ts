import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message, userType } = await request.json();

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Déterminer le type d'utilisateur en français
    const userTypeMap: Record<string, string> = {
      family: 'Famille',
      educator: 'Éducateur spécialisé',
      institution: 'Institution',
      other: 'Autre'
    };
    const userTypeLabel = userTypeMap[userType as string] || 'Non spécifié';

    // Envoyer l'email via Resend
    const emailData = await resend.emails.send({
      from: 'Contact NeuroCare <noreply@neuro-care.fr>',
      to: ['admin@neuro-care.fr'],
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                padding: 30px 20px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
                border-radius: 0 0 10px 10px;
              }
              .info-box {
                background: white;
                border-left: 4px solid #3b82f6;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .info-box strong {
                color: #1f2937;
              }
              .message-box {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border: 1px solid #e5e7eb;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 12px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
              .label {
                display: inline-block;
                background: #dbeafe;
                color: #1e40af;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📬 Nouveau message de contact</h1>
            </div>
            <div class="content">
              <div class="info-box">
                <p><strong>De :</strong> ${escapeHtml(name)}</p>
                <p><strong>Email :</strong> <a href="mailto:${escapeHtml(email)}" style="color: #3b82f6;">${escapeHtml(email)}</a></p>
                <p><strong>Type :</strong> <span class="label">${userTypeLabel}</span></p>
                <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR', {
                  dateStyle: 'full',
                  timeStyle: 'short'
                })}</p>
              </div>

              <h2 style="color: #1f2937; margin-top: 30px;">Sujet :</h2>
              <p style="font-size: 18px; font-weight: 600; color: #3b82f6;">${escapeHtml(subject)}</p>

              <h2 style="color: #1f2937; margin-top: 30px;">Message :</h2>
              <div class="message-box">
                ${escapeHtml(message).replace(/\n/g, '<br>')}
              </div>

              <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                  <strong>💡 Conseil :</strong> Répondez directement à cet email pour contacter ${escapeHtml(name)}.
                </p>
              </div>
            </div>
            <div class="footer">
              <p>NeuroCare - Formulaire de Contact</p>
              <p>Cet email a été envoyé automatiquement depuis le formulaire de contact du site.</p>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json(
      { success: true, messageId: emailData.data?.id },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.' },
      { status: 500 }
    );
  }
}
