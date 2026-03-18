import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes de debug/test bloquées en production
const BLOCKED_ROUTES = [
  '/debug',
  '/api/debug',
  '/api/test-',
  '/api/dev/',
  '/api/run-siret-migration',
  '/api/send-certification-emails',
];

// Routes nécessitant le rôle admin
const ADMIN_ROUTES = [
  '/admin',
  '/api/admin',
];

// Routes autorisées pour les admins (en plus de /admin et /api)
const ADMIN_ALLOWED = [
  '/admin',
  '/auth/login',
  '/auth/callback',
  '/api',
];

// Routes soumises au rate limiting (path prefix → max requests par fenêtre)
const RATE_LIMITED_ROUTES: { prefix: string; max: number; windowMs: number }[] = [
  { prefix: '/api/contact', max: 5, windowMs: 300_000 },              // 5 req / 5 min
  { prefix: '/api/newsletter/subscribe', max: 3, windowMs: 300_000 }, // 3 req / 5 min
  { prefix: '/api/auth/reset-password', max: 3, windowMs: 600_000 },  // 3 req / 10 min
  { prefix: '/api/register-with-confirmation', max: 5, windowMs: 600_000 }, // 5 req / 10 min
  { prefix: '/api/appointments/', max: 10, windowMs: 60_000 },        // 10 req / 1 min (PIN, payment)
  { prefix: '/api/create-checkout-session', max: 5, windowMs: 60_000 }, // 5 req / 1 min (Stripe)
  { prefix: '/api/create-profile', max: 3, windowMs: 600_000 },       // 3 req / 10 min
  { prefix: '/api/upload-cv', max: 5, windowMs: 300_000 },            // 5 req / 5 min
  { prefix: '/api/cv/upload', max: 5, windowMs: 300_000 },            // 5 req / 5 min
  { prefix: '/api/educator-cvs/upload', max: 5, windowMs: 300_000 },  // 5 req / 5 min
  { prefix: '/api/verification-documents/upload', max: 5, windowMs: 300_000 }, // 5 req / 5 min
  { prefix: '/api/educators/stripe-connect', max: 3, windowMs: 600_000 }, // 3 req / 10 min
  { prefix: '/api/admin/', max: 30, windowMs: 60_000 },                   // 30 req / 1 min (admin moderation)
  { prefix: '/api/admin/users', max: 10, windowMs: 60_000 },              // 10 req / 1 min (ban/unban)
  { prefix: '/api/admin/verify-diploma', max: 10, windowMs: 60_000 },     // 10 req / 1 min
];

// Simple in-memory rate limiter (reset au redéploiement — suffisant pour MVP)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > max) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ─── 1. BLOQUER LES ROUTES DEBUG/TEST EN PRODUCTION ───
  if (process.env.NODE_ENV === 'production') {
    const isBlocked = BLOCKED_ROUTES.some(route => pathname.startsWith(route));
    if (isBlocked) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  // ─── 2. RATE LIMITING (routes publiques sensibles) ───
  for (const rule of RATE_LIMITED_ROUTES) {
    if (pathname.startsWith(rule.prefix)) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';
      const key = `${rule.prefix}:${ip}`;

      if (isRateLimited(key, rule.max, rule.windowMs)) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
          { status: 429 }
        );
      }
    }
  }

  // ─── 3. SUPABASE SESSION ───
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  // SECURITY: Check app_metadata for admin role (user_metadata is user-writable!)
  const isAdmin = session?.user?.app_metadata?.role === 'admin';
  const role = isAdmin ? 'admin' : session?.user?.user_metadata?.role;

  // ─── 4. PROTÉGER LES ROUTES ADMIN ───
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  if (isAdminRoute) {
    // Pas de session → redirection login (sans fuite d'info)
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // Session mais pas admin → 404 (ne pas révéler que la route existe)
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ─── 5. RESTREINDRE LES ADMINS AUX PAGES ADMIN UNIQUEMENT ───
  if (role === 'admin') {
    const isAllowed = ADMIN_ALLOWED.some(path => pathname.startsWith(path));
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
