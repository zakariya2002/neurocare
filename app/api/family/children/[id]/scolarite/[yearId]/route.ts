/**
 * API Scolarité light (B3') — édition / suppression d'une année scolaire.
 *
 * PATCH  /api/family/children/[id]/scolarite/[yearId]    → met à jour
 * DELETE /api/family/children/[id]/scolarite/[yearId]    → supprime
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import { parseSchoolYearPayload } from '@/lib/family/scolarite';

export const dynamic = 'force-dynamic';

function notFoundJson() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

async function ensureYearBelongsToUserAndChild(
  supabase: ReturnType<typeof createServerSupabasePublic>,
  userId: string,
  childId: string,
  yearId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('child_school_year')
    .select('id, child_id, user_id')
    .eq('id', yearId)
    .maybeSingle();

  if (error || !data) return false;
  return data.user_id === userId && data.child_id === childId;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; yearId: string }> }
) {
  if (!FEATURES.scolarite) return notFoundJson();

  const { id: childId, yearId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const ok = await ensureYearBelongsToUserAndChild(supabase, user.id, childId, yearId);
  if (!ok) return NextResponse.json({ error: 'Année introuvable' }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('JSON invalide');
  }

  const parsed = parseSchoolYearPayload(body);
  if (!parsed) return badRequest('Payload invalide');

  const { data, error } = await supabase
    .from('child_school_year')
    .update(parsed)
    .eq('id', yearId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Cette année scolaire existe déjà pour cet enfant.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ year: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; yearId: string }> }
) {
  if (!FEATURES.scolarite) return notFoundJson();

  const { id: childId, yearId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const ok = await ensureYearBelongsToUserAndChild(supabase, user.id, childId, yearId);
  if (!ok) return NextResponse.json({ error: 'Année introuvable' }, { status: 404 });

  const { error } = await supabase
    .from('child_school_year')
    .delete()
    .eq('id', yearId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
