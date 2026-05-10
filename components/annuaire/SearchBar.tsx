'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { departmentFromPostalCode, DEPARTMENTS } from '@/lib/annuaire/departments';
import type { DirectoryType } from '@/lib/annuaire/types';

interface SearchBarProps {
  /** Type d'acteur ciblé. Si undefined, redirection vers /annuaire/pco/[dept]/. */
  defaultType?: DirectoryType;
  /** Variante d'affichage. `hero` = grosse search blanche sur fond teal. `compact` = inline. */
  variant?: 'hero' | 'compact';
}

export default function SearchBar({
  defaultType = 'pco',
  variant = 'hero',
}: SearchBarProps) {
  const router = useRouter();
  const [type, setType] = useState<DirectoryType>(defaultType);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = query.trim();
    if (!trimmed) {
      router.push(`/annuaire/${type}`);
      return;
    }

    // 1) Code postal
    if (/^\d{4,5}$/.test(trimmed)) {
      const dept = departmentFromPostalCode(trimmed.padStart(5, '0'));
      if (dept) {
        router.push(`/annuaire/${type}/${dept}`);
        return;
      }
    }

    // 2) Code département direct (75, 92, 2A, 971...)
    const upper = trimmed.toUpperCase();
    if (DEPARTMENTS[upper]) {
      router.push(`/annuaire/${type}/${upper}`);
      return;
    }

    // 3) Nom de département (recherche insensible à la casse / accents)
    const normalized = trimmed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
    const match = Object.values(DEPARTMENTS).find((d) => {
      const dn = d.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
      return dn === normalized || dn.includes(normalized);
    });
    if (match) {
      router.push(`/annuaire/${type}/${match.code}`);
      return;
    }

    setError(
      'Saisissez un code postal (ex: 75001), un code département (ex: 75) ou un nom de département.'
    );
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-3xl mx-auto"
      aria-label="Rechercher dans l'annuaire"
    >
      <div
        className={`bg-white rounded-2xl ${
          variant === 'hero' ? 'shadow-xl p-3 sm:p-4' : 'shadow-sm border border-gray-100 p-2.5 sm:p-3'
        } flex flex-col sm:flex-row gap-2`}
      >
        <label className="sr-only" htmlFor="annuaire-type-select">
          Type d'acteur
        </label>
        <select
          id="annuaire-type-select"
          value={type}
          onChange={(e) => setType(e.target.value as DirectoryType)}
          className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#027e7e] focus:ring-2 focus:ring-[#027e7e]/20 transition bg-white"
          aria-label="Type d'acteur"
        >
          <option value="pco">PCO TND</option>
          <option value="cra">CRA Autisme</option>
          <option value="mdph">MDPH</option>
          <option value="camsp">CAMSP</option>
        </select>

        <div className="relative flex-1">
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
          <label className="sr-only" htmlFor="annuaire-query">
            Code postal, code département ou nom du département
          </label>
          <input
            id="annuaire-query"
            type="text"
            inputMode="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Code postal, code département ou nom du département"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#027e7e] focus:ring-2 focus:ring-[#027e7e]/20 transition"
            aria-label="Code postal, département ou ville"
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition shadow-sm hover:opacity-90 hover:shadow-md whitespace-nowrap"
          style={{ backgroundColor: '#027e7e' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Rechercher
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-100 bg-red-700/40 backdrop-blur-sm rounded-lg px-3 py-2" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
