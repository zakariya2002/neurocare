'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BetaModalProps {
  variant?: 'family' | 'pro';
}

export default function BetaModal({ variant = 'pro' }: BetaModalProps) {
  const headerGradient = variant === 'family'
    ? 'linear-gradient(135deg, #015c5c 0%, #027e7e 50%, #015c5c 100%)'
    : 'linear-gradient(135deg, #41005c 0%, #6b21a8 50%, #41005c 100%)';
  const badgeColor = variant === 'family'
    ? 'rgba(2, 126, 126, 0.8)'
    : 'rgba(240, 135, 159, 0.8)';
  const accentColor = variant === 'family' ? '#027e7e' : '#41005c';
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissedPersistent = localStorage.getItem('beta-banner-dismissed');
    const dismissedSession = sessionStorage.getItem('beta-banner-dismissed');
    if (!dismissedPersistent && !dismissedSession) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem('beta-banner-dismissed', '1');
    if (localStorage.getItem('cookie-consent') === 'accepted') {
      localStorage.setItem('beta-banner-dismissed', '1');
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 pt-16 pb-3 md:pt-24 md:pb-8 lg:pt-4 lg:pb-4" onClick={dismiss}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-full overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: 'betaModalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header gradient */}
          <div className="relative px-5 sm:px-6 pt-5 sm:pt-8 pb-8 sm:pb-14 text-center" style={{ background: headerGradient }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

            <button
              onClick={dismiss}
              className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition"
              aria-label="Fermer"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative inline-flex flex-col items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider text-white mb-2 sm:mb-4" style={{ backgroundColor: badgeColor, backdropFilter: 'blur(4px)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                VERSION BÊTA
              </span>
              <div className="text-3xl sm:text-5xl mb-1 sm:mb-2" role="img" aria-label="Fusée">
                🚀
              </div>
            </div>

            <h2 className="text-lg sm:text-2xl font-extrabold text-white leading-tight">
              NeuroCare
              <br />
              <span className="text-white/80 font-medium text-sm sm:text-lg">est officiellement lancé !</span>
            </h2>
          </div>

          {/* Body */}
          <div className="bg-white px-5 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {[
                { icon: '🧪', text: 'Testez la plateforme en avant-première' },
                { icon: '💬', text: 'Vos retours sont le fondement direct de l\'évolution de la plateforme' },
                { icon: '✅', text: 'Inscription et utilisation 100% gratuites' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 sm:gap-3 bg-gray-50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3">
                  <span className="text-base sm:text-xl flex-shrink-0">{item.icon}</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 leading-snug">{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA double */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Link
                href="/"
                className="flex flex-col items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-4 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-sm leading-tight text-center transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2"
                style={{ borderColor: '#027e7e', color: '#027e7e', backgroundColor: 'rgba(2, 126, 126, 0.05)' }}
                onClick={dismiss}
              >
                <span className="text-lg sm:text-2xl">👨‍👩‍👧‍👦</span>
                <span>Découvrir en tant que famille</span>
              </Link>
              <Link
                href="/pro"
                className="flex flex-col items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-4 rounded-lg sm:rounded-xl font-bold text-white text-[11px] sm:text-sm leading-tight text-center transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #41005c, #6b21a8)' }}
                onClick={dismiss}
              >
                <span className="text-lg sm:text-2xl">👩‍⚕️</span>
                <span>Découvrir en tant que professionnel</span>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-2 sm:mt-3">
              <span className="text-[11px] sm:text-xs text-gray-400">Déjà inscrit ?</span>
              <Link
                href="/feedback"
                className="text-[11px] sm:text-xs font-semibold hover:underline transition"
                style={{ color: accentColor }}
                onClick={dismiss}
              >
                Donner mon feedback
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes betaModalIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
