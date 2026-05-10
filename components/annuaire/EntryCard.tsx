import Link from 'next/link';
import type { DirectoryEntry, DirectoryType } from '@/lib/annuaire/types';
import { DIRECTORY_TYPES } from '@/lib/annuaire/types';
import { getDepartment } from '@/lib/annuaire/departments';

interface EntryCardProps {
  entry: DirectoryEntry;
}

interface TypeStyle {
  color: string;
  bg: string;
  iconPath: string;
}

/** Couleurs UI par type d'acteur (côté composants UI uniquement). */
const TYPE_STYLES: Record<DirectoryType, TypeStyle> = {
  pco: {
    color: '#7c3aed',
    bg: '#ede9fe',
    // Réseau / coordination
    iconPath:
      'M9 12h.01M15 12h.01M9 16h.01M15 16h.01M5 8h14M5 8a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-8a2 2 0 00-2-2M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2',
  },
  cra: {
    color: '#0891b2',
    bg: '#cffafe',
    // Ressource / livre
    iconPath:
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  mdph: {
    color: '#dc2626',
    bg: '#fee2e2',
    // Bâtiment institutionnel
    iconPath:
      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  camsp: {
    color: '#10b981',
    bg: '#d1fae5',
    // Cœur / soin précoce
    iconPath:
      'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
};

export default function EntryCard({ entry }: EntryCardProps) {
  const config = DIRECTORY_TYPES[entry.type];
  const style = TYPE_STYLES[entry.type];
  const dept = entry.department_code ? getDepartment(entry.department_code) : null;
  const href = `/annuaire/${entry.type}/${entry.department_code ?? 'autre'}/${entry.slug}`;

  return (
    <Link
      href={href}
      className="group block bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-5 hover:shadow-md hover:-translate-y-[2px] transition-all duration-200"
      style={{ borderColor: '#f3f4f6' }}
    >
      <div className="flex items-start gap-3 mb-3">
        <span
          className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ backgroundColor: style.bg }}
          aria-hidden="true"
        >
          <svg
            className="w-5 h-5"
            style={{ color: style.color }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d={style.iconPath}
            />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{ backgroundColor: style.bg, color: style.color }}
          >
            {config.label}
          </span>
          {dept && (
            <p className="text-[11px] text-gray-500 mt-1">
              {dept.name} ({dept.code})
            </p>
          )}
        </div>
      </div>

      <h3
        className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#027e7e] transition-colors"
        style={{ fontFamily: 'Verdana, sans-serif' }}
      >
        {entry.name}
      </h3>
      {entry.city && (
        <p className="text-sm text-gray-600 line-clamp-1">
          {entry.address ? `${entry.address}, ` : ''}
          {entry.postal_code} {entry.city}
        </p>
      )}
      {entry.phone && (
        <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {entry.phone}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400">Voir la fiche</span>
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-[#027e7e] group-hover:translate-x-0.5 transition-all"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
