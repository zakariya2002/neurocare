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
  activeFilter: DocType | 'all';
  onFilterChange: (filter: DocType | 'all') => void;
}

/**
 * Vue d'ensemble du coffre-fort : compteur total, alertes échéances,
 * filtres par type sous forme de pills cliquables.
 */
export default function VaultSummary({ aggregate, activeFilter, onFilterChange }: Props) {
  const hasAlerts = aggregate.expired > 0 || aggregate.expiringSoon > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Vue d&apos;ensemble</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {aggregate.total} document{aggregate.total > 1 ? 's' : ''} archivé
            {aggregate.total > 1 ? 's' : ''} dans le coffre-fort.
          </p>
        </div>
        {hasAlerts && (
          <div className="flex flex-wrap gap-2">
            {aggregate.expired > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {aggregate.expired} expiré{aggregate.expired > 1 ? 's' : ''}
              </span>
            )}
            {aggregate.expiringSoon > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {aggregate.expiringSoon} expire{aggregate.expiringSoon > 1 ? 'nt' : ''} bientôt
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition ${
            activeFilter === 'all'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
          }`}
        >
          Tous ({aggregate.total})
        </button>
        {DOC_TYPES.map((t) => {
          const count = aggregate.byType[t];
          const active = activeFilter === t;
          const colors = DOC_TYPE_COLORS[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => onFilterChange(t)}
              className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition"
              style={
                active
                  ? {
                      backgroundColor: colors.text,
                      color: 'white',
                      borderColor: colors.text,
                    }
                  : {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.border,
                    }
              }
            >
              {DOC_TYPE_LABELS[t]} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
