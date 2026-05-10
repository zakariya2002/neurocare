'use client';

import {
  DOC_TYPES,
  DOC_TYPE_LABELS,
  DOC_TYPE_COLORS,
  type DocType,
  type VaultAggregate,
} from '@/lib/family/coffre-fort';

interface Props {
  aggregate: VaultAggregate;
  activeFilter: DocType | 'all' | 'expiring';
  onFilterChange: (filter: DocType | 'all' | 'expiring') => void;
}

const ICONS: Record<DocType, string> = {
  // MDPH — feuille avec cocher
  mdph:
    'M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z',
  // Médical — caduceus / coeur stéthoscope
  medical:
    'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z',
  // Scolarité méd — graduation cap
  scolarite_medical:
    'M22 10v6M2 10l10-5 10 5-10 5-10-5zM6 12v5c0 2 4 3 6 3s6-1 6-3v-5',
  // Administratif — document/file
  administratif:
    'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z',
  // Identité — carte
  identite:
    'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM7 12a3 3 0 1 1 6 0 3 3 0 0 1-6 0zM15 11h3M15 14h3',
};

const ICON_FOLDER_ALL =
  'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z';
const ICON_CLOCK =
  'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z';

export default function VaultSummary({ aggregate, activeFilter, onFilterChange }: Props) {
  const expiringTotal = aggregate.expired + aggregate.expiringSoon;
  const showExpiring = expiringTotal > 0;

  // Carte "Tous" + 5 types + (option) bientôt expirés
  const cards: Array<{
    key: 'all' | DocType | 'expiring';
    label: string;
    count: number;
    iconPath: string;
    bg: string;
    text: string;
    border: string;
  }> = [
    {
      key: 'all',
      label: 'Tous',
      count: aggregate.total,
      iconPath: ICON_FOLDER_ALL,
      bg: 'rgba(2, 126, 126, 0.08)',
      text: '#027e7e',
      border: 'rgba(2, 126, 126, 0.3)',
    },
    ...DOC_TYPES.map((t) => {
      const c = DOC_TYPE_COLORS[t];
      return {
        key: t,
        label: DOC_TYPE_LABELS[t],
        count: aggregate.byType[t],
        iconPath: ICONS[t],
        bg: c.bg,
        text: c.text,
        border: c.border,
      };
    }),
  ];

  if (showExpiring) {
    cards.push({
      key: 'expiring',
      label: 'Bientôt expirés',
      count: expiringTotal,
      iconPath: ICON_CLOCK,
      bg: 'rgba(217, 119, 6, 0.1)',
      text: '#d97706',
      border: 'rgba(217, 119, 6, 0.3)',
    });
  }

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-4">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              className="text-sm sm:text-base font-bold"
              style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
            >
              Vue d&apos;ensemble
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
              {aggregate.total} document{aggregate.total > 1 ? 's' : ''} archivé
              {aggregate.total > 1 ? 's' : ''} dans le coffre-fort
            </p>
          </div>
          {(aggregate.expired > 0 || aggregate.expiringSoon > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {aggregate.expired > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                  {aggregate.expired} expiré{aggregate.expired > 1 ? 's' : ''}
                </span>
              )}
              {aggregate.expiringSoon > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold border"
                  style={{
                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                    color: '#92400e',
                    borderColor: 'rgba(217, 119, 6, 0.3)',
                  }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                  {aggregate.expiringSoon} expire{aggregate.expiringSoon > 1 ? 'nt' : ''} bientôt
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {cards.map((c) => {
            const active = activeFilter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onFilterChange(c.key)}
                aria-pressed={active}
                className={`group relative text-left p-3 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  active ? 'shadow-md scale-[1.02]' : 'hover:shadow-sm hover:-translate-y-0.5'
                }`}
                style={{
                  backgroundColor: active ? c.text : c.bg,
                  borderColor: c.border,
                }}
              >
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-full mb-2"
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.25)' : c.bg,
                  }}
                  aria-hidden="true"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke={active ? '#ffffff' : c.text}
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={c.iconPath} />
                  </svg>
                </span>
                <div
                  className="text-xs sm:text-sm font-semibold leading-tight"
                  style={{ color: active ? '#ffffff' : c.text }}
                >
                  {c.label}
                </div>
                <div
                  className="text-lg sm:text-xl font-bold mt-0.5"
                  style={{ color: active ? '#ffffff' : c.text }}
                >
                  {c.count}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
