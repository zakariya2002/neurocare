import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
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

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const {
      educatorId,
      familyId,
      childId,
      appointmentDate,
      startTime,
      endTime,
      locationType,
      address,
      familyNotes,
      price
    } = await request.json();

    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const appUrl = origin.replace(/\/$/, '');

    // Valider les données
    if (!educatorId || !familyId || !appointmentDate || !startTime || !endTime || !price) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Récupérer les infos famille
    const { data: familyProfile, error: familyError } = await supabase
      .from('family_profiles')
      .select('id, first_name, last_name, user_id')
      .eq('id', familyId)
      .single();

    if (familyError || !familyProfile) {
      console.error('Famille introuvable:', familyError);
      return NextResponse.json(
        { error: 'Famille introuvable' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Récupérer l'email de la famille
    const { data: familyUserData } = await supabase.auth.admin.getUserById(
      familyProfile.user_id
    );
    const familyEmail = familyUserData?.user?.email;

    if (!familyEmail) {
      return NextResponse.json(
        { error: 'Email famille introuvable' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Récupérer les infos éducateur
    const { data: educatorProfile, error: educatorError } = await supabase
      .from('educator_profiles')
      .select('id, first_name, last_name, user_id')
      .eq('id', educatorId)
      .single();

    if (educatorError || !educatorProfile) {
      console.error('Éducateur introuvable:', educatorError);
      return NextResponse.json(
        { error: 'Éducateur introuvable' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Créer ou récupérer le customer Stripe pour la famille
    let customerId: string;

    const customers = await stripe.customers.list({
      email: familyEmail,
      limit: 1
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: familyEmail,
        metadata: {
          family_id: familyId,
          user_id: familyProfile.user_id,
        },
      });
      customerId = customer.id;
    }

    // Calculer les montants (en centimes) — Commission NeuroCare 12%
    const priceInCents = Math.round(price * 100);
    const commissionAmount = Math.round(priceInCents * 0.12); // 12% (incluant frais Stripe)
    const educatorAmount = priceInCents - commissionAmount;

    // Créer un PaymentIntent avec capture manuelle (pour le SDK mobile natif)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceInCents,
      currency: 'eur',
      customer: customerId,
      capture_method: 'manual', // Important : capture manuelle après la séance
      metadata: {
        educator_id: educatorId,
        family_id: familyId,
        child_id: childId || '',
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        location_type: locationType,
        address: address || '',
        family_notes: familyNotes || '',
        commission_amount: commissionAmount.toString(),
        educator_amount: educatorAmount.toString(),
        source: 'mobile_app',
      },
      description: `Séance avec ${educatorProfile.first_name} ${educatorProfile.last_name} le ${new Date(appointmentDate).toLocaleDateString('fr-FR')} à ${startTime}`,
    });

    // Créer une clé éphémère pour le customer (nécessaire pour le Payment Sheet)
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-04-10' }
    );

    // Créer le rendez-vous IMMÉDIATEMENT avec statut PENDING (en attendant la confirmation du paiement)
    // Le webhook confirmera le paiement et passera le statut à ACCEPTED
    try {
      const pinCode = generateSecurePIN();
      const scheduledDate = new Date(`${appointmentDate}T${startTime}`);
      const pinExpiresAt = addHours(scheduledDate, 2);

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          educator_id: educatorId,
          family_id: familyId,
          child_id: childId || null,
          appointment_date: appointmentDate,
          start_time: startTime,
          end_time: endTime,
          location_type: locationType,
          address: address || null,
          family_notes: familyNotes || null,
          price: priceInCents,
          status: 'accepted', // Accepté directement
          payment_status: 'authorized',
          pin_code: pinCode,
          pin_code_expires_at: pinExpiresAt.toISOString(),
          pin_code_attempts: 0,
          pin_code_validated: false,
          stripe_payment_intent_id: paymentIntent.id,
        })
        .select()
        .single();

      if (appointmentError) {
        console.error('Erreur création RDV:', appointmentError);
      } else {
        // Envoyer les emails (même logique que l'endpoint web)
        const formattedDate = new Intl.DateTimeFormat('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(scheduledDate);

        // Email à la famille
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: familyEmail,
            subject: '✅ Rendez-vous confirmé - Votre code PIN',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #027e7e;">✅ Votre rendez-vous est confirmé !</h2>

                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>📅 Date :</strong> ${formattedDate}</p>
                  <p style="margin: 5px 0;"><strong>👨‍🏫 Professionnel :</strong> ${educatorProfile.first_name} ${educatorProfile.last_name}</p>
                  ${address ? `<p style="margin: 5px 0;"><strong>📍 Lieu :</strong> ${address}</p>` : ''}
                  ${locationType === 'online' ? '<p style="margin: 5px 0;"><strong>💻 Mode :</strong> En ligne</p>' : ''}
                </div>

                <div style="background: #d1fae5; border-left: 4px solid #027e7e; padding: 20px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #027e7e;">🔐 Votre code PIN</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 15px 0;">
                    <div style="font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #027e7e;">
                      ${pinCode}
                    </div>
                  </div>
                  <p style="margin: 10px 0;"><strong>⚠️ IMPORTANT :</strong> Donnez ce code au professionnel au début du rendez-vous.</p>
                </div>

                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
                  NeuroCare - Réservé depuis l'application mobile
                </p>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Erreur envoi email famille:', emailError);
        }

        // Email à l'éducateur
        try {
          const { data: educatorUserData } = await supabase.auth.admin.getUserById(
            educatorProfile.user_id
          );
          const educatorEmail = educatorUserData?.user?.email;

          if (educatorEmail) {
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL!,
              to: educatorEmail,
              subject: '🎉 Nouveau rendez-vous confirmé',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #027e7e;">🎉 Nouveau rendez-vous !</h2>

                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>📅 Date :</strong> ${formattedDate}</p>
                    <p style="margin: 5px 0;"><strong>👨‍👩‍👦 Famille :</strong> ${familyProfile.first_name} ${familyProfile.last_name}</p>
                    ${address ? `<p style="margin: 5px 0;"><strong>📍 Lieu :</strong> ${address}</p>` : ''}
                  </div>

                  <div style="background: #d1fae5; border-left: 4px solid #027e7e; padding: 20px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #027e7e;">🔐 Code PIN requis</h3>
                    <p>Demandez le code PIN à 4 chiffres à la famille au début du rendez-vous.</p>
                  </div>

                  <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
                    NeuroCare - Réservé depuis l'application mobile
                  </p>
                </div>
              `
            });
          }
        } catch (emailError) {
          console.error('Erreur envoi email éducateur:', emailError);
        }
      }
    } catch (err) {
      console.error('Erreur création RDV:', err);
    }

    // Retourner les informations nécessaires pour le Payment Sheet natif
    return NextResponse.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Erreur création PaymentIntent mobile:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du paiement' },
      { status: 500, headers: corsHeaders }
    );
  }
}
