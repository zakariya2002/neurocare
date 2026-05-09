import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { cancelAppointmentReminders } from '@/lib/appointment-reminders';
import { matchWaitlistOnSlotAvailable } from '@/lib/waitlist-matcher';
import { removeAppointmentFromGoogleCalendar } from '@/lib/google-calendar-sync';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const appointmentId = params.id;
    const { cancelledBy } = await request.json(); // 'family' or 'educator'


    // Récupérer le RDV avec les infos
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        family:family_profiles(id, first_name, last_name, user_id),
        educator:educator_profiles(id, first_name, last_name, user_id)
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Rendez-vous introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur connecté est soit l'éducateur soit la famille du RDV
    const isEducator = appointment.educator && appointment.educator.user_id === session.user.id;
    const isFamily = appointment.family && appointment.family.user_id === session.user.id;

    if (!isEducator && !isFamily) {
      return NextResponse.json(
        { error: 'Non autorisé : vous n\'êtes pas concerné par ce rendez-vous' },
        { status: 403 }
      );
    }

    // Vérifier que le RDV peut être annulé
    if (appointment.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Ce rendez-vous ne peut plus être annulé' },
        { status: 400 }
      );
    }

    // Calculer si on est à moins de 48h du RDV
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLateCancel = hoursUntilAppointment < 48;


    let amountCharged = 0;
    let paymentCaptured = false;

    // Récupérer le PaymentIntent ID stocké sur le RDV
    const paymentIntentId = appointment.payment_intent_id || appointment.stripe_payment_intent_id;

    // Si annulation tardive par la famille, capturer 50%
    if (isLateCancel && cancelledBy === 'family' && appointment.payment_status === 'authorized' && paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const halfAmount = Math.round(paymentIntent.amount / 2);

        await stripe.paymentIntents.capture(paymentIntentId, {
          amount_to_capture: halfAmount,
        });

        amountCharged = halfAmount / 100;
        paymentCaptured = true;
      } catch (stripeError: unknown) {
        // Continuer même si le paiement échoue
      }
    }

    // Si annulation par l'éducateur, annuler le paiement complètement
    if (cancelledBy === 'educator' && appointment.payment_status === 'authorized' && paymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(paymentIntentId);
      } catch (stripeError: unknown) {
        // Continuer même si l'annulation échoue
      }
    }

    // Mettre à jour le statut du RDV
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledBy,
        cancellation_fee: paymentCaptured ? amountCharged * 100 : 0, // En centimes
        payment_status: paymentCaptured ? 'partially_captured' : 'cancelled'
      })
      .eq('id', appointmentId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'annulation' },
        { status: 500 }
      );
    }

    // Annuler les rappels SMS programmés
    try {
      await cancelAppointmentReminders(appointmentId);
    } catch (reminderError) {
      console.error('Erreur annulation rappels SMS:', reminderError);
    }

    // Retirer l'event de Google Calendar de l'éducateur — non-bloquant
    if (appointment.educator?.user_id) {
      removeAppointmentFromGoogleCalendar(appointmentId, appointment.educator.user_id).catch((err) =>
        console.error('Erreur sync Google Calendar (cancel):', err),
      );
    }

    // Notifier les familles en liste d'attente sur le créneau libéré (fire-and-forget)
    if (appointment.educator?.id && appointment.appointment_date && appointment.start_time && appointment.end_time) {
      matchWaitlistOnSlotAvailable({
        educator_id: appointment.educator.id,
        date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
      }).catch((err) => console.error('Waitlist match on cancel error:', err));
    }

    // Envoyer emails de notification
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(appointmentDateTime);

    // Email à la famille
    try {
      const { data: familyUser } = await supabase.auth.admin.getUserById(appointment.family.user_id);
      if (familyUser?.user?.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: familyUser.user.email,
          subject: '❌ Rendez-vous annulé',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">❌ Rendez-vous annulé</h2>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>📅 Date :</strong> ${formattedDate}</p>
                <p><strong>👨‍🏫 Professionnel :</strong> ${escapeHtml(appointment.educator.first_name)} ${escapeHtml(appointment.educator.last_name)}</p>
                <p><strong>Annulé par :</strong> ${cancelledBy === 'family' ? 'Vous' : 'Le professionnel'}</p>
              </div>

              ${paymentCaptured ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0;"><strong>💳 Frais d'annulation :</strong> ${amountCharged.toFixed(2)}€</p>
                <p style="color: #92400e; font-size: 14px; margin: 5px 0 0;">
                  Conformément aux conditions, 50% du montant a été prélevé car l'annulation a eu lieu moins de 48h avant le rendez-vous.
                </p>
              </div>
              ` : `
              <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                <p style="color: #047857; margin: 0;">✅ Aucun frais - Annulation gratuite (plus de 48h avant le RDV)</p>
              </div>
              `}

              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
                NeuroCare - Plateforme de mise en relation
              </p>
            </div>
          `
        });
      }
    } catch (emailError) {
    }

    // Email à l'éducateur
    try {
      const { data: educatorUser } = await supabase.auth.admin.getUserById(appointment.educator.user_id);
      if (educatorUser?.user?.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: educatorUser.user.email,
          subject: '❌ Rendez-vous annulé',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">❌ Rendez-vous annulé</h2>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>📅 Date :</strong> ${formattedDate}</p>
                <p><strong>👨‍👩‍👦 Famille :</strong> ${escapeHtml(appointment.family.first_name)} ${escapeHtml(appointment.family.last_name)}</p>
                <p><strong>Annulé par :</strong> ${cancelledBy === 'family' ? 'La famille' : 'Vous'}</p>
              </div>

              ${paymentCaptured && cancelledBy === 'family' ? `
              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <p style="color: #1e40af; margin: 0;"><strong>💰 Compensation :</strong> ${(amountCharged * 0.88).toFixed(2)}€</p>
                <p style="color: #1e40af; font-size: 14px; margin: 5px 0 0;">
                  La famille a annulé moins de 48h avant. Vous recevrez 50% de la prestation (moins commission).
                </p>
              </div>
              ` : ''}

              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
                NeuroCare - Plateforme de mise en relation
              </p>
            </div>
          `
        });
      }
    } catch (emailError) {
    }

    return NextResponse.json({
      success: true,
      isLateCancel,
      amountCharged,
      message: isLateCancel && cancelledBy === 'family'
        ? `Rendez-vous annulé. Frais d'annulation: ${amountCharged.toFixed(2)}€`
        : 'Rendez-vous annulé sans frais'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'annulation' },
      { status: 500 }
    );
  }
}
