'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MobileMenuPro() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<'educator' | 'family' | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data: educator } = await supabase
        .from('educator_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      setUserType(educator ? 'educator' : 'family');
    }
  };

  const getDashboardLink = () => {
    if (userType === 'educator') return '/dashboard/educator';
    if (userType === 'family') return '/dashboard/family';
    return '/auth/login';
  };

  const openMenu = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const menuContent = (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 99999, touchAction: 'none' }}
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={closeMenu}
        onTouchMove={(e) => e.preventDefault()}
      />

      <div
        id="mobile-menu-pro-panel"
        className="absolute top-0 right-0 h-full w-[320px] max-w-[90vw] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-pro-title"
      >
        <div className="relative h-full flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 id="mobile-menu-pro-title" className="text-xl font-bold text-teal-600">Menu Pro</h2>
            <button
              onClick={closeMenu}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              aria-label="Fermer le menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              <Link
                href="/pro"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                  pathname === '/pro'
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  pathname === '/pro' ? 'bg-white/20' : 'bg-teal-100'
                }`}>
                  <svg className={`w-5 h-5 ${pathname === '/pro' ? 'text-white' : 'text-teal-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span>Accueil Pro</span>
              </Link>

              <Link
                href="/pro/pricing"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                  pathname === '/pro/pricing'
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  pathname === '/pro/pricing' ? 'bg-white/20' : 'bg-teal-100'
                }`}>
                  <svg className={`w-5 h-5 ${pathname === '/pro/pricing' ? 'text-white' : 'text-teal-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>Tarifs</span>
              </Link>

              <Link
                href="/pro/how-it-works"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                  pathname === '/pro/how-it-works'
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  pathname === '/pro/how-it-works' ? 'bg-white/20' : 'bg-teal-100'
                }`}>
                  <svg className={`w-5 h-5 ${pathname === '/pro/how-it-works' ? 'text-white' : 'text-teal-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span>Comment ça marche</span>
              </Link>

              <Link
                href="/pro/sap-accreditation"
                onClick={closeMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                  pathname === '/pro/sap-accreditation'
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  pathname === '/pro/sap-accreditation' ? 'bg-white/20' : 'bg-teal-100'
                }`}>
                  <svg className={`w-5 h-5 ${pathname === '/pro/sap-accreditation' ? 'text-white' : 'text-teal-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span>Guide SAP</span>
              </Link>

              <div className="border-t border-gray-100 my-4"></div>

              <Link
                href="/"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span>Espace Aidant</span>
              </Link>
            </div>

            <div className="border-t border-gray-100 my-4"></div>

            <div className="space-y-2">
              {user ? (
                <Link
                  href={getDashboardLink()}
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-xl font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <span>Mon Compte</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/pro/login"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span>Connexion</span>
                  </Link>

                  <Link
                    href="/auth/register-educator"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-4 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>S'inscrire</span>
                  </Link>
                </>
              )}
            </div>
          </nav>

          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex flex-wrap justify-center gap-2 mb-2">
              <Link href="/mentions-legales" onClick={closeMenu} className="text-gray-500 hover:text-teal-600 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 rounded">
                Mentions légales
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/politique-confidentialite" onClick={closeMenu} className="text-gray-500 hover:text-teal-600 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 rounded">
                Confidentialité
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/cgu" onClick={closeMenu} className="text-gray-500 hover:text-teal-600 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 rounded">
                CGU
              </Link>
            </div>
            <p className="text-gray-400 text-xs text-center">
              © 2024 NeuroCare
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={openMenu}
        className="p-2 text-gray-700 hover:text-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-lg"
        aria-label="Ouvrir le menu de navigation"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-pro-panel"
      >
        <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mounted && isOpen && createPortal(menuContent, document.body)}
    </>
  );
}
