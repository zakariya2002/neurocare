import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Crée un remboursement Stripe pour un rendez-vous annulé.
 */
export async function refundAppointment(
  paymentIntentId: string,
  amount?: number // En centimes. Si absent, remboursement total.
): Promise<{ success: boolean; error?: string }> {
  try {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount ? { amount } : {}),
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
