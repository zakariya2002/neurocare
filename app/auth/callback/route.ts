import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();

    // Stocker les cookies temporairement
    const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              cookiesToSet.push({ name, value, options: options as CookieOptions });
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const role = data.user.user_metadata?.role;

      // Déterminer l'URL de redirection selon le rôle
      let redirectUrl = '/auth/choose-role';
      if (role === 'admin') {
        redirectUrl = '/admin';
      } else if (role === 'educator') {
        redirectUrl = '/dashboard/educator';
      } else if (role === 'family') {
        redirectUrl = '/dashboard/family';
      }

      const response = NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    }

    if (error) {
      console.error('Supabase OAuth error:', error);
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=no_code', requestUrl.origin));
}
