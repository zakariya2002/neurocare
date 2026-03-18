import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { assertAuth } from '@/lib/assert-admin';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // SECURITY: Require authentication
  const { user, error: authError } = await assertAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID requis' },
        { status: 400 }
      );
    }

    // SECURITY: Verify the Stripe customer belongs to the authenticated user
    const { data: profile } = await supabaseAdmin
      .from('family_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user!.id)
      .single();

    const { data: educatorProfile } = await supabaseAdmin
      .from('educator_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user!.id)
      .single();

    const userCustomerIds = [
      profile?.stripe_customer_id,
      educatorProfile?.stripe_customer_id,
    ].filter(Boolean);

    if (!userCustomerIds.includes(customerId)) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Récupérer les factures du customer depuis Stripe
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 20,
    });

    return NextResponse.json({
      success: true,
      invoices: invoices.data,
    });

  } catch (error: any) {
    console.error('Erreur get-invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des factures' },
      { status: 500 }
    );
  }
}
