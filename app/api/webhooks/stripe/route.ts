import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  sendPaymentConfirmation,
  sendAppointmentConfirmationFamily,
  sendAppointmentNotificationEducator,
} from '@/lib/email-notifications';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Commission NeuroCare sur les rendez-vous (12%)
const PLATFORM_COMMISSION_RATE = 0.12;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ─── PAIEMENTS RENDEZ-VOUS ───
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // ─── REMBOURSEMENTS ───
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    // Log l'erreur mais retourne 200 pour que Stripe ne re-tente pas indéfiniment
    console.error(`Webhook handler error (${event.type}):`, error.message);
    return NextResponse.json({ received: true, error: error.message });
  }
}

// ═══════════════════════════════════════════
// CHECKOUT COMPLETED (rendez-vous)
// ═══════════════════════════════════════════
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.metadata?.appointment_date) {
    await handleAppointmentPayment(session);
  }
}

// ─── PAIEMENT RENDEZ-VOUS ───
async function handleAppointmentPayment(session: Stripe.Checkout.Session) {
  const {
    educator_id,
    family_id,
    appointment_date,
    start_time,
    end_time,
    location_type,
    address,
    family_notes,
  } = session.metadata || {};

  if (!educator_id || !family_id || !appointment_date || !start_time || !end_time) {
    console.error('Metadata manquantes pour le rendez-vous');
    return;
  }

  const paymentIntentId = session.payment_intent as string;
  const totalAmount = session.amount_total || 0; // En centimes

  // Calcul de la commission et du revenu éducateur
  const commissionAmount = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);
  const educatorRevenue = totalAmount - commissionAmount;

  // 1. Créer le rendez-vous
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      educator_id,
      family_id,
      appointment_date,
      start_time,
      end_time,
      location_type: location_type || 'online',
      address: address || null,
      family_notes: family_notes || null,
      price: totalAmount,
      status: 'pending',
      payment_intent_id: paymentIntentId,
      payment_status: 'authorized',
      platform_commission: commissionAmount,
      educator_revenue: educatorRevenue,
    })
    .select()
    .single();

  if (appointmentError) {
    console.error('Erreur création RDV:', appointmentError);
    return;
  }

  // 2. Envoyer les emails de notification
  await sendAppointmentEmails(educator_id, family_id, appointment_date, start_time, totalAmount);
}

// ═══════════════════════════════════════════
// REMBOURSEMENTS
// ═══════════════════════════════════════════
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  // Trouver le rendez-vous lié
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, family_id, educator_id, price')
    .eq('payment_intent_id', paymentIntentId)
    .single();

  if (!appointment) return;

  // Mettre à jour le statut du rendez-vous
  await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      payment_status: 'refunded',
      refunded_at: new Date().toISOString(),
      refund_amount: charge.amount_refunded,
    })
    .eq('id', appointment.id);
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  // Annuler le rendez-vous si le paiement est annulé
  await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      payment_status: 'canceled',
    })
    .eq('payment_intent_id', paymentIntent.id);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Mettre à jour le rendez-vous lié
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, family_id, educator_id')
    .eq('payment_intent_id', paymentIntent.id)
    .single();

  if (!appointment) return;

  await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      payment_status: 'failed',
    })
    .eq('id', appointment.id);

  // Enregistrer la transaction échouée
  await supabase.from('payment_transactions').insert({
    educator_id: appointment.educator_id,
    stripe_payment_intent_id: paymentIntent.id,
    amount: (paymentIntent.amount || 0) / 100,
    currency: 'eur',
    status: 'failed',
    description: `Échec du paiement : ${paymentIntent.last_payment_error?.message || 'Erreur inconnue'}`,
  });
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Envoie les emails de notification après un paiement de rendez-vous.
 */
async function sendAppointmentEmails(
  educatorId: string,
  familyId: string,
  date: string,
  time: string,
  amountCents: number
) {
  try {
    // Récupérer les infos en parallèle
    const [educatorResult, familyResult] = await Promise.all([
      supabase
        .from('educator_profiles')
        .select('first_name, last_name, user_id')
        .eq('id', educatorId)
        .single(),
      supabase
        .from('family_profiles')
        .select('first_name, last_name, user_id')
        .eq('user_id', familyId)
        .single(),
    ]);

    const educator = educatorResult.data;
    const family = familyResult.data;
    if (!educator || !family) return;

    // Récupérer les emails
    const [eduUser, famUser] = await Promise.all([
      supabase.auth.admin.getUserById(educator.user_id),
      supabase.auth.admin.getUserById(family.user_id),
    ]);

    const eduEmail = eduUser.data?.user?.email;
    const famEmail = famUser.data?.user?.email;
    const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const formattedAmount = `${(amountCents / 100).toFixed(2)} €`;

    // Email famille : confirmation paiement
    if (famEmail) {
      await sendPaymentConfirmation(famEmail, {
        name: family.first_name,
        amount: formattedAmount,
        educatorName: `${educator.first_name} ${educator.last_name}`,
        date: formattedDate,
      });
    }

    // Email éducateur : nouvelle demande
    if (eduEmail) {
      await sendAppointmentNotificationEducator(eduEmail, {
        educatorName: educator.first_name,
        familyName: `${family.first_name} ${family.last_name}`,
        date: formattedDate,
        time,
        status: 'new',
      });
    }
  } catch {
    // Ne pas faire échouer le webhook pour les emails
  }
}
