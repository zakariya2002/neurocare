'use client';

import { useMemo, useState } from 'react';
import EntryCard from './EntryCard';
import type { DirectoryEntry } from '@/lib/annuaire/types';
import { departmentFromPostalCode } from '@/lib/annuaire/departments';

interface FilteredEntryListProps {
  entries: DirectoryEntry[];
  /** Étiquette à afficher quand la liste filtrée est vide. */
  emptyLabel?: string;
}

export default function FilteredEntryList({
  entries,
  emptyLabel = 'Aucun résultat pour ces critères.',
}: FilteredEntryListProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return entries;

    const upper = trimmed.toUpperCase();
    const normalized = trimmed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

    return entries.filter((e) => {
      // Match code département
      if (e.department_code && e.department_code === upper) return true;

      // Match code postal exact
      if (e.postal_code && e.postal_code === trimmed) return true;

      // Match préfixe code postal (ex: '750' → 75001-75020)
      if (e.postal_code && /^\d{2,5}$/.test(trimmed) && e.postal_code.startsWith(trimmed)) {
        return true;
      }

      // Si l'utilisateur saisit un CP complet, comparer les départements
      if (/^\d{5}$/.test(trimmed)) {
        const dept = departmentFromPostalCode(trimmed);
        if (dept && e.department_code === dept) return true;
      }

      // Match nom / ville (fuzzy)
      const haystack = [
        e.name,
        e.city ?? '',
        e.address ?? '',
        e.description ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');

      return haystack.includes(normalized);
    });
  }, [entries, query]);

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="annuaire-filter" className="sr-only">
          Filtrer la liste
        </label>
        <input
          id="annuaire-filter"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer par code postal, ville ou nom"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-teal-500"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          {query && ` sur ${entries.length}`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">{emptyLabel}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}
