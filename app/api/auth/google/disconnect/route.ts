import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { revokeGoogleToken } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: tokenRow } = await service
    .from('google_oauth_tokens')
    .select('refresh_token')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (tokenRow?.refresh_token) {
    await revokeGoogleToken(tokenRow.refresh_token);
  }

  await service.from('google_oauth_tokens').delete().eq('user_id', session.user.id);
  // We keep google_calendar_events rows (CASCADE on appointment delete handles cleanup); they become stale but no leak.

  return NextResponse.json({ success: true });
}
