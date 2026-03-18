import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Vérifie que l'utilisateur courant est admin.
 * À utiliser dans les API routes /api/admin/*
 *
 * Usage:
 *   const { user, error } = await assertAdmin();
 *   if (error) return error;
 *   // user est garanti admin ici
 */
export async function assertAdmin(): Promise<{
  user: { id: string; email?: string } | null;
  error: NextResponse | null;
}> {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    };
  }

  // SECURITY: Check app_metadata for admin role (user_metadata is user-writable!)
  const isAdmin = session.user.app_metadata?.role === 'admin';
  if (!isAdmin) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }),
    };
  }

  return {
    user: { id: session.user.id, email: session.user.email },
    error: null,
  };
}

/**
 * Vérifie que l'utilisateur courant est authentifié et retourne son rôle.
 * Pour les API routes protégées (non-admin).
 */
export async function assertAuth(): Promise<{
  user: { id: string; email?: string; role: string } | null;
  error: NextResponse | null;
}> {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    };
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.user_metadata?.role || 'unknown',
    },
    error: null,
  };
}
