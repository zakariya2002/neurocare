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

// ──────────────────────────────────────────────
// GET — List campaigns (or single campaign by ?id=)
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      // Single campaign detail
      const { data: campagne, error: campagneError } = await supabase
        .from('campagnes')
        .select('*')
        .eq('id', id)
        .single();

      if (campagneError || !campagne) {
        return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
      }

      const { data: contacts, error: contactsError } = await supabase
        .from('campagne_contacts')
        .select('id, email, nom, prenom, raison_sociale, status, sent_at')
        .eq('campagne_id', id)
        .order('created_at', { ascending: true });

      if (contactsError) throw contactsError;

      return NextResponse.json({ campagne, contacts: contacts || [] });
    }

    // List all campaigns
    const { data: campagnes, error } = await supabase
      .from('campagnes')
      .select('id, name, segment, subject, status, total_contacts, sent_count, created_at, sent_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ campagnes: campagnes || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Erreur API campagnes GET:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ──────────────────────────────────────────────
// POST — Create a new campaign
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { user, error: authError } = await assertAdmin();
  if (authError) return authError;

  const supabase = getSupabase();

  try {
    const body = await request.json();
    const { name, segment, subject, html_body } = body as {
      name: string;
      segment: string;
      subject: string;
      html_body: string;
    };

    if (!name?.trim() || !segment || !subject?.trim() || !html_body?.trim()) {
      return NextResponse.json(
        { error: 'Champs requis : name, segment, subject, html_body' },
        { status: 400 }
      );
    }

    const validSegments = ['finess', 'anfe', 'sirene'];
    if (!validSegments.includes(segment)) {
      return NextResponse.json(
        { error: `Segment invalide. Valeurs acceptées : ${validSegments.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: campagne, error } = await supabase
      .from('campagnes')
      .insert({
        name: name.trim(),
        segment,
        subject: subject.trim(),
        html_body,
        status: 'draft',
        created_by: user!.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ campagne }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Erreur API campagnes POST:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
