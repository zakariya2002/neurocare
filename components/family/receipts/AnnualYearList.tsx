'use client';

/**
 * Liste des années pour lesquelles un justificatif annuel peut être généré.
 *
 * Chaque carte présente : année, total dépensé, nb de séances, nb d'enfants.
 * Le bouton déclenche un téléchargement direct du PDF via la route GET
 * `/api/family/receipts/annual/[year]`.
 */

import { useState } from 'react';

export interface AnnualYearSummary {
  year: number;
  totalCents: number;
  appointmentsCount: number;
  childrenCount: number;
}

interface Props {
  years: ReadonlyArray<AnnualYearSummary>;
}

const TEAL = '#027e7e';
const TEAL_PASTEL = '#e6f4f4';
const EMERALD = '#10b981';
const EMERALD_PASTEL = '#d1fae5';

function formatAmount(amountInCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountInCents / 100);
}

export default function AnnualYearList({ years }: Props) {
  const [busyYear, setBusyYear] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (year: number) => {
    setError(null);
    setBusyYear(year);
    try {
      const res = await fetch(`/api/family/receipts/annual/${year}`, {
        method: 'GET',
      });
      if (!res.ok) {
        let message = 'Impossible de générer le justificatif.';
        try {
          const data = await res.json();
          if (typeof data?.error === 'string') message = data.error;
        } catch {
          // pas de JSON
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `justificatif-annuel-${year}-neurocare.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur inattendue.');
    } finally {
      setBusyYear(null);
    }
  };

  if (years.length === 0) {
    return (
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-10 text-center">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: TEAL_PASTEL }}
            aria-hidden="true"
          >
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: TEAL }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3
            className="text-lg sm:text-xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: 'Verdana, sans-serif' }}
          >
            Pas encore de justificatif disponible
          </h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            Vous n&apos;avez pas encore de paiements pour cette année. Vos
            justificatifs apparaîtront ici dès votre premier rendez-vous payé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2"
        >
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {years.map((y) => {
        const isBusy = busyYear === y.year;
        return (
          <article
            key={y.year}
            className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 sm:p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Année + total mis en avant */}
              <div className="flex items-start gap-4 min-w-0">
                <div
                  className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: TEAL_PASTEL }}
                  aria-hidden="true"
                >
                  <span
                    className="text-base sm:text-lg font-bold"
                    style={{ color: TEAL, fontFamily: 'Verdana, sans-serif' }}
                  >
                    {y.year}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                    Année {y.year}
                  </p>
                  <p
                    className="text-2xl sm:text-3xl font-bold mt-0.5"
                    style={{ color: TEAL, fontFamily: 'Verdana, sans-serif' }}
                  >
                    {formatAmount(y.totalCents)}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs sm:text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <strong className="font-semibold text-gray-900">
                        {y.appointmentsCount}
                      </strong>
                      &nbsp;{y.appointmentsCount > 1 ? 'séances' : 'séance'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 014-4h2a4 4 0 014 4v2zm3-12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <strong className="font-semibold text-gray-900">
                        {y.childrenCount}
                      </strong>
                      &nbsp;{y.childrenCount > 1 ? 'enfants' : 'enfant'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton télécharger */}
              <div className="flex-shrink-0 sm:self-center w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleDownload(y.year)}
                  disabled={isBusy}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 text-white rounded-xl font-semibold hover:opacity-90 transition text-sm shadow-sm disabled:opacity-60 disabled:cursor-wait"
                  style={{ backgroundColor: TEAL }}
                  aria-label={`Télécharger le justificatif annuel ${y.year}`}
                >
                  {isBusy ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      Génération…
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Télécharger le PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pastille montant émeraude (rappel positif) */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold"
                style={{ backgroundColor: EMERALD_PASTEL, color: EMERALD }}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Total réglé
              </span>
              <span className="text-gray-500">
                Du 1<sup>er</sup> janvier au 31 décembre {y.year}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
