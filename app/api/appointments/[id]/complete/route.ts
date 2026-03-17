import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { assertAuth } from '@/lib/assert-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
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

    // Récupérer le RDV avec toutes les infos
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
        { error: 'Seul le professionnel peut compléter ce rendez-vous' },
        { status: 403 }
      );
    }

    // Vérifications de sécurité
    if (!appointment.pin_code_validated) {
      return NextResponse.json(
        {
          error: 'Le code PIN n\'a pas été validé',
          code: 'PIN_NOT_VALIDATED'
        },
        { status: 400 }
      );
    }

    if (appointment.status !== 'accepted') {
      return NextResponse.json(
        {
          error: 'Le rendez-vous doit être accepté',
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    // Vérifier que la séance a été démarrée
    if (!appointment.started_at) {
      return NextResponse.json(
        {
          error: 'La séance n\'a pas été démarrée',
          code: 'SESSION_NOT_STARTED'
        },
        { status: 400 }
      );
    }

    const price = appointment.price || 10000; // 100€ par défaut en centimes
    const commission = Math.round(price * 0.12); // 12% (incluant frais Stripe)
    const educatorAmount = price - commission;

    // Capturer le paiement Stripe si un payment_intent_id existe
    let paymentCaptured = false;
    if (appointment.payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.capture(
          appointment.payment_intent_id
        );

        if (paymentIntent.status === 'succeeded') {
          paymentCaptured = true;

          // Si Stripe Connect : enregistrer le transfert automatique
          if (paymentIntent.transfer_data?.destination) {
            const stripeAccountId = typeof paymentIntent.transfer_data.destination === 'string'
              ? paymentIntent.transfer_data.destination
              : paymentIntent.transfer_data.destination.id;

            try {
              // Stripe crée automatiquement le transfert lors de la capture
              const transfers = await stripe.transfers.list({
                destination: stripeAccountId,
                limit: 1,
              });

              if (transfers.data.length > 0) {
                await supabase.from('stripe_transfers').insert({
                  appointment_id: appointmentId,
                  educator_id: appointment.educator_id,
                  stripe_transfer_id: transfers.data[0].id,
                  stripe_account_id: stripeAccountId,
                  amount: transfers.data[0].amount,
                  status: 'completed',
                });
              }
            } catch (transferError) {
              // Non bloquant : le transfert a eu lieu côté Stripe
              console.error('Erreur enregistrement transfert:', transferError);
            }
          }
        } else {
          console.error('Échec capture paiement:', paymentIntent.status);
        }
      } catch (stripeError: any) {
        console.error('Erreur capture Stripe:', stripeError.message);
        return NextResponse.json(
          { error: 'Erreur lors de la capture du paiement' },
          { status: 500 }
        );
      }
    }

    // Créer ou mettre à jour la transaction
    let { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (!transaction) {
      const { data: newTransaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          appointment_id: appointmentId,
          family_id: appointment.family_id,
          educator_id: appointment.educator_id,
          amount_total: price,
          amount_educator: educatorAmount,
          amount_commission: commission,
          amount_stripe_fees: 0, // Inclus dans la commission de 12%
          payment_intent_id: appointment.payment_intent_id,
          status: paymentCaptured ? 'captured' : 'test',
          payment_status: paymentCaptured ? 'succeeded' : 'test',
          authorized_at: new Date().toISOString(),
          captured_at: paymentCaptured ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Erreur création transaction:', transactionError);
        return NextResponse.json(
          { error: 'Erreur lors de la création de la transaction' },
          { status: 500 }
        );
      }

      transaction = newTransaction;
    } else {
      // Mettre à jour la transaction existante
      const { error: updateTransactionError } = await supabase
        .from('transactions')
        .update({
          status: paymentCaptured ? 'captured' : 'test',
          payment_status: paymentCaptured ? 'succeeded' : 'test',
          captured_at: paymentCaptured ? new Date().toISOString() : null
        })
        .eq('id', transaction.id);

      if (updateTransactionError) {
        console.error('Erreur update transaction:', updateTransactionError);
      }
    }

    // Mettre à jour le RDV
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Erreur update RDV:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du rendez-vous' },
        { status: 500 }
      );
    }

    // Mettre à jour la réputation de l'éducateur
    const { data: reputation } = await supabase
      .from('educator_reputation')
      .select('*')
      .eq('educator_id', appointment.educator_id)
      .single();

    if (reputation) {
      const newValidated = reputation.validated_appointments + 1;
      const newTotal = reputation.total_appointments + 1;

      await supabase
        .from('educator_reputation')
        .update({
          total_appointments: newTotal,
          validated_appointments: newValidated
        })
        .eq('educator_id', appointment.educator_id);
    }

    // Récupérer les emails
    const { data: familyUserData } = await supabase.auth.admin.getUserById(
      appointment.family.user_id
    );
    const familyEmail = familyUserData?.user?.email;

    const { data: educatorUserData } = await supabase.auth.admin.getUserById(
      appointment.educator.user_id
    );
    const educatorEmail = educatorUserData?.user?.email;

    // Envoyer les emails
    const appointmentDateTime = `${appointment.appointment_date}T${appointment.start_time}`;
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(appointmentDateTime));

    // Email famille
    try {
      if (familyEmail) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: familyEmail,
        subject: '✅ Séance terminée - Votre reçu',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">✅ Séance terminée !</h2>

            <p>Bonjour ${appointment.family.first_name},</p>

            <p>Votre séance du ${formattedDate} avec <strong>${appointment.educator.first_name} ${appointment.educator.last_name}</strong> est terminée.</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">💳 Récapitulatif du paiement</h3>
              <p style="margin: 5px 0;"><strong>Montant :</strong> ${(price / 100).toFixed(2)}€</p>
              <p style="margin: 5px 0;"><strong>Durée :</strong> ${appointment.duration || 60} minutes</p>
              <p style="font-size: 14px; color: #6b7280; margin: 10px 0 0 0;">
                Le paiement a été débité de votre carte bancaire.
              </p>
            </div>

            <p>Votre facture sera disponible dans quelques instants dans votre espace famille.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/family"
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Voir mes séances
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
    }

    // Email éducateur
    try {
      if (educatorEmail) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: educatorEmail,
        subject: '💰 Paiement effectué - Séance terminée',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">💰 Paiement effectué !</h2>

            <p>Bonjour ${appointment.educator.first_name},</p>

            <p>Votre séance du ${formattedDate} avec la famille <strong>${appointment.family.first_name} ${appointment.family.last_name}</strong> est terminée et payée.</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">💵 Récapitulatif des revenus</h3>
              <p style="margin: 5px 0;"><strong>Montant séance :</strong> ${(price / 100).toFixed(2)}€</p>
              <p style="margin: 5px 0; color: #ef4444;"><strong>Commission (12% incluant frais) :</strong> -${(commission / 100).toFixed(2)}€</p>
              <p style="margin: 15px 0 5px 0; font-size: 18px; color: #10b981;"><strong>Net à percevoir :</strong> ${(educatorAmount / 100).toFixed(2)}€</p>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              Le virement sera effectué sur votre compte bancaire sous 48h ouvrées.
            </p>

            <p>Votre facture sera disponible dans quelques instants dans votre espace éducateur.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/educator"
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Voir mes revenus
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

    // Générer automatiquement les factures
    try {
      const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const appUrl = origin.replace(/\/$/, '');

      const invoiceResponse = await fetch(`${appUrl}/api/invoices/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: params.id })
      });

      if (!invoiceResponse.ok) {
        const errorText = await invoiceResponse.text();
        console.error('Erreur génération factures (non-bloquant):', errorText);
      }
    } catch (invoiceError) {
      // Ne pas bloquer si la génération de facture échoue
      console.error('Erreur génération factures (non-bloquant):', invoiceError);
    }

    return NextResponse.json({
      success: true,
      message: 'Rendez-vous terminé et paiement effectué',
      transaction: {
        id: transaction.id,
        amount_total: price,
        amount_educator: educatorAmount,
        amount_commission: commission,
        status: 'captured'
      }
    });

  } catch (error: any) {
    console.error('Erreur complétion RDV:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la complétion du rendez-vous' },
      { status: 500 }
    );
  }
}
