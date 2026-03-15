import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Erreur vérification webhook Connect:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Webhook Connect handler error (${event.type}):`, error.message);
    return NextResponse.json({ received: true, error: error.message });
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const stripeAccountId = account.id;

  // Trouver l'éducateur par son stripe_account_id
  const { data: educator, error } = await supabase
    .from('educator_profiles')
    .select('id')
    .eq('stripe_account_id', stripeAccountId)
    .single();

  if (error || !educator) {
    console.error('Éducateur non trouvé pour le compte Stripe:', stripeAccountId);
    return;
  }

  // Mettre à jour le statut
  const updates: Record<string, any> = {
    stripe_payouts_enabled: account.payouts_enabled,
    stripe_charges_enabled: account.charges_enabled,
    stripe_onboarding_complete: account.details_submitted,
  };

  // Marquer la date de complétion si première fois
  if (account.details_submitted) {
    const { data: current } = await supabase
      .from('educator_profiles')
      .select('stripe_onboarding_completed_at')
      .eq('id', educator.id)
      .single();

    if (current && !current.stripe_onboarding_completed_at) {
      updates.stripe_onboarding_completed_at = new Date().toISOString();
    }
  }

  await supabase
    .from('educator_profiles')
    .update(updates)
    .eq('id', educator.id);
}
