import { emailLayout, emailHeader, emailBody, emailButton, emailTable, emailSignature, emailColors } from './base';

interface AppointmentCancelledData {
  firstName: string;
  educatorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  cancelledBy: 'educator' | 'family';
}

export function getFamilyAppointmentCancelledEmail(data: AppointmentCancelledData): string {
  const isCancelledByEducator = data.cancelledBy === 'educator';

  return emailLayout(`
    ${emailHeader('Rendez-vous annul\u00e9', undefined, { bgColor: emailColors.pink, icon: '&#10060;' })}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: #1f2937; line-height: 1.6;">
        Bonjour ${data.firstName},
      </p>

      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #555555;">
        ${isCancelledByEducator
          ? `Votre rendez-vous avec <strong>${data.educatorName}</strong> a &eacute;t&eacute; <strong style="color: #d16a7f;">annul&eacute;</strong> par le professionnel.`
          : `Nous confirmons l'annulation de votre rendez-vous avec <strong>${data.educatorName}</strong>.`
        }
      </p>

      <div style="background-color: #fdf0f3; border: 2px solid #f0879f; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
        <h2 style="margin: 0 0 16px; color: #d16a7f; font-size: 16px; font-weight: 700;">
          Rendez-vous annul&eacute;
        </h2>
        ${emailTable([
          { label: 'Professionnel', value: data.educatorName, strikethrough: true },
          { label: 'Date', value: data.appointmentDate, strikethrough: true },
          { label: 'Heure', value: data.appointmentTime, strikethrough: true },
        ])}
        ${data.reason ? `
        <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #f0879f;">
          <p style="margin: 0; font-size: 13px; color: #d16a7f;">
            <strong>Raison&nbsp;:</strong> ${data.reason}
          </p>
        </div>` : ''}
      </div>

      ${isCancelledByEducator ? `
      <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #555555;">
        Nous vous invitons &agrave; rechercher un autre professionnel disponible.
      </p>` : ''}

      ${emailButton('Trouver un professionnel', 'https://neuro-care.fr/search')}

      ${emailSignature()}
    `)}
  `, { preheader: `Rendez-vous annul\u00e9 avec ${data.educatorName}` });
}
