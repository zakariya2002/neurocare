'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { departmentFromPostalCode, DEPARTMENTS } from '@/lib/annuaire/departments';
import type { DirectoryType } from '@/lib/annuaire/types';

interface SearchBarProps {
  /** Type d'acteur ciblé. Si undefined, redirection vers /annuaire/pco/[dept]/. */
  defaultType?: DirectoryType;
}

export default function SearchBar({ defaultType = 'pco' }: SearchBarProps) {
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
    <form onSubmit={onSubmit} className="w-full max-w-3xl mx-auto" aria-label="Rechercher dans l'annuaire">
      <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 flex flex-col sm:flex-row gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as DirectoryType)}
          className="px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-800 focus:outline-none focus:border-teal-500"
          aria-label="Type d'acteur"
        >
          <option value="pco">PCO TND</option>
          <option value="cra">CRA Autisme</option>
          <option value="mdph">MDPH</option>
          <option value="camsp">CAMSP</option>
        </select>
        <input
          type="text"
          inputMode="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Code postal, département, ou nom (ex: 75001, 92, Rhône)"
          className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-teal-500"
          aria-label="Code postal, département ou ville"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-lg text-white font-semibold text-sm transition-colors hover:opacity-90"
          style={{ backgroundColor: '#027e7e' }}
        >
          Rechercher
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
