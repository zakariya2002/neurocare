'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ALL_ACCEPTED,
  ALL_REFUSED,
  COOKIE_PREFERENCES_OPEN_EVENT,
  type CookieConsent,
  readConsent,
  writeConsent,
} from '@/lib/cookie-consent';

// Bandeau de consentement RGPD à trois catégories, conforme aux recommandations
// CNIL 2020 :
//   - choix granulaires (essentiels / analytics / marketing),
//   - bouton "Tout refuser" aussi accessible que "Tout accepter",
//   - aucune case opt-in pré-cochée par défaut,
//   - mention explicite des sous-traitants (Sentry, Meta).
//
// Le résultat est stocké via `lib/cookie-consent.ts`, qui émet l'événement
// `cookie-consent-changed` consommé par les modules sensibles (Meta Pixel).

type CategoryToggle = {
  analytics: boolean;
  marketing: boolean;
};

const PRIMARY = '#027e7e';
const SURFACE = '#fdf9f4';
const SURFACE_BORDER = '#c9eaea';
const SURFACE_SOFT = '#e6f4f4';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [toggles, setToggles] = useState<CategoryToggle>({ analytics: false, marketing: false });
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      setShowBanner(true);
      return;
    }
    setToggles({ analytics: existing.analytics, marketing: existing.marketing });
  }, []);

  // Focus trap + Escape pour la modale "Personnaliser" (RGAA 7.3, 12.7)
  useEffect(() => {
    if (!showPreferences) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowPreferences(false);
        return;
      }
      if (e.key !== 'Tab' || focusable.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [showPreferences]);

  // Permet de rouvrir la modale Préférences depuis l'extérieur (ex. footer)
  useEffect(() => {
    const handler = () => {
      const existing = readConsent();
      if (existing) setToggles({ analytics: existing.analytics, marketing: existing.marketing });
      setShowPreferences(true);
    };
    window.addEventListener(COOKIE_PREFERENCES_OPEN_EVENT, handler);
    return () => window.removeEventListener(COOKIE_PREFERENCES_OPEN_EVENT, handler);
  }, []);

  const persist = (consent: Pick<CookieConsent, 'analytics' | 'marketing'>) => {
    writeConsent(consent);
    setToggles({ analytics: consent.analytics, marketing: consent.marketing });
    setShowBanner(false);
    setShowPreferences(false);
  };

  const acceptAll = () => persist({ analytics: ALL_ACCEPTED.analytics, marketing: ALL_ACCEPTED.marketing });
  const refuseAll = () => persist({ analytics: ALL_REFUSED.analytics, marketing: ALL_REFUSED.marketing });
  const saveCustom = () => persist({ analytics: toggles.analytics, marketing: toggles.marketing });

  if (!showBanner && !showPreferences) return null;

  return (
    <>
      {/* Overlay principal — masqué quand la modale Préférences est ouverte seule */}
      {showBanner && (
      <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-[9999] animate-slide-up">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl shadow-2xl p-5 sm:p-6"
            style={{ backgroundColor: SURFACE, border: `1px solid ${SURFACE_BORDER}` }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: SURFACE_SOFT }}
                aria-hidden="true"
              >
                <svg className="w-6 h-6" fill="none" stroke={PRIMARY} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1" style={{ color: PRIMARY }}>
                  Votre vie privée compte
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  NeuroCare utilise des cookies <span className="font-medium" style={{ color: PRIMARY }}>essentiels</span> au
                  fonctionnement du service (authentification, session). Avec votre accord, nous utilisons aussi des cookies
                  de <span className="font-medium" style={{ color: PRIMARY }}>mesure d&apos;audience</span> (Sentry) et de
                  {' '}<span className="font-medium" style={{ color: PRIMARY }}>marketing</span> (Pixel Meta / Facebook) pour
                  personnaliser nos campagnes publicitaires. Vous pouvez modifier votre choix à tout moment.{' '}
                  <Link
                    href="/politique-confidentialite"
                    className="underline underline-offset-2 transition-colors hover:opacity-80"
                    style={{ color: '#05a5a5' }}
                  >
                    Politique de confidentialité
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                onClick={refuseAll}
                className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 hover:opacity-80"
                style={{ color: PRIMARY, backgroundColor: SURFACE_SOFT, border: `1px solid ${SURFACE_BORDER}` }}
              >
                Tout refuser
              </button>
              <button
                onClick={() => setShowPreferences(true)}
                className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 hover:opacity-80"
                style={{ color: PRIMARY, backgroundColor: 'transparent', border: `1px solid ${PRIMARY}` }}
              >
                Personnaliser
              </button>
              <button
                onClick={acceptAll}
                className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:opacity-90 shadow-lg"
                style={{ backgroundColor: PRIMARY, boxShadow: '0 4px 14px rgba(2, 126, 126, 0.3)' }}
              >
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Modale "Personnaliser" */}
      {showPreferences && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[10000] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-prefs-title"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowPreferences(false)}
            aria-hidden="true"
          />
          <div
            className="relative max-w-lg w-full rounded-2xl shadow-2xl p-6 sm:p-8"
            style={{ backgroundColor: SURFACE, border: `1px solid ${SURFACE_BORDER}` }}
          >
            <h2 id="cookie-prefs-title" className="text-xl font-bold mb-1" style={{ color: PRIMARY }}>
              Préférences de cookies
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Activez uniquement les catégories que vous souhaitez autoriser.
            </p>

            <Category
              title="Cookies essentiels"
              description="Authentification, session, panier et sécurité. Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés."
              checked
              disabled
            />

            <Category
              title="Mesure d'audience"
              description="Sentry et statistiques anonymisées pour détecter les bugs et améliorer la qualité du service."
              checked={toggles.analytics}
              onChange={(v) => setToggles((t) => ({ ...t, analytics: v }))}
            />

            <Category
              title="Marketing / publicité"
              description="Pixel Meta (Facebook / Instagram) pour mesurer la performance des campagnes publicitaires et construire des audiences personnalisées. Désactivé par défaut."
              checked={toggles.marketing}
              onChange={(v) => setToggles((t) => ({ ...t, marketing: v }))}
            />

            <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                onClick={() => setShowPreferences(false)}
                className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 hover:opacity-80"
                style={{ color: PRIMARY, backgroundColor: SURFACE_SOFT, border: `1px solid ${SURFACE_BORDER}` }}
              >
                Annuler
              </button>
              <button
                onClick={saveCustom}
                className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:opacity-90 shadow-lg"
                style={{ backgroundColor: PRIMARY, boxShadow: '0 4px 14px rgba(2, 126, 126, 0.3)' }}
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Category({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-3 border-b last:border-b-0"
      style={{ borderColor: SURFACE_BORDER }}
    >
      <div className="flex-1">
        <p className="font-semibold text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{description}</p>
      </div>
      <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          aria-label={title}
        />
        <div
          className="w-11 h-6 rounded-full transition-colors peer-checked:[background-color:var(--toggle-on)]"
          style={
            {
              backgroundColor: checked ? PRIMARY : '#d1d5db',
              ['--toggle-on' as string]: PRIMARY,
            } as React.CSSProperties
          }
        >
          <span
            className="block w-5 h-5 bg-white rounded-full shadow transition-transform"
            style={{ transform: checked ? 'translate(22px, 2px)' : 'translate(2px, 2px)' }}
          />
        </div>
      </label>
    </div>
  );
}
