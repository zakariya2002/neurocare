import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { randomBytes } from 'crypto';
import { getAuthUrl } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

/**
 * Démarre le flow OAuth Google Calendar.
 * Génère un state CSRF, le stocke en cookie httpOnly, redirige vers Google.
 */
export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login?next=/dashboard/educator/integrations', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  }

  const state = randomBytes(32).toString('hex');
  const url = getAuthUrl(state);

  const response = NextResponse.redirect(url);
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // lax: needed for OAuth redirect back
    maxAge: 600, // 10 minutes
    path: '/',
  });
  return response;
}
