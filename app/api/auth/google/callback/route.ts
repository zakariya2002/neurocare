import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { exchangeCodeForTokens, fetchGoogleUserEmail } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

function redirectError(reason: string) {
  return NextResponse.redirect(new URL(`/dashboard/educator/integrations?error=${encodeURIComponent(reason)}`, SITE_URL));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return redirectError(error);
  }
  if (!code || !state) {
    return redirectError('missing_code_or_state');
  }

  const cookieStore = cookies();
  const expectedState = cookieStore.get('google_oauth_state')?.value;
  if (!expectedState || expectedState !== state) {
    return redirectError('invalid_state');
  }

  // Auth user
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return redirectError('not_authenticated');
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const googleEmail = await fetchGoogleUserEmail(tokens.access_token);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Use service client to upsert (RLS allows user but service is simpler here)
    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error: upsertError } = await service
      .from('google_oauth_tokens')
      .upsert({
        user_id: session.user.id,
        google_email: googleEmail,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        scope: tokens.scope,
        expires_at: expiresAt,
        sync_enabled: true,
        sync_appointments_to_calendar: true,
        block_from_calendar: false,
        last_error: null,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('[google-oauth-callback] upsert error', upsertError.message);
      return redirectError('storage_failed');
    }

    const response = NextResponse.redirect(new URL('/dashboard/educator/integrations?connected=true', SITE_URL));
    response.cookies.delete('google_oauth_state');
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'oauth_exchange_failed';
    console.error('[google-oauth-callback] exchange failed', msg);
    return redirectError('exchange_failed');
  }
}
