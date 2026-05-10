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
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-3 sm:p-4 mb-6">
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            aria-hidden="true"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <label htmlFor="annuaire-filter" className="sr-only">
            Filtrer la liste
          </label>
          <input
            id="annuaire-filter"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer par code postal, ville ou nom"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#027e7e] focus:ring-2 focus:ring-[#027e7e]/20 transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              aria-label="Effacer le filtre"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5 px-1">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: filtered.length > 0 ? '#10b981' : '#d1d5db' }}
            aria-hidden="true"
          />
          <strong className="text-gray-700">{filtered.length}</strong>{' '}
          résultat{filtered.length > 1 ? 's' : ''}
          {query && ` sur ${entries.length}`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">{emptyLabel}</p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-4 text-sm font-semibold text-[#027e7e] hover:underline"
            >
              Réinitialiser le filtre
            </button>
          )}
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
