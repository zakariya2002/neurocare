import { emailLayout, emailHeader, emailBody, emailButton, emailTable, emailSignature } from './base';

interface AppointmentConfirmedData {
  firstName: string;
  educatorName: string;
  appointmentDate: string;
  appointmentTime: string;
  childName?: string;
  address?: string;
}

export function getFamilyAppointmentConfirmedEmail(data: AppointmentConfirmedData): string {
  const rows = [
    { label: 'Professionnel', value: data.educatorName },
    { label: 'Date', value: data.appointmentDate },
    { label: 'Heure', value: data.appointmentTime },
  ];
  if (data.childName) rows.push({ label: 'Enfant', value: data.childName });
  if (data.address) rows.push({ label: 'Lieu', value: data.address });

  return emailLayout(`
    ${emailHeader('Rendez-vous confirm\u00e9 !', undefined, { icon: '&#9989;' })}
    ${emailBody(`
      <p style="margin: 0 0 20px; font-size: 16px; color: #1f2937; line-height: 1.6;">
        Bonjour ${data.firstName},
      </p>

      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #555555;">
        Bonne nouvelle&nbsp;! Votre demande de rendez-vous a &eacute;t&eacute; <strong style="color: #027e7e;">accept&eacute;e</strong> par le professionnel.
      </p>

      <div style="background-color: #e6f4f4; border: 2px solid #027e7e; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
        <h2 style="margin: 0 0 16px; color: #027e7e; font-size: 16px; font-weight: 700;">
          D&eacute;tails du rendez-vous
        </h2>
        ${emailTable(rows)}
      </div>

      <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #555555;">
        Vous pouvez contacter le professionnel via la messagerie si vous avez des questions.
      </p>

      ${emailButton('Voir mes rendez-vous', 'https://neuro-care.fr/dashboard/family/bookings')}

      ${emailSignature()}
    `)}
  `, { preheader: `Rendez-vous confirm\u00e9 avec ${data.educatorName}` });
}
