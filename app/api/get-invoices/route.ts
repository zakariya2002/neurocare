import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID requis' },
        { status: 400 }
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
    console.error('❌ Erreur get-invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des factures' },
      { status: 500 }
    );
  }
}
