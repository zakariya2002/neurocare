import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { educatorId, userId } = await request.json();

    if (!educatorId || !userId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Vérifier que l'éducateur appartient à l'utilisateur
    const { data: educator, error: eduError } = await supabase
      .from('educator_profiles')
      .select('id, user_id, stripe_account_id, stripe_onboarding_complete, stripe_payouts_enabled, stripe_charges_enabled, stripe_onboarding_completed_at')
      .eq('id', educatorId)
      .eq('user_id', userId)
      .single();

    if (eduError || !educator) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    // Pas de compte Connect
    if (!educator.stripe_account_id) {
      return NextResponse.json({
        status: 'not_started',
        payouts_enabled: false,
        charges_enabled: false,
        details_submitted: false,
      });
    }

    // Récupérer le statut depuis Stripe
    const account = await stripe.accounts.retrieve(educator.stripe_account_id);

    // Mettre à jour le profil avec les données Stripe actuelles
    const updates: Record<string, any> = {
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_charges_enabled: account.charges_enabled,
      stripe_onboarding_complete: account.details_submitted,
    };

    if (account.details_submitted && !educator.stripe_onboarding_completed_at) {
      updates.stripe_onboarding_completed_at = new Date().toISOString();
    }

    await supabase
      .from('educator_profiles')
      .update(updates)
      .eq('id', educatorId);

    let status = 'not_started';
    if (account.details_submitted && account.payouts_enabled) {
      status = 'active';
    } else if (account.details_submitted) {
      status = 'pending_verification';
    } else {
      status = 'onboarding_incomplete';
    }

    return NextResponse.json({
      status,
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
    });
  } catch (error: any) {
    console.error('Erreur Stripe Connect status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut de paiement.' },
      { status: 500 }
    );
  }
}
