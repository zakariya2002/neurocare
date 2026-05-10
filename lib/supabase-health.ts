/**
 * Client Supabase dédié aux données de santé (HDS-required).
 *
 * Architecture :
 * - En staging et en local, l'URL/clé HDS peut tomber en fallback sur le
 *   Supabase général (NEXT_PUBLIC_SUPABASE_URL). Cela permet de développer
 *   les features HDS-sensibles sans avoir l'infra HDS provisionnée.
 * - En production, NEXT_PUBLIC_SUPABASE_HDS_URL DOIT pointer sur une instance
 *   hébergée chez un certifié HDS (Scaleway / OVH / Outscale) avant que les
 *   feature flags HDS-sensibles soient activés.
 *
 * Toute table accédée via ce client doit vivre dans le schema `health.*`
 * (cf. supabase/migrations/_HDS_README.md).
 */

import { createBrowserClient } from '@supabase/ssr';

const fallbackUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const fallbackKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const healthUrl = process.env.NEXT_PUBLIC_SUPABASE_HDS_URL ?? fallbackUrl;
const healthKey =
  process.env.NEXT_PUBLIC_SUPABASE_HDS_PUBLISHABLE_KEY
  ?? process.env.NEXT_PUBLIC_SUPABASE_HDS_ANON_KEY
  ?? fallbackKey;

export const supabaseHealth = createBrowserClient(healthUrl, healthKey, {
  db: { schema: 'health' },
});

/**
 * `true` si l'infra HDS est correctement provisionnée (URL distincte du
 * Supabase général). Utile pour afficher des bannières "mode HDS-pending".
 */
export const isHdsInfraConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_HDS_URL !== undefined
  && process.env.NEXT_PUBLIC_SUPABASE_HDS_URL !== fallbackUrl;
