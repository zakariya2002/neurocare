/**
 * Helpers pour créer des clients Supabase server-side.
 *
 * Le pattern existant dans le codebase inline `createServerClient` à chaque
 * route — ces helpers proposent une voie unifiée pour les nouvelles features
 * et garantissent un accès séparé pour les schémas HDS.
 *
 * Deux clients :
 * - `createServerSupabasePublic(req)` : tables non-santé (schema `public`).
 * - `createServerSupabaseHealth(req)` : tables santé (schema `health.*`),
 *   isolé sur l'infra HDS quand elle est provisionnée.
 *
 * Les deux respectent les cookies pour la session utilisateur, donc le RLS
 * Postgres s'applique normalement.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies as nextCookies } from 'next/headers';

type CookieStore = Awaited<ReturnType<typeof nextCookies>>;

interface ServerClientOptions {
  /** Cookie store (Next.js App Router : `await cookies()`) */
  cookieStore: CookieStore;
  /** Schema cible (par défaut `public`) */
  schema?: string;
}

function buildCookieAdapter(cookieStore: CookieStore) {
  return {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options });
      } catch {
        // Les Server Components ne peuvent pas écrire de cookies — silencieux.
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value: '', ...options });
      } catch {
        // idem
      }
    },
  };
}

export function createServerSupabasePublic({ cookieStore }: ServerClientOptions) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, key, {
    cookies: buildCookieAdapter(cookieStore),
  });
}

export function createServerSupabaseHealth({ cookieStore }: ServerClientOptions) {
  const fallbackUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const fallbackKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const url = process.env.NEXT_PUBLIC_SUPABASE_HDS_URL ?? fallbackUrl;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_HDS_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_HDS_ANON_KEY
    ?? fallbackKey;

  return createServerClient(url, key, {
    cookies: buildCookieAdapter(cookieStore),
    db: { schema: 'health' },
  });
}
