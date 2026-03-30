import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateSecurePin } from '@/lib/pin-generator';
import { assertAuth } from '@/lib/assert-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Fonction pour ajouter des heures à une date
function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

// Origines autorisees pour la redirection Stripe
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr',
  'https://neuro-care.fr',
  'https://www.neuro-care.fr',
  'http://localhost:3000',
].map(o => o.replace(/\/$/, ''));

function getSafeAppUrl(request: Request): string {
  const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || '';
  const cleaned = origin.replace(/\/$/, '');
  if (ALLOWED_ORIGINS.includes(cleaned)) {
    return cleaned;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr';
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
    // Verifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

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

    // Utiliser une origine whitelistee pour la redirection Stripe
    const appUrl = getSafeAppUrl(request);

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

    // Récupérer les infos éducateur (incluant le tarif horaire et Stripe Connect)
    const { data: educatorProfile, error: educatorError } = await supabase
      .from('educator_profiles')
      .select('id, first_name, last_name, user_id, hourly_rate, stripe_account_id, stripe_charges_enabled')
      .eq('id', educatorId)
      .single();

    if (educatorError || !educatorProfile) {
      console.error('Éducateur introuvable:', educatorError);
      return NextResponse.json(
        { error: 'Éducateur introuvable' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Valider le prix soumis contre le tarif horaire de l'éducateur × durée
    if (educatorProfile.hourly_rate) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const durationHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
      const expectedPrice = durationHours * educatorProfile.hourly_rate;
      if (Math.abs(price - expectedPrice) > 0.01) {
        return NextResponse.json(
          { error: 'Le prix ne correspond pas au tarif du professionnel' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Créer ou récupérer le customer Stripe pour la famille
    let customerId: string;

    // Chercher un customer existant
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

    // Construire les données payment_intent_data
    const paymentIntentData: Stripe.Checkout.SessionCreateParams['payment_intent_data'] = {
      capture_method: 'manual', // Important : capture manuelle
      metadata: {
        educator_id: educatorId,
        family_id: familyId,
        child_id: childId || '',
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        commission_amount: commissionAmount.toString(),
        educator_amount: educatorAmount.toString(),
      },
    };

    // Si l'éducateur a un compte Stripe Connect actif, ajouter le transfert automatique
    if (educatorProfile.stripe_account_id && educatorProfile.stripe_charges_enabled) {
      paymentIntentData.application_fee_amount = commissionAmount; // 12% pour la plateforme
      paymentIntentData.transfer_data = {
        destination: educatorProfile.stripe_account_id, // 88% vers l'éducateur
      };
    }

    // Créer la session Stripe Checkout avec capture manuelle
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Séance avec ${educatorProfile.first_name} ${educatorProfile.last_name}`,
              description: `Le ${new Date(appointmentDate).toLocaleDateString('fr-FR')} à ${startTime}\n\n✅ Le prélèvement aura lieu uniquement après la séance terminée avec ${educatorProfile.first_name} ${educatorProfile.last_name}.\n\nVous ne serez débité(e) qu'une fois le rendez-vous effectué et validé par l'éducateur.`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: paymentIntentData,
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
      },
      success_url: `${appUrl}/dashboard/family?booking=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/educator/${educatorId}/book-appointment?canceled=true`,
    });

    // Créer le rendez-vous IMMÉDIATEMENT avec statut ACCEPTED
    try {
      // Générer le code PIN
      const pinCode = generateSecurePin();
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
          price: priceInCents, // En centimes
          status: 'accepted', // Automatiquement accepté
          payment_status: 'authorized', // Paiement autorisé (à capturer après la séance)
          payment_intent_id: session.payment_intent as string,
          platform_commission: commissionAmount,
          educator_revenue: educatorAmount,
          pin_code: pinCode,
          pin_code_expires_at: pinExpiresAt.toISOString(),
          pin_code_attempts: 0,
          pin_code_validated: false
        })
        .select()
        .single();

      if (appointmentError) {
        console.error('Erreur création RDV immédiate:', appointmentError);
      } else {
        // Formater la date pour les emails
        const formattedDate = new Intl.DateTimeFormat('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(scheduledDate);

        // Envoyer email à la famille avec le code PIN
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
                  <p style="margin: 5px 0;"><strong>👨‍🏫 Professionnel :</strong> ${escapeHtml(educatorProfile.first_name)} ${escapeHtml(educatorProfile.last_name)}</p>
                  ${address ? `<p style="margin: 5px 0;"><strong>📍 Lieu :</strong> ${escapeHtml(address)}</p>` : ''}
                  ${locationType === 'online' ? '<p style="margin: 5px 0;"><strong>💻 Mode :</strong> En ligne</p>' : ''}
                </div>

                <div style="background: #d1fae5; border-left: 4px solid #027e7e; padding: 20px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #027e7e;">🔐 Votre code PIN</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 15px 0;">
                    <div style="font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #027e7e;">
                      ${pinCode}
                    </div>
                  </div>

                  <div style="margin-top: 15px;">
                    <p style="margin: 10px 0;"><strong>⚠️ IMPORTANT :</strong></p>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                      <li>Donnez ce code au professionnel au <strong>début du rendez-vous</strong></li>
                      <li>Ce code permet de démarrer la séance et déclencher le paiement</li>
                      <li>Ne partagez ce code avec personne d'autre</li>
                      <li>Le code expire 2h après l'heure de début prévue</li>
                    </ul>
                  </div>
                </div>

                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                  <p style="margin: 5px 0; color: #92400e;"><strong>💳 Conditions de paiement :</strong></p>
                  <ul style="margin: 5px 0; padding-left: 20px; color: #92400e; font-size: 14px;">
                    <li>Le paiement est prélevé <strong>uniquement après la réalisation</strong> du RDV</li>
                    <li>Annulation gratuite jusqu'à <strong>48h avant</strong></li>
                    <li>Annulation après 48h : 50% de la prestation sera débité</li>
                  </ul>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${appUrl}/dashboard/family"
                     style="background: #027e7e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Voir mes rendez-vous
                  </a>
                </div>

                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
                  NeuroCare - Plateforme de mise en relation
                </p>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Erreur envoi email famille:', emailError);
        }

        // Envoyer email à l'éducateur (notification de nouveau RDV)
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
                    <p style="margin: 5px 0;"><strong>👨‍👩‍👦 Famille :</strong> ${escapeHtml(familyProfile.first_name)} ${escapeHtml(familyProfile.last_name)}</p>
                    ${address ? `<p style="margin: 5px 0;"><strong>📍 Lieu :</strong> ${escapeHtml(address)}</p>` : ''}
                    ${locationType === 'online' ? '<p style="margin: 5px 0;"><strong>💻 Mode :</strong> En ligne</p>' : ''}
                  </div>

                  <div style="background: #d1fae5; border-left: 4px solid #027e7e; padding: 20px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #027e7e;">🔐 Code PIN requis</h3>
                    <p style="margin: 10px 0;">
                      Au début du rendez-vous, demandez le <strong>code PIN à 4 chiffres</strong> à la famille.
                    </p>
                    <p style="margin: 10px 0;">
                      Ce code permet de :
                    </p>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                      <li>Confirmer la présence de la famille</li>
                      <li>Démarrer officiellement la séance</li>
                      <li>Déclencher le paiement en fin de séance</li>
                    </ul>
                  </div>

                  <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>💰 Rémunération :</strong> ${(price * 0.88).toFixed(2)}€ net</p>
                    <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">
                      (${price.toFixed(2)}€ - 12% commission incluant frais bancaires)
                    </p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl}/dashboard/educator/appointments"
                       style="background: #027e7e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
      }
    } catch (err) {
      console.error('Erreur création RDV:', err);
      // Ne pas bloquer la session de paiement même si la création échoue
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Erreur création session paiement:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session de paiement' },
      { status: 500, headers: corsHeaders }
    );
  }
}
