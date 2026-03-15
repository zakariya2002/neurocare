'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PublicMobileMenuProps {
  isAuthenticated?: boolean;
  userRole?: 'educator' | 'family' | null;
}

export default function PublicMobileMenu({ isAuthenticated = false, userRole = null }: PublicMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Bloquer le scroll du body quand le menu est ouvert
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  return (
    <>
      {/* Bouton hamburger - visible uniquement sur mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
        aria-label="Ouvrir le menu"
      >
        <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay avec animation de fade */}
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handleClose}
          />

          {/* Menu latéral avec animation de slide depuis la gauche */}
          <div
            className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 p-6 transform transition-transform duration-300 ease-out overflow-y-auto ${
              isAnimating ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* En-tête du menu */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary-600">Menu</h2>
              <button
                onClick={handleClose}
                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                aria-label="Fermer le menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={handleClose}
                className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Accueil
              </Link>

              <Link
                href="/search"
                onClick={handleClose}
                className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher des éducateurs
              </Link>

              <div className="border-t border-gray-200 my-4"></div>

              {isAuthenticated && userRole ? (
                <>
                  <Link
                    href={userRole === 'educator' ? '/dashboard/educator' : '/dashboard/family'}
                    onClick={handleClose}
                    className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Mon Dashboard
                  </Link>

                  <Link
                    href={userRole === 'educator' ? '/dashboard/educator/profile' : '/dashboard/family/profile'}
                    onClick={handleClose}
                    className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mon Profil
                  </Link>

                  <Link
                    href="/messages"
                    onClick={handleClose}
                    className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Messages
                  </Link>

                  {userRole === 'family' && (
                    <Link
                      href="/bookings"
                      onClick={handleClose}
                      className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Mes Rendez-vous
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={handleClose}
                    className="bg-primary-600 text-white hover:bg-primary-700 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-center shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Se connecter
                  </Link>

                  <Link
                    href="/auth/signup"
                    onClick={handleClose}
                    className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-center flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Créer un compte
                  </Link>
                </>
              )}

              <div className="border-t border-gray-200 my-4"></div>

              <Link
                href="/pricing"
                onClick={handleClose}
                className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tarifs Premium
              </Link>
            </nav>

            {/* Footer du menu */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center text-xs text-gray-500">
                <svg className="w-4 h-4 text-primary-600 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                NeuroCare
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
