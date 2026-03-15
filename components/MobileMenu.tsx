'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<'educator' | 'family' | null>(null);
  const pathname = usePathname();

  // Pour le portal - s'assurer qu'on est côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    checkUser();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setUserType(null);
      } else if (session?.user) {
        setUser(session.user);
        checkUserType(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserType = async (userId: string) => {
    const { data: educator } = await supabase
      .from('educator_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    setUserType(educator ? 'educator' : 'family');
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      checkUserType(session.user.id);
    } else {
      setUser(null);
      setUserType(null);
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

  // Fermer le menu quand on change de page
  useEffect(() => {
    closeMenu();
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Fermer avec la touche Échap (RGAA)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Le contenu du menu qui sera rendu via portal
  const menuContent = (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 99999, touchAction: 'none' }}
    >
      {/* Overlay sombre pour le fond */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={closeMenu}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Menu panel - style moderne fond blanc - à droite */}
      <div
        id="mobile-menu-panel"
        className="absolute top-0 right-0 h-full w-[320px] max-w-[90vw] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
      >
        {/* Contenu du menu */}
        <div className="relative h-full flex flex-col">
          {/* Header avec titre et croix */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 id="mobile-menu-title" className="text-xl font-bold text-violet-600">Menu</h2>
            <button
              onClick={closeMenu}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              aria-label="Fermer le menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              <Link
                href="/about"
                onClick={closeMenu}
                aria-current={pathname === '/about' ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                  pathname === '/about'
                    ? 'bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-violet-50 hover:shadow-sm hover:scale-[1.02]'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  pathname === '/about' ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  <svg className={`w-5 h-5 ${pathname === '/about' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>Qui sommes-nous ?</span>
              </Link>

              <Link
                href="/search"
                onClick={closeMenu}
                aria-current={pathname === '/search' ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                  pathname === '/search'
                    ? 'bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-violet-50 hover:shadow-sm hover:scale-[1.02]'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  pathname === '/search' ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  <svg className={`w-5 h-5 ${pathname === '/search' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span>Rechercher</span>
              </Link>

              <Link
                href="/pro"
                onClick={closeMenu}
                aria-current={pathname?.startsWith('/pro') ? 'page' : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:shadow-sm hover:scale-[1.02]"
                style={{
                  backgroundColor: '#f3e8ff',
                  color: '#41005c'
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#41005c' }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-semibold">Vous êtes professionnel ?</span>
              </Link>

              <Link
                href="/familles/aides-financieres"
                onClick={closeMenu}
                aria-current={pathname === '/familles/aides-financieres' ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                  pathname === '/familles/aides-financieres'
                    ? 'bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-violet-50 hover:shadow-sm hover:scale-[1.02]'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  pathname === '/familles/aides-financieres' ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  <svg className={`w-5 h-5 ${pathname === '/familles/aides-financieres' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>Aides financières</span>
              </Link>

              <Link
                href="/contact"
                onClick={closeMenu}
                aria-current={pathname === '/contact' ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                  pathname === '/contact'
                    ? 'bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-violet-50 hover:shadow-sm hover:scale-[1.02]'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  pathname === '/contact' ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  <svg className={`w-5 h-5 ${pathname === '/contact' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>Contact</span>
              </Link>
            </div>

            {/* Séparateur */}
            <div className="border-t border-gray-100 my-4"></div>

            {/* Section compte */}
            <div className="space-y-2">
              {user ? (
                <Link
                  href={getDashboardLink()}
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-violet-600 to-blue-500 text-white rounded-xl font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
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
                    href="/auth/login"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 hover:shadow-sm hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                  >
                    <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span>Connexion</span>
                  </Link>

                  <Link
                    href="/auth/register-family"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-blue-500 text-white px-4 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Créer un compte</span>
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Footer RGPD */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex flex-wrap justify-center gap-2 mb-2">
              <Link href="/mentions-legales" onClick={closeMenu} className="text-gray-500 hover:text-violet-600 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 rounded">
                Mentions légales
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/politique-confidentialite" onClick={closeMenu} className="text-gray-500 hover:text-violet-600 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 rounded">
                Confidentialité
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/cgu" onClick={closeMenu} className="text-gray-500 hover:text-violet-600 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 rounded">
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
      {/* Bouton hamburger */}
      <button
        onClick={openMenu}
        className="p-2 text-gray-700 hover:text-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-lg"
        aria-label="Ouvrir le menu de navigation"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-panel"
      >
        <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Menu rendu via Portal pour sortir du contexte de stacking de la navbar */}
      {mounted && isOpen && createPortal(menuContent, document.body)}
    </>
  );
}
