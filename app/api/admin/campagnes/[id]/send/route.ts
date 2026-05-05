import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { assertAdmin } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

// Allow up to 10 minutes for large campaign sends
export const maxDuration = 300;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// POST — Send a campaign to all pending contacts
// ──────────────────────────────────────────────
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  const { id } = await params;

  try {
    // Fetch the campaign
    const { data: campagne, error: campagneError } = await supabase
      .from('campagnes')
      .select('*')
      .eq('id', id)
      .single();

    if (campagneError || !campagne) {
      return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
    }

    if (campagne.status === 'sent') {
      return NextResponse.json({ error: 'Cette campagne a déjà été envoyée' }, { status: 400 });
    }

    if (campagne.status === 'sending') {
      return NextResponse.json({ error: 'Un envoi est déjà en cours pour cette campagne' }, { status: 400 });
    }

    // Fetch all pending contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('campagne_contacts')
      .select('id, email, nom, prenom, raison_sociale')
      .eq('campagne_id', id)
      .eq('status', 'pending');

    if (contactsError) throw contactsError;

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'Aucun contact en attente pour cette campagne' }, { status: 400 });
    }

    // Mark campaign as "sending"
    await supabase
      .from('campagnes')
      .update({ status: 'sending' })
      .eq('id', id);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'NeuroCare <contact@neuro-care.fr>';

    let sent = 0;
    let failed = 0;

    // Unsubscribe footer URL (static mailto for now)
    const unsubscribeUrl = `mailto:unsubscribe@neuro-care.fr?subject=D%C3%A9sabonnement&body=Je%20souhaite%20me%20d%C3%A9sabonner%20de%20la%20liste%20${encodeURIComponent(campagne.segment)}`;

    for (const contact of contacts) {
      // Personalise the HTML: replace unsubscribe placeholder
      const personalizedHtml = campagne.html_body.replace(
        /\{\{unsubscribe_url\}\}/g,
        unsubscribeUrl
      );

      const { error: sendError } = await resend.emails.send({
        from: fromAddress,
        to: [contact.email],
        subject: campagne.subject,
        html: personalizedHtml,
      });

      const contactStatus = sendError ? 'failed' : 'sent';

      // Update contact record
      await supabase
        .from('campagne_contacts')
        .update({
          status: contactStatus,
          sent_at: sendError ? null : new Date().toISOString(),
        })
        .eq('id', contact.id);

      if (sendError) {
        failed++;
        console.error(`Échec envoi à ${contact.email}:`, sendError);
      } else {
        sent++;
      }

      // Update running sent_count on the campaign
      await supabase
        .from('campagnes')
        .update({ sent_count: sent })
        .eq('id', id);

      // Rate-limit: 100ms between sends
      if (contacts.indexOf(contact) < contacts.length - 1) {
        await sleep(100);
      }
    }

    // Mark campaign as fully sent
    await supabase
      .from('campagnes')
      .update({
        status: 'sent',
        sent_count: sent,
        sent_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: contacts.length,
    });
  } catch (error: unknown) {
    // Attempt to reset status to draft on unexpected error
    try {
      const supabaseClient = getSupabase();
      await supabaseClient
        .from('campagnes')
        .update({ status: 'draft' })
        .eq('id', id);
    } catch {
      // Best-effort reset
    }

    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Erreur API campagnes send POST:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
