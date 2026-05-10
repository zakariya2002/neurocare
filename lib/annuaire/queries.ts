/**
 * Query helpers pour l'annuaire externe (feature A5).
 *
 * Server-side only — utilise un client Supabase server pour le SSR
 * des pages publiques (`/annuaire/*`). RLS publique en lecture, donc
 * pas besoin d'auth utilisateur.
 *
 * Pour le MVP, on lit aussi un fallback statique depuis `data/annuaire/*.json`
 * lorsque la table est vide (ex: avant exécution du seed). Cela permet à la
 * page de fonctionner immédiatement après checkout.
 */

import { cookies } from 'next/headers';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import type { DirectoryEntry, DirectoryType } from './types';
import { isDirectoryType } from './types';
import pcoSeed from '@/data/annuaire/pco.json';
import craSeed from '@/data/annuaire/cra.json';
import mdphSeed from '@/data/annuaire/mdph.json';
import camspSeed from '@/data/annuaire/camsp.json';

const STATIC_FALLBACK: ReadonlyArray<DirectoryEntry> = [
  ...(pcoSeed as DirectoryEntry[]),
  ...(craSeed as DirectoryEntry[]),
  ...(mdphSeed as DirectoryEntry[]),
  ...(camspSeed as DirectoryEntry[]),
];

async function getClient() {
  const cookieStore = await cookies();
  return createServerSupabasePublic({ cookieStore });
}

/** Lecture sécurisée — bascule sur la donnée statique si la table n'existe pas
 *  ou si Supabase n'est pas joignable. */
async function safeQuery<T>(
  fn: () => Promise<{ data: T | null; error: { message?: string } | null }>,
  fallback: T
): Promise<T> {
  try {
    const { data, error } = await fn();
    if (error) return fallback;
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function listEntriesByType(type: DirectoryType): Promise<DirectoryEntry[]> {
  if (!isDirectoryType(type)) return [];

  const supabase = await getClient();
  const fromDb = await safeQuery<DirectoryEntry[]>(
    () =>
      supabase
        .from('external_directory_entries')
        .select('*')
        .eq('type', type)
        .eq('is_published', true)
        .order('department_code', { ascending: true })
        .order('name', { ascending: true }) as unknown as Promise<{ data: DirectoryEntry[] | null; error: { message?: string } | null }>,
    []
  );

  if (fromDb.length > 0) return fromDb;
  return STATIC_FALLBACK
    .filter((e) => e.type === type)
    .sort((a, b) => {
      const da = a.department_code ?? '';
      const db = b.department_code ?? '';
      if (da !== db) return da.localeCompare(db);
      return a.name.localeCompare(b.name);
    });
}

export async function listEntriesByTypeAndDepartment(
  type: DirectoryType,
  departmentCode: string
): Promise<DirectoryEntry[]> {
  const all = await listEntriesByType(type);
  return all.filter((e) => e.department_code === departmentCode);
}

export async function getEntry(
  type: DirectoryType,
  slug: string
): Promise<DirectoryEntry | null> {
  const supabase = await getClient();
  const fromDb = await safeQuery<DirectoryEntry | null>(
    () =>
      supabase
        .from('external_directory_entries')
        .select('*')
        .eq('type', type)
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle() as unknown as Promise<{ data: DirectoryEntry | null; error: { message?: string } | null }>,
    null
  );

  if (fromDb) return fromDb;

  const fallback = STATIC_FALLBACK.find(
    (e) => e.type === type && e.slug === slug
  );
  return fallback ?? null;
}

/** Compte d'entrées par type, pour la home /annuaire/. */
export async function countEntriesByType(): Promise<Record<DirectoryType, number>> {
  const supabase = await getClient();
  const counts: Record<DirectoryType, number> = { pco: 0, cra: 0, mdph: 0, camsp: 0 };

  try {
    const { data, error } = await supabase
      .from('external_directory_entries')
      .select('type', { count: 'exact', head: false })
      .eq('is_published', true);

    if (!error && data && data.length > 0) {
      for (const row of data as Array<{ type: DirectoryType }>) {
        if (isDirectoryType(row.type)) counts[row.type]++;
      }
      return counts;
    }
  } catch {
    // fallback ci-dessous
  }

  for (const e of STATIC_FALLBACK) {
    counts[e.type]++;
  }
  return counts;
}

/** Liste des départements distincts qui ont au moins une entrée d'un type donné. */
export async function listDepartmentsForType(
  type: DirectoryType
): Promise<string[]> {
  const all = await listEntriesByType(type);
  const set = new Set<string>();
  for (const e of all) {
    if (e.department_code) set.add(e.department_code);
  }
  return Array.from(set).sort();
}

/** Toutes les paires (type, slug) pour generateStaticParams sur la page détail. */
export async function listAllSlugs(): Promise<
  Array<{ type: DirectoryType; departement: string; slug: string }>
> {
  const out: Array<{ type: DirectoryType; departement: string; slug: string }> = [];
  for (const type of ['pco', 'cra', 'mdph', 'camsp'] as DirectoryType[]) {
    const entries = await listEntriesByType(type);
    for (const e of entries) {
      if (e.department_code) {
        out.push({ type, departement: e.department_code, slug: e.slug });
      }
    }
  }
  return out;
}
