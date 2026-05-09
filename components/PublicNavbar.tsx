'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface PublicNavbarProps {
  showAuthButtons?: boolean;
}

export default function PublicNavbar({ showAuthButtons = true }: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<'educator' | 'family' | null>(null);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

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

      if (educator) {
        setUserType('educator');
      } else {
        setUserType('family');
      }
    }
  };

  const getDashboardLink = () => {
    if (userType === 'educator') return '/dashboard/educator';
    if (userType === 'family') return '/dashboard/family';
    return '/dashboard/family';
  };

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#027e7e' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Mobile Layout */}
        <div className="flex lg:hidden items-center justify-between h-14">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative p-1.5 text-white z-[60]"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-[9px]' : ''}`}></span>
              <span className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-x-0' : ''}`}></span>
              <span className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-[9px]' : ''}`}></span>
            </div>
          </button>

          <Link href="/" className="absolute left-1/2 transform -translate-x-1/2" aria-label="Accueil NeuroCare">
            <img src="/images/logo-neurocare.svg" alt="" className="h-16" />
          </Link>

          <div className="w-8"></div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center h-14 xl:h-16">
          <nav className="flex-1 flex items-center justify-end gap-0.5 xl:gap-1" role="navigation" aria-label="Navigation principale gauche">
            <Link href="/search" className={`group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap ${isActive('/search') ? 'bg-white/20 text-white' : ''}`}>
              <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Rechercher
            </Link>
            <Link href="/about" className={`group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap ${isActive('/about') ? 'bg-white/20 text-white' : ''}`}>
              <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              À propos
            </Link>
            <Link href="/contact" className={`group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap ${isActive('/contact') ? 'bg-white/20 text-white' : ''}`}>
              <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact
            </Link>
          </nav>

          <Link href="/" className="flex-shrink-0 mx-6 xl:mx-10" aria-label="Accueil NeuroCare">
            <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-12 xl:h-14" />
          </Link>

          <nav className="flex-1 flex items-center justify-start gap-0.5 xl:gap-1" role="navigation" aria-label="Navigation principale droite">
            <Link href="/blog" className={`group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap ${isActive('/blog') ? 'bg-white/20 text-white' : ''}`}>
              <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Blog
            </Link>
            <Link href="/community" className={`group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap ${isActive('/community') ? 'bg-white/20 text-white' : ''}`}>
              <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Forum
            </Link>
            <Link href="/ressources/lieux-adaptes" className={`group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap ${isActive('/ressources') ? 'bg-white/20 text-white' : ''}`}>
              <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Lieux TND
            </Link>
            {user ? (
              <Link
                href={getDashboardLink()}
                className="group ml-1 xl:ml-2 flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm text-white font-semibold rounded-md transition-all hover:opacity-90 whitespace-nowrap"
                style={{ backgroundColor: '#f0879f' }}
              >
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Mon compte
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="ml-4 xl:ml-6 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white font-medium transition-all whitespace-nowrap"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/signup"
                  className="ml-1 xl:ml-2 px-2.5 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm text-white font-semibold rounded-md transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: '#f0879f' }}
                >
                  Inscription
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[55] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar mobile */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-[300px] max-w-[85vw] bg-white z-[56] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 flex-shrink-0">
          <Link href="/" aria-label="Accueil NeuroCare" onClick={() => setMobileMenuOpen(false)}>
            <img src="/images/logo-neurocare-teal.png" alt="" className="h-10" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer le menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Liens */}
        <nav className="flex-1 overflow-y-auto py-2" role="navigation" aria-label="Menu principal">
          <div className="px-4">
            <Link href="/search" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Rechercher un professionnel
            </Link>
            <Link href="/about" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              À propos
            </Link>
            <Link href="/familles/aides-financieres" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Aides financières
            </Link>
            <Link href="/contact" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Contact
            </Link>
          </div>

          <div className="my-1 mx-6 border-t border-gray-100"></div>

          <div className="px-4">
            <Link href="/blog" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              Blog
            </Link>
            <Link href="/community" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Forum
            </Link>
            <Link href="/ressources/lieux-adaptes" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Lieux de prise en charge TND
            </Link>
          </div>

          <div className="my-1 mx-6 border-t border-gray-100"></div>

          <div className="px-6 py-2">
            <Link href="/pro" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors" style={{ backgroundColor: '#f3e8ff', color: '#41005c' }} onClick={() => setMobileMenuOpen(false)}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Espace professionnel
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 pb-8 pt-4 border-t border-gray-100 space-y-2.5">
          {user ? (
            <Link href={getDashboardLink()} className="flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold text-white w-full hover:opacity-90 transition-colors" style={{ backgroundColor: '#027e7e' }} onClick={() => setMobileMenuOpen(false)}>
              Mon compte
            </Link>
          ) : showAuthButtons && (
            <>
              <Link href="/auth/login" className="flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold w-full border-2 transition-colors" style={{ borderColor: '#027e7e', color: '#027e7e' }} onClick={() => setMobileMenuOpen(false)}>
                Se connecter
              </Link>
              <Link href="/auth/signup" className="flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold text-white w-full hover:opacity-90 transition-colors" style={{ backgroundColor: '#027e7e' }} onClick={() => setMobileMenuOpen(false)}>
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
