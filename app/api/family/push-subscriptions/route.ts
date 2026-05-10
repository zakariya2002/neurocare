/**
 * API Push Subscriptions (A2 — Web Push) :
 *
 * GET    /api/family/push-subscriptions             → liste les abonnements de l'user
 * POST   /api/family/push-subscriptions             → enregistre un abonnement
 *   body : { endpoint, keys: { p256dh, auth }, user_agent? }
 * DELETE /api/family/push-subscriptions?endpoint=... → désabonne
 *
 * Sécurité :
 * - feature flag rappelsMdph → 404 sinon
 * - auth obligatoire
 * - écriture via le client serveur respectant le RLS (user_id = auth.uid())
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';

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

export async function GET(_request: NextRequest) {
  if (!FEATURES.rappelsMdph) return notFoundJson();

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from('family_push_subscriptions')
    .select('id, endpoint, keys, user_agent, created_at, last_seen_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscriptions: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!FEATURES.rappelsMdph) return notFoundJson();

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  let body: unknown;
  try { body = await request.json(); } catch { return badRequest('JSON invalide'); }
  const o = (body && typeof body === 'object') ? body as Record<string, unknown> : null;
  if (!o) return badRequest('Body invalide');

  const endpoint = typeof o.endpoint === 'string' ? o.endpoint : null;
  const keys = (o.keys && typeof o.keys === 'object') ? o.keys as Record<string, unknown> : null;
  const p256dh = keys && typeof keys.p256dh === 'string' ? keys.p256dh : null;
  const auth = keys && typeof keys.auth === 'string' ? keys.auth : null;

  if (!endpoint || !p256dh || !auth) {
    return badRequest('endpoint et keys.{p256dh,auth} requis');
  }

  const userAgent = typeof o.user_agent === 'string' ? o.user_agent.slice(0, 500) : null;

  // upsert sur l'endpoint (unique) afin de gérer les ré-abonnements
  const { data, error } = await supabase
    .from('family_push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint,
        keys: { p256dh, auth },
        user_agent: userAgent,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscription: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!FEATURES.rappelsMdph) return notFoundJson();

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const endpoint = request.nextUrl.searchParams.get('endpoint');
  if (!endpoint) return badRequest('endpoint manquant');

  const { error } = await supabase
    .from('family_push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
