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
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 sm:p-8 text-center">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: '#e6f4f4' }}
          >
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ color: '#027e7e' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            Aucun justificatif disponible
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Dès qu&apos;un paiement aura été effectué via NeuroCare, l&apos;année
            correspondante apparaîtra ici.
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
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {years.map((y) => {
        const isBusy = busyYear === y.year;
        return (
          <article
            key={y.year}
            className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Année {y.year}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Du 1<sup>er</sup> janvier au 31 décembre {y.year}
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: '#e6f4f4',
                  color: '#027e7e',
                }}
              >
                {formatAmount(y.totalCents)}
              </span>
            </div>

            <dl className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                  Total
                </dt>
                <dd className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                  {formatAmount(y.totalCents)}
                </dd>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                  Séances
                </dt>
                <dd className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                  {y.appointmentsCount}
                </dd>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                  Enfants
                </dt>
                <dd className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                  {y.childrenCount}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => handleDownload(y.year)}
              disabled={isBusy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-medium hover:opacity-90 transition text-sm disabled:opacity-60 disabled:cursor-wait"
              style={{ backgroundColor: '#027e7e' }}
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
                  Génération en cours…
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Télécharger le justificatif annuel
                </>
              )}
            </button>
          </article>
        );
      })}
    </div>
  );
}
