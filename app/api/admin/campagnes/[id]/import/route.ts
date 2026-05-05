import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface ContactInput {
  email: string;
  nom?: string;
  prenom?: string;
  raison_sociale?: string;
  metier?: string;
}

// ──────────────────────────────────────────────
// POST — Import contacts into a campaign (upsert)
// ──────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  const { id } = await params;

  try {
    // Validate campaign exists and is not already sent
    const { data: campagne, error: campagneError } = await supabase
      .from('campagnes')
      .select('id, status')
      .eq('id', id)
      .single();

    if (campagneError || !campagne) {
      return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
    }

    if (campagne.status === 'sent') {
      return NextResponse.json(
        { error: 'Impossible d\'importer des contacts dans une campagne déjà envoyée' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { contacts } = body as { contacts: ContactInput[] };

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'Le champ "contacts" doit être un tableau non vide' },
        { status: 400 }
      );
    }

    // Validate and sanitize each contact
    const validContacts: ContactInput[] = [];
    const invalidRows: number[] = [];

    contacts.forEach((c, i) => {
      if (!c.email || typeof c.email !== 'string' || !c.email.includes('@')) {
        invalidRows.push(i);
      } else {
        validContacts.push({
          email: c.email.trim().toLowerCase(),
          nom: c.nom?.trim() || undefined,
          prenom: c.prenom?.trim() || undefined,
          raison_sociale: c.raison_sociale?.trim() || undefined,
          metier: c.metier?.trim() || undefined,
        });
      }
    });

    if (validContacts.length === 0) {
      return NextResponse.json(
        { error: 'Aucun contact valide (chaque entrée doit avoir un champ "email" valide)' },
        { status: 400 }
      );
    }

    // Upsert contacts (ignore duplicates by campagne_id + email)
    const rows = validContacts.map((c) => ({
      campagne_id: id,
      email: c.email,
      nom: c.nom || null,
      prenom: c.prenom || null,
      raison_sociale: c.raison_sociale || null,
      metier: c.metier || null,
      status: 'pending',
    }));

    const { error: upsertError } = await supabase
      .from('campagne_contacts')
      .upsert(rows, {
        onConflict: 'campagne_id,email',
        ignoreDuplicates: true,
      });

    if (upsertError) throw upsertError;

    // Update total_contacts count on the campaign
    const { count } = await supabase
      .from('campagne_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('campagne_id', id);

    await supabase
      .from('campagnes')
      .update({ total_contacts: count || 0 })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      count: validContacts.length,
      skipped_invalid: invalidRows.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Erreur API campagnes import POST:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
