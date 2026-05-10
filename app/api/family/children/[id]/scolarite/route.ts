/**
 * API Scolarité light (B3') — gestion des années scolaires d'un enfant.
 *
 * GET    /api/family/children/[id]/scolarite             → liste des années
 * POST   /api/family/children/[id]/scolarite             → crée une année
 *   body : payload year (cf. parseSchoolYearPayload)
 *
 * Sécurité :
 * - feature flag scolarite → 404 sinon
 * - auth obligatoire (cookie session)
 * - vérifie que l'enfant appartient à l'utilisateur via family_profiles
 * - écriture via le client serveur (RLS Postgres garde-fou)
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

async function ensureChildBelongsToUser(
  supabase: ReturnType<typeof createServerSupabasePublic>,
  userId: string,
  childId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('child_profiles')
    .select('id, family_id, family_profiles:family_id (user_id)')
    .eq('id', childId)
    .maybeSingle();

  if (error || !data) return false;
  const fp = (data as any).family_profiles;
  const owner = Array.isArray(fp) ? fp[0]?.user_id : fp?.user_id;
  return owner === userId;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURES.scolarite) return notFoundJson();

  const { id: childId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const ok = await ensureChildBelongsToUser(supabase, user.id, childId);
  if (!ok) return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 });

  const { data, error } = await supabase
    .from('child_school_year')
    .select('*')
    .eq('child_id', childId)
    .order('school_year', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ years: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURES.scolarite) return notFoundJson();

  const { id: childId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const ok = await ensureChildBelongsToUser(supabase, user.id, childId);
  if (!ok) return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 });

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
    .insert({
      child_id: childId,
      user_id: user.id,
      ...parsed,
    })
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

  return NextResponse.json({ year: data }, { status: 201 });
}
