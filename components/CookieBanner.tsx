'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà accepté les cookies
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
  };

  const dismissBanner = () => {
    localStorage.setItem('cookie-consent', 'dismissed');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-[9999] animate-slide-up">
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-2xl shadow-2xl p-5 sm:p-6"
          style={{
            backgroundColor: '#fdf9f4',
            border: '1px solid #c9eaea'
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icône */}
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#e6f4f4' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="#027e7e" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            {/* Contenu */}
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1" style={{ color: '#027e7e' }}>Votre vie privée compte</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ce site utilise des <span className="font-medium" style={{ color: '#027e7e' }}>cookies essentiels</span> pour
                le fonctionnement du service (authentification, session) et un service de suivi d&apos;erreurs (Sentry) pour ameliorer la qualite du service. Aucun cookie publicitaire n&apos;est utilise.{' '}
                <Link
                  href="/politique-confidentialite"
                  className="underline underline-offset-2 transition-colors hover:opacity-80"
                  style={{ color: '#05a5a5' }}
                >
                  Politique de confidentialité
                </Link>
              </p>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={dismissBanner}
                className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 hover:opacity-80"
                style={{
                  color: '#027e7e',
                  backgroundColor: '#e6f4f4',
                  border: '1px solid #c9eaea'
                }}
              >
                Continuer sans accepter
              </button>
              <button
                onClick={acceptCookies}
                className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:opacity-90 shadow-lg"
                style={{
                  backgroundColor: '#027e7e',
                  boxShadow: '0 4px 14px rgba(2, 126, 126, 0.3)'
                }}
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
