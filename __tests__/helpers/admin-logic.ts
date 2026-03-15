/**
 * Extracted admin-checking logic from lib/assert-admin.ts
 * Pure functions for testing admin authorization without Supabase/Next.js dependencies.
 */

export interface UserMetadata {
  role?: string;
  [key: string]: unknown;
}

export interface SessionUser {
  id: string;
  email?: string;
  user_metadata?: UserMetadata;
}

export interface Session {
  user: SessionUser;
}

export interface AdminCheckResult {
  authorized: boolean;
  status?: 401 | 403;
  errorMessage?: string;
  user?: { id: string; email?: string };
}

/**
 * Checks whether a session represents an authenticated admin user.
 * Mirrors the logic in lib/assert-admin.ts assertAdmin().
 */
export function checkAdminAccess(session: Session | null): AdminCheckResult {
  if (!session?.user) {
    return {
      authorized: false,
      status: 401,
      errorMessage: 'Non authentifie',
    };
  }

  if (session.user.user_metadata?.role !== 'admin') {
    return {
      authorized: false,
      status: 403,
      errorMessage: 'Acces refuse',
    };
  }

  return {
    authorized: true,
    user: { id: session.user.id, email: session.user.email },
  };
}

/**
 * Checks whether a session represents an authenticated user (any role).
 * Mirrors the logic in lib/assert-admin.ts assertAuth().
 */
export function checkAuthAccess(session: Session | null): {
  authenticated: boolean;
  status?: 401;
  errorMessage?: string;
  user?: { id: string; email?: string; role: string };
} {
  if (!session?.user) {
    return {
      authenticated: false,
      status: 401,
      errorMessage: 'Non authentifie',
    };
  }

  return {
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.user_metadata?.role || 'unknown',
    },
  };
}
