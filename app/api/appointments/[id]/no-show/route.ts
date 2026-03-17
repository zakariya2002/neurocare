import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { assertAuth } from '@/lib/assert-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const appointmentId = params.id;

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

    // Vérifier que l'utilisateur est l'éducateur de ce RDV
    const { data: educatorProfile } = await supabase
      .from('educator_profiles')
      .select('id')
      .eq('user_id', user!.id)
      .single();

    if (!educatorProfile || educatorProfile.id !== appointment.educator_id) {
      return NextResponse.json(
        { error: 'Seul le professionnel peut signaler une absence' },
        { status: 403 }
      );
    }

    // Vérifier que le RDV est bien "accepted" et pas déjà traité
    if (appointment.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Ce rendez-vous ne peut pas être marqué comme no-show' },
        { status: 400 }
      );
    }

    // Vérifier qu'on est bien après l'heure de début + 1h (tolérance)
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
    const now = new Date();
    const oneHourAfterStart = new Date(appointmentDateTime.getTime() + 60 * 60 * 1000);

    if (now < oneHourAfterStart) {
      const minutesRemaining = Math.ceil((oneHourAfterStart.getTime() - now.getTime()) / (1000 * 60));
      return NextResponse.json(
        {
          error: `Vous devez attendre encore ${minutesRemaining} minutes avant de signaler une absence`,
          canReportAt: oneHourAfterStart.toISOString()
        },
        { status: 400 }
      );
    }

    let amountCharged = 0;
    let paymentCaptured = false;

    // Récupérer le PaymentIntent ID stocké sur le RDV
    const paymentIntentId = appointment.payment_intent_id || appointment.stripe_payment_intent_id;

    // Capturer 50% du paiement
    if (appointment.payment_status === 'authorized' && paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const halfAmount = Math.round(paymentIntent.amount / 2);

        await stripe.paymentIntents.capture(paymentIntentId, {
          amount_to_capture: halfAmount,
        });

        amountCharged = halfAmount / 100;
        paymentCaptured = true;
      } catch (stripeError: unknown) {
        console.error('Erreur Stripe capture:', stripeError instanceof Error ? stripeError.message : stripeError);
      }
    }

    // Mettre à jour le statut du RDV
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'no_show',
        no_show_reported_at: new Date().toISOString(),
        cancellation_fee: paymentCaptured ? amountCharged * 100 : 0,
        payment_status: paymentCaptured ? 'partially_captured' : appointment.payment_status
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Erreur update:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    // Formater la date pour les emails
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
          subject: '⚠️ Absence signalée - Rendez-vous manqué',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">⚠️ Absence signalée</h2>

              <p>Le professionnel a signalé votre absence au rendez-vous suivant :</p>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>📅 Date :</strong> ${formattedDate}</p>
                <p><strong>👨‍🏫 Professionnel :</strong> ${appointment.educator.first_name} ${appointment.educator.last_name}</p>
              </div>

              ${paymentCaptured ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0;"><strong>💳 Frais de no-show :</strong> ${amountCharged.toFixed(2)}€</p>
                <p style="color: #92400e; font-size: 14px; margin: 5px 0 0;">
                  Conformément aux conditions, 50% du montant a été prélevé suite à votre absence.
                </p>
              </div>
              ` : ''}

              <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <p style="color: #991b1b; margin: 0;">
                  Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.
                </p>
              </div>

              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">
                NeuroCare - Plateforme de mise en relation
              </p>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Erreur email famille:', emailError);
    }

    // Email de confirmation à l'éducateur
    try {
      const { data: educatorUser } = await supabase.auth.admin.getUserById(appointment.educator.user_id);
      if (educatorUser?.user?.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: educatorUser.user.email,
          subject: '✅ Absence confirmée - Compensation versée',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #027e7e;">✅ Absence enregistrée</h2>

              <p>L'absence de la famille a été enregistrée pour le rendez-vous :</p>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>📅 Date :</strong> ${formattedDate}</p>
                <p><strong>👨‍👩‍👦 Famille :</strong> ${appointment.family.first_name} ${appointment.family.last_name}</p>
              </div>

              ${paymentCaptured ? `
              <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                <p style="color: #047857; margin: 0;"><strong>💰 Compensation :</strong> ${(amountCharged * 0.88).toFixed(2)}€</p>
                <p style="color: #047857; font-size: 14px; margin: 5px 0 0;">
                  Vous recevrez 50% de la prestation (moins commission) en compensation de l'absence.
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
      console.error('Erreur email éducateur:', emailError);
    }

    return NextResponse.json({
      success: true,
      amountCharged,
      educatorCompensation: amountCharged * 0.88,
      message: `Absence enregistrée. Compensation: ${(amountCharged * 0.88).toFixed(2)}€`
    });

  } catch (error: any) {
    console.error('Erreur no-show:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du signalement' },
      { status: 500 }
    );
  }
}
