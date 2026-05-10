/**
 * API Scolarité light (B3') — gestion des acteurs scolaires d'une année.
 *
 * GET  /api/family/children/[id]/scolarite/[yearId]/actors   → liste
 * POST /api/family/children/[id]/scolarite/[yearId]/actors   → crée
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

export async function GET(
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

  const { data, error } = await supabase
    .from('child_school_actors')
    .select('*')
    .eq('child_school_year_id', yearId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ actors: data ?? [] });
}

export async function POST(
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

  const parsed = parseSchoolActorPayload(body);
  if (!parsed) return badRequest('Payload invalide');

  const { data, error } = await supabase
    .from('child_school_actors')
    .insert({
      child_school_year_id: yearId,
      user_id: user.id,
      ...parsed,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ actor: data }, { status: 201 });
}
