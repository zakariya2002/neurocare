import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resend = new Resend(process.env.RESEND_API_KEY);

// Fonction pour générer un code PIN sécurisé
function generateSecurePIN(): string {
  const forbidden = [
    '0000', '1111', '2222', '3333', '4444',
    '5555', '6666', '7777', '8888', '9999',
    '1234', '4321', '0123', '9876'
  ];

  let pin: string;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
  } while (forbidden.includes(pin));

  return pin;
}

// Fonction pour ajouter des heures à une date
function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;

    // Récupérer le RDV
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        family:family_profiles(
          id,
          first_name,
          last_name,
          user_id
        ),
        educator:educator_profiles(
          id,
          first_name,
          last_name,
          user_id
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('RDV introuvable:', appointmentError);
      return NextResponse.json(
        { error: 'Rendez-vous introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que le RDV est en attente de validation
    if (appointment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Ce rendez-vous ne peut plus être accepté' },
        { status: 400 }
      );
    }

    // Générer le code PIN
    const pinCode = generateSecurePIN();

    // Créer la date complète du rendez-vous à partir de appointment_date et start_time
    const scheduledDate = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
    const pinExpiresAt = addHours(scheduledDate, 2);

    // Mettre à jour le RDV
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'accepted',
        pin_code: pinCode,
        pin_code_expires_at: pinExpiresAt.toISOString(),
        pin_code_attempts: 0,
        pin_code_validated: false
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Erreur update RDV:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du rendez-vous' },
        { status: 500 }
      );
    }

    // Récupérer l'email de la famille depuis auth.users
    const { data: familyUserData, error: familyUserError } = await supabase.auth.admin.getUserById(
      appointment.family.user_id
    );

    if (familyUserError) console.error('Erreur famille:', familyUserError);

    // Récupérer l'email de l'éducateur depuis auth.users
    const { data: educatorUserData, error: educatorUserError } = await supabase.auth.admin.getUserById(
      appointment.educator.user_id
    );

    if (educatorUserError) console.error('Erreur éducateur:', educatorUserError);

    const familyEmail = familyUserData?.user?.email;
    const educatorEmail = educatorUserData?.user?.email;

    if (!familyEmail) {
      console.error('Aucun email trouvé pour la famille');
    }
    if (!educatorEmail) {
      console.error('Aucun email trouvé pour l\'éducateur');
    }

    // Formater la date pour l'email
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(scheduledDate);

    // Email à la famille avec le code PIN
    try {
      if (familyEmail) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: familyEmail,
        subject: '✅ Rendez-vous confirmé - Votre code PIN',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">✅ Votre rendez-vous est confirmé !</h2>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>📅 Date :</strong> ${formattedDate}</p>
              <p style="margin: 5px 0;"><strong>👨‍🏫 Éducateur :</strong> ${appointment.educator.first_name} ${appointment.educator.last_name}</p>
              ${appointment.address ? `<p style="margin: 5px 0;"><strong>📍 Lieu :</strong> ${appointment.address}</p>` : ''}
              ${appointment.location_type === 'online' ? '<p style="margin: 5px 0;"><strong>💻 Mode :</strong> En ligne</p>' : ''}
            </div>

            <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">🔐 Votre code PIN</h3>
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 15px 0;">
                <div style="font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #2563eb;">
                  ${pinCode}
                </div>
              </div>

              <div style="margin-top: 15px;">
                <p style="margin: 10px 0;"><strong>⚠️ IMPORTANT :</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  <li>Donnez ce code à l'éducateur au <strong>début du rendez-vous</strong></li>
                  <li>Ce code permet de démarrer la séance et déclencher le paiement</li>
                  <li>Ne partagez ce code avec personne d'autre</li>
                  <li>Le code expire 2h après l'heure de début prévue</li>
                </ul>
              </div>
            </div>

            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              ${appointment.price ? `<p style="margin: 5px 0;"><strong>💳 Paiement :</strong> ${appointment.price}€</p>` : ''}
              <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">
                Le paiement sera débité automatiquement en fin de séance
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/family"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Voir mes rendez-vous
              </a>
            </div>

            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
              NeuroCare - Plateforme de mise en relation
            </p>
          </div>
        `
        });
      }
    } catch (emailError) {
      console.error('Erreur envoi email famille:', emailError);
      // On continue même si l'email échoue
    }

    // Email à l'éducateur (SANS le code PIN)
    try {
      if (educatorEmail) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: educatorEmail,
        subject: '🎉 Nouveau rendez-vous confirmé',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">🎉 Vous avez confirmé un nouveau rendez-vous !</h2>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>📅 Date :</strong> ${formattedDate}</p>
              <p style="margin: 5px 0;"><strong>👨‍👩‍👦 Famille :</strong> ${appointment.family.first_name} ${appointment.family.last_name}</p>
              ${appointment.address ? `<p style="margin: 5px 0;"><strong>📍 Lieu :</strong> ${appointment.address}</p>` : ''}
              ${appointment.location_type === 'online' ? '<p style="margin: 5px 0;"><strong>💻 Mode :</strong> En ligne</p>' : ''}
            </div>

            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #047857;">🔐 Code PIN requis</h3>
              <p style="margin: 10px 0;">
                Au début du rendez-vous, demandez le <strong>code PIN à 4 chiffres</strong> à la famille.
              </p>
              <p style="margin: 10px 0;">
                Ce code permet de :
              </p>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Confirmer votre présence</li>
                <li>Démarrer officiellement la séance</li>
                <li>Déclencher le paiement en fin de séance</li>
              </ul>
            </div>

            ${appointment.price ? `
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>💰 Rémunération :</strong> ${(appointment.price * 0.88).toFixed(2)}€ net</p>
              <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">
                (${appointment.price}€ - 12% commission incluant frais bancaires)
              </p>
              <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">
                Virement sous 48h après la séance
              </p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/educator/appointments"
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Voir mes rendez-vous
              </a>
            </div>

            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
              NeuroCare - Plateforme de mise en relation
            </p>
          </div>
        `
        });
      }
    } catch (emailError) {
      console.error('Erreur envoi email éducateur:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Rendez-vous confirmé avec succès',
      pinCode: pinCode, // Pour debug uniquement, à retirer en prod
      expiresAt: pinExpiresAt
    });

  } catch (error: any) {
    console.error('Erreur acceptation RDV:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'acceptation du rendez-vous' },
      { status: 500 }
    );
  }
}
