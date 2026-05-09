import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/** GET — état de connexion Google + settings de sync */
export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data } = await service
    .from('google_oauth_tokens')
    .select('google_email, sync_enabled, sync_appointments_to_calendar, block_from_calendar, last_sync_at, last_error')
    .eq('user_id', session.user.id)
    .maybeSingle();

  return NextResponse.json({ connected: !!data, ...(data || {}) });
}

/** PATCH — mise à jour des toggles */
export async function PATCH(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const allowed: Record<string, boolean> = {};
  for (const k of ['sync_enabled', 'sync_appointments_to_calendar', 'block_from_calendar']) {
    if (typeof body[k] === 'boolean') allowed[k] = body[k];
  }
  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Aucun paramètre valide' }, { status: 400 });
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { error } = await service
    .from('google_oauth_tokens')
    .update(allowed)
    .eq('user_id', session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
