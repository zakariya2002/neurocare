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

    // Vérifier que l'éducateur existe et appartient à l'utilisateur
    const { data: educator, error: eduError } = await supabase
      .from('educator_profiles')
      .select('id, user_id, first_name, last_name, stripe_account_id')
      .eq('id', educatorId)
      .eq('user_id', userId)
      .single();

    if (eduError || !educator) {
      return NextResponse.json({ error: 'Profil éducateur introuvable' }, { status: 404 });
    }

    // Récupérer l'email de l'utilisateur
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const email = userData?.user?.email;

    if (!email) {
      return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const appUrl = origin.replace(/\/$/, '');

    let accountId = educator.stripe_account_id;

    // Créer le compte Connect si nécessaire
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'FR',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          educator_id: educatorId,
          user_id: userId,
        },
      });

      accountId = account.id;

      // Sauvegarder l'ID du compte Connect
      await supabase
        .from('educator_profiles')
        .update({
          stripe_account_id: accountId,
          stripe_onboarding_started_at: new Date().toISOString(),
        })
        .eq('id', educatorId);
    }

    // Créer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard/educator/payouts?refresh=true`,
      return_url: `${appUrl}/dashboard/educator/payouts?onboarding=complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Erreur Stripe Connect create:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
