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
      .select('id, user_id, stripe_account_id, stripe_onboarding_complete')
      .eq('id', educatorId)
      .eq('user_id', userId)
      .single();

    if (eduError || !educator) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    if (!educator.stripe_account_id) {
      return NextResponse.json({ error: 'Compte Stripe non configuré' }, { status: 400 });
    }

    // Si onboarding terminé → lien vers le dashboard Express
    if (educator.stripe_onboarding_complete) {
      const loginLink = await stripe.accounts.createLoginLink(educator.stripe_account_id);
      return NextResponse.json({ url: loginLink.url });
    }

    // Sinon → nouveau lien d'onboarding
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const appUrl = origin.replace(/\/$/, '');

    const accountLink = await stripe.accountLinks.create({
      account: educator.stripe_account_id,
      refresh_url: `${appUrl}/dashboard/educator/payouts?refresh=true`,
      return_url: `${appUrl}/dashboard/educator/payouts?onboarding=complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Erreur Stripe Connect dashboard-link:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
