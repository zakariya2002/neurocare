/**
 * API Médicaments d'un enfant (B1 — journalBord, HDS).
 *
 * GET    /api/family/children/[id]/medications      → liste des médicaments
 * POST   /api/family/children/[id]/medications      → ajout
 *
 * Sécurité : feature flag, auth obligatoire, vérifie que l'enfant appartient
 * à l'utilisateur côté schema public AVANT toute écriture côté health.*.
 * RLS Postgres garde-fou en plus.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import {
  createServerSupabasePublic,
  createServerSupabaseHealth,
} from '@/lib/supabase-server-helpers';
import { parseMedicationPayload } from '@/lib/family/journal';

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

async function ensureChildOwnedByUser(
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
  if (!FEATURES.journalBord) return notFoundJson();
  const { id: childId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  const owned = await ensureChildOwnedByUser(sbPublic, user.id, childId);
  if (!owned) return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 });

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_medications')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ medications: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURES.journalBord) return notFoundJson();
  const { id: childId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  const owned = await ensureChildOwnedByUser(sbPublic, user.id, childId);
  if (!owned) return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('JSON invalide');
  }
  const parsed = parseMedicationPayload(body);
  if (!parsed) return badRequest('Payload invalide');

  const sbHealth = createServerSupabaseHealth({ cookieStore });
  const { data, error } = await sbHealth
    .from('child_medications')
    .insert({
      child_id: childId,
      user_id: user.id,
      ...parsed,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ medication: data }, { status: 201 });
}
