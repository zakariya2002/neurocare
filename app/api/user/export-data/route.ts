import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * RGPD — Export de toutes les données personnelles d'un utilisateur.
 * Retourne un JSON avec toutes les données liées à l'utilisateur authentifié.
 */
export async function GET() {
  const { user, error } = await assertAuth();
  if (error) return error;

  try {
    const userId = user!.id;
    const role = user!.role;
    const exportData: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      email: user!.email,
      role,
    };

    // Profil
    if (role === 'educator') {
      const { data: profile } = await supabaseAdmin
        .from('educator_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      exportData.profile = profile;

      // Certifications
      const { data: certs } = await supabaseAdmin
        .from('certifications')
        .select('*')
        .eq('educator_id', userId);
      exportData.certifications = certs;

      // Rendez-vous
      const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('educator_id', userId);
      exportData.appointments = appointments;

      // Avis reçus
      const { data: reviews } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('educator_id', userId);
      exportData.reviews = reviews;

      // Factures
      const { data: invoices } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('educator_id', userId);
      exportData.invoices = invoices;

      // Abonnements — legacy : plus d'offre payante depuis 2025 (100 % gratuit + commission 12 %)
      exportData.subscriptions = [];
      exportData.subscriptions_note =
        'Aucun abonnement actif — modèle 100% gratuit depuis 2025';

      // Transactions de paiement (liées aux paiements de rendez-vous)
      const { data: transactions } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('educator_id', userId);
      exportData.payment_transactions = transactions;
    } else if (role === 'family') {
      const { data: profile } = await supabaseAdmin
        .from('family_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      exportData.profile = profile;

      // Rendez-vous
      const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('family_id', userId);
      exportData.appointments = appointments;

      // Avis donnés
      const { data: reviews } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('family_id', userId);
      exportData.reviews = reviews;

      // Favoris
      const { data: favorites } = await supabaseAdmin
        .from('favorite_educators')
        .select('*')
        .eq('family_id', userId);
      exportData.favorites = favorites;
    }

    // Messages envoyés et reçus (communs aux deux rôles)
    const { data: messagesSent } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('sender_id', userId);
    exportData.messages_sent = messagesSent;

    // Conversations
    const { data: conversations } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .or(`family_id.eq.${userId},educator_id.eq.${userId}`);
    exportData.conversations = conversations;

    // Newsletter
    if (user!.email) {
      const { data: newsletter } = await supabaseAdmin
        .from('newsletter_subscribers')
        .select('*')
        .eq('email', user!.email);
      exportData.newsletter = newsletter;
    }

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="neurocare-export-${userId}.json"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Export data error:', err);
    return NextResponse.json({ error: 'Erreur lors de l\'export' }, { status: 500 });
  }
}
