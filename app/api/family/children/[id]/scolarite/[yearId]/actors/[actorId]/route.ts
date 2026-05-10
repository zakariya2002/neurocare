/**
 * API Scolarité light (B3') — édition / suppression d'un acteur scolaire.
 *
 * PATCH  /api/family/children/[id]/scolarite/[yearId]/actors/[actorId]
 * DELETE /api/family/children/[id]/scolarite/[yearId]/actors/[actorId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import { parseSchoolActorPayload } from '@/lib/family/scolarite';

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

async function ensureActorBelongsToUser(
  supabase: ReturnType<typeof createServerSupabasePublic>,
  userId: string,
  yearId: string,
  actorId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('child_school_actors')
    .select('id, child_school_year_id, user_id')
    .eq('id', actorId)
    .maybeSingle();

  if (error || !data) return false;
  return data.user_id === userId && data.child_school_year_id === yearId;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; yearId: string; actorId: string }> }
) {
  if (!FEATURES.scolarite) return notFoundJson();

  const { yearId, actorId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const ok = await ensureActorBelongsToUser(supabase, user.id, yearId, actorId);
  if (!ok) return NextResponse.json({ error: 'Acteur introuvable' }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('JSON invalide');
  }

  const parsed = parseSchoolActorPayload(body);
  if (!parsed) return badRequest('Payload invalide');

  const { data, error } = await supabase
    .from('child_school_actors')
    .update(parsed)
    .eq('id', actorId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ actor: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; yearId: string; actorId: string }> }
) {
  if (!FEATURES.scolarite) return notFoundJson();

  const { yearId, actorId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const ok = await ensureActorBelongsToUser(supabase, user.id, yearId, actorId);
  if (!ok) return NextResponse.json({ error: 'Acteur introuvable' }, { status: 404 });

  const { error } = await supabase
    .from('child_school_actors')
    .delete()
    .eq('id', actorId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
