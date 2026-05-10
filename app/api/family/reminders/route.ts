/**
 * API Rappels MDPH (A2) — CRUD utilisateur.
 *
 * GET    /api/family/reminders          → liste tous les rappels du user
 * POST   /api/family/reminders          → crée un rappel
 * PATCH  /api/family/reminders          → met à jour (dismiss / undismiss / edit)
 * DELETE /api/family/reminders?id=...   → supprime un rappel
 *
 * Sécurité :
 * - feature flag rappelsMdph → 404 sinon
 * - auth obligatoire (cookie session)
 * - vérifie que child_id appartient au user via family_profiles
 * - écritures via le client serveur respectant le RLS
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import {
  parseReminderInput,
  REMINDER_TYPES,
  type FamilyAdminReminderRow,
  type ReminderType,
} from '@/lib/family/reminders-mdph';

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

export async function GET(_request: NextRequest) {
  if (!FEATURES.rappelsMdph) return notFoundJson();

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from('family_admin_reminders')
    .select('*')
    .eq('user_id', user.id)
    .order('expires_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    reminders: (data as FamilyAdminReminderRow[]) ?? [],
  });
}

export async function POST(request: NextRequest) {
  if (!FEATURES.rappelsMdph) return notFoundJson();

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest('JSON invalide'); }

  const parsed = parseReminderInput(body);
  if (!parsed.ok) return badRequest(parsed.error);

  const ok = await ensureChildBelongsToUser(supabase, user.id, parsed.value.child_id);
  if (!ok) return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 });

  const { data, error } = await supabase
    .from('family_admin_reminders')
    .insert({
      user_id: user.id,
      child_id: parsed.value.child_id,
      type: parsed.value.type,
      expires_at: parsed.value.expires_at,
      label: parsed.value.label,
      notes: parsed.value.notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reminder: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!FEATURES.rappelsMdph) return notFoundJson();

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest('JSON invalide'); }
  const o = (body && typeof body === 'object') ? body as Record<string, unknown> : null;
  if (!o) return badRequest('Body invalide');

  const id = typeof o.id === 'string' ? o.id : null;
  if (!id) return badRequest('id manquant');

  const action = typeof o.action === 'string' ? o.action : null;

  // Vérifier que l'utilisateur possède bien ce rappel (le RLS le ferait aussi
  // mais on veut un 404 explicite pour éviter le 0 rows updated silencieux).
  const { data: existing, error: existingErr } = await supabase
    .from('family_admin_reminders')
    .select('id, child_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Rappel introuvable' }, { status: 404 });

  if (action === 'dismiss') {
    const { data, error } = await supabase
      .from('family_admin_reminders')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reminder: data });
  }

  if (action === 'undismiss') {
    const { data, error } = await supabase
      .from('family_admin_reminders')
      .update({ dismissed_at: null })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reminder: data });
  }

  // Édition normale : type, expires_at, label, notes (pas de changement d'enfant)
  const update: Record<string, unknown> = {};
  if (typeof o.type === 'string' && (REMINDER_TYPES as readonly string[]).includes(o.type)) {
    update.type = o.type as ReminderType;
  }
  if (typeof o.expires_at === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.expires_at)) {
    update.expires_at = o.expires_at;
  }
  if (o.label === null || typeof o.label === 'string') {
    update.label = typeof o.label === 'string' && o.label.trim() ? o.label.trim().slice(0, 200) : null;
  }
  if (o.notes === null || typeof o.notes === 'string') {
    update.notes = typeof o.notes === 'string' && o.notes.trim() ? o.notes.trim().slice(0, 2000) : null;
  }

  if (Object.keys(update).length === 0) return badRequest('Aucun champ à mettre à jour');

  // Si la date change, on remet le compteur de seuil à 0 pour que les
  // prochains paliers soient renotifiés.
  if (update.expires_at) {
    update.last_notified_seuil = 0;
    update.last_notified_at = null;
  }

  const { data, error } = await supabase
    .from('family_admin_reminders')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reminder: data });
}

export async function DELETE(request: NextRequest) {
  if (!FEATURES.rappelsMdph) return notFoundJson();

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return badRequest('id manquant');

  const { error } = await supabase
    .from('family_admin_reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
