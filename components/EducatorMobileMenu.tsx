'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface EducatorMobileMenuProps {
  profile?: any;
  /** @deprecated plus utilisé, conservé pour compatibilité tant que les appelants ne sont pas nettoyés */
  isPremium?: boolean;
  onLogout?: () => void;
}

export default function EducatorMobileMenu({ profile: propProfile, onLogout }: EducatorMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(propProfile || null);
  const pathname = usePathname();
  const router = useRouter();

  // Récupérer le profil si non fourni en props
  useEffect(() => {
    if (!propProfile) {
      const fetchProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('educator_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          if (data) setProfile(data);
        }
      };
      fetchProfile();
    }
  }, [propProfile]);

  // Pour le portal - s'assurer qu'on est côté client
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const openMenu = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  const handleLogoutClick = async () => {
    closeMenu();
    if (onLogout) {
      onLogout();
    } else {
      await supabase.auth.signOut();
      router.push('/');
    }
  };

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

      {/* Menu panel - depuis le haut */}
      <div
        className="absolute top-0 left-0 right-0 bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="educator-mobile-menu-title"
        style={{ borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}
      >
        {/* Contenu du menu */}
        <div className="relative flex flex-col">
          {/* Header avec titre et croix */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #41005c 0%, #5a1a75 100%)' }}>
            <h2 id="educator-mobile-menu-title" className="text-xl font-bold text-white">Menu</h2>
            <button
              onClick={closeMenu}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
              aria-label="Fermer le menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Profil utilisateur */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(65, 0, 92, 0.08) 0%, #fdf9f4 100%)' }}>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="h-12 w-12 rounded-full object-cover"
                  style={{ border: '2px solid #5a1a75' }}
                />
              ) : (
                <div className="h-12 w-12 rounded-full flex items-center justify-center overflow-hidden bg-white" style={{ border: '2px solid #5a1a75' }}>
                  <img
                    src={profile?.gender === 'male' ? '/images/icons/avatar-male.svg' : profile?.gender === 'female' ? '/images/icons/avatar-female.svg' : ((profile?.id?.charCodeAt(0) || 0) % 2 === 0 ? '/images/icons/avatar-male.svg' : '/images/icons/avatar-female.svg')}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-xs text-gray-500">Compte professionnel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-4 py-4">
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard/educator"
                onClick={closeMenu}
                className="text-white py-3 px-4 rounded-xl font-bold transition-all duration-200 flex items-center gap-3 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #41005c 0%, #5a1a75 100%)' }}
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span>Home</span>
              </Link>

              {/* 1. Mon profil */}
              <Link
                href="/dashboard/educator/profile"
                onClick={closeMenu}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  pathname === '/dashboard/educator/profile'
                    ? 'text-[#41005c] font-semibold'
                    : 'text-gray-700 hover:text-[#41005c]'
                }`}
                style={pathname === '/dashboard/educator/profile' ? { backgroundColor: 'rgba(90, 26, 117, 0.15)' } : {}}
                aria-current={pathname === '/dashboard/educator/profile' ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mon profil
              </Link>

              {/* 2. Rendez-vous */}
              <Link
                href="/dashboard/educator/appointments"
                onClick={closeMenu}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  pathname === '/dashboard/educator/appointments'
                    ? 'text-[#41005c] font-semibold'
                    : 'text-gray-700 hover:text-[#41005c]'
                }`}
                style={pathname === '/dashboard/educator/appointments' ? { backgroundColor: 'rgba(90, 26, 117, 0.15)' } : {}}
                aria-current={pathname === '/dashboard/educator/appointments' ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Mes rendez-vous
              </Link>

              {/* 3. Disponibilités */}
              <Link
                href="/dashboard/educator/availability"
                onClick={closeMenu}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  pathname === '/dashboard/educator/availability'
                    ? 'text-[#41005c] font-semibold'
                    : 'text-gray-700 hover:text-[#41005c]'
                }`}
                style={pathname === '/dashboard/educator/availability' ? { backgroundColor: 'rgba(90, 26, 117, 0.15)' } : {}}
                aria-current={pathname === '/dashboard/educator/availability' ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mes disponibilités
              </Link>

              {/* 4. Messages */}
              <Link
                href="/messages"
                onClick={closeMenu}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  pathname === '/messages'
                    ? 'text-[#41005c] font-semibold'
                    : 'text-gray-700 hover:text-[#41005c]'
                }`}
                style={pathname === '/messages' ? { backgroundColor: 'rgba(90, 26, 117, 0.15)' } : {}}
                aria-current={pathname === '/messages' ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Messages
              </Link>

              {/* 5. Paiements */}
              <Link
                href="/dashboard/educator/payouts"
                onClick={closeMenu}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  pathname === '/dashboard/educator/payouts'
                    ? 'text-[#41005c] font-semibold'
                    : 'text-gray-700 hover:text-[#41005c]'
                }`}
                style={pathname === '/dashboard/educator/payouts' ? { backgroundColor: 'rgba(90, 26, 117, 0.15)' } : {}}
                aria-current={pathname === '/dashboard/educator/payouts' ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Paiements
              </Link>

              {/* 6. Mes factures */}
              <Link
                href="/dashboard/educator/invoices"
                onClick={closeMenu}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  pathname === '/dashboard/educator/invoices'
                    ? 'text-[#41005c] font-semibold'
                    : 'text-gray-700 hover:text-[#41005c]'
                }`}
                style={pathname === '/dashboard/educator/invoices' ? { backgroundColor: 'rgba(90, 26, 117, 0.15)' } : {}}
                aria-current={pathname === '/dashboard/educator/invoices' ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Mes factures
              </Link>

              {/* 6. Mon diplôme */}
              <Link
                href="/dashboard/educator/diploma"
                onClick={closeMenu}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  pathname === '/dashboard/educator/diploma'
                    ? 'text-[#41005c] font-semibold'
                    : 'text-gray-700 hover:text-[#41005c]'
                }`}
                style={pathname === '/dashboard/educator/diploma' ? { backgroundColor: 'rgba(90, 26, 117, 0.15)' } : {}}
                aria-current={pathname === '/dashboard/educator/diploma' ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Mon diplôme
              </Link>

              {/* 7. Mes articles */}
              <Link
                href="/dashboard/educator/blog"
                onClick={closeMenu}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  pathname?.startsWith('/dashboard/educator/blog')
                    ? 'text-[#41005c] font-semibold'
                    : 'text-gray-700 hover:text-[#41005c]'
                }`}
                style={pathname?.startsWith('/dashboard/educator/blog') ? { backgroundColor: 'rgba(90, 26, 117, 0.15)' } : {}}
                aria-current={pathname?.startsWith('/dashboard/educator/blog') ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Mes articles
              </Link>

              {/* 8. Mon compte */}
              <Link
                href="/dashboard/educator/subscription"
                onClick={closeMenu}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  pathname === '/dashboard/educator/subscription'
                    ? 'text-[#41005c] font-semibold'
                    : 'text-gray-700 hover:text-[#41005c]'
                }`}
                style={pathname === '/dashboard/educator/subscription' ? { backgroundColor: 'rgba(90, 26, 117, 0.15)' } : {}}
                aria-current={pathname === '/dashboard/educator/subscription' ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Mon compte
              </Link>

              {/* 8. Agrément SAP */}
              <Link
                href="/pro/sap-accreditation"
                onClick={closeMenu}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                  pathname === '/pro/sap-accreditation'
                    ? 'text-[#41005c] font-semibold'
                    : 'text-gray-700 hover:text-[#41005c]'
                }`}
                style={pathname === '/pro/sap-accreditation' ? { backgroundColor: 'rgba(90, 26, 117, 0.15)' } : {}}
                aria-current={pathname === '/pro/sap-accreditation' ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Agrément SAP
              </Link>

              <div className="border-t border-gray-200 my-4"></div>

              {/* Découvrir Neuro Care - retour à la landing page */}
              <Link
                href="/"
                onClick={closeMenu}
                className="py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 text-gray-700 hover:text-[#41005c]"
                style={{ backgroundColor: 'rgba(65, 0, 92, 0.05)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Découvrir Neuro Care
              </Link>

              {/* Blog */}
              <Link
                href="/blog"
                onClick={closeMenu}
                className="py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 text-gray-700 hover:text-[#41005c]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Blog
              </Link>

              {/* Forum */}
              <Link
                href="/community"
                onClick={closeMenu}
                className="py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 text-gray-700 hover:text-[#41005c]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Forum
              </Link>

              {/* Donnez votre avis */}
              <Link
                href="/feedback"
                onClick={closeMenu}
                className="py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 text-white shadow-md hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #41005c 0%, #5a1a75 100%)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Donnez votre avis
              </Link>

              <button
                onClick={handleLogoutClick}
                className="py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 w-full text-left"
                style={{ color: '#f0879f', backgroundColor: '#fde8ec' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Bouton hamburger visible uniquement sur mobile */}
      <button
        onClick={openMenu}
        className="p-1 text-white transition-colors duration-200 lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span className="block h-0.5 w-6 bg-white rounded-full" />
          <span className="block h-0.5 w-6 bg-white rounded-full" />
          <span className="block h-0.5 w-6 bg-white rounded-full" />
        </div>
      </button>

      {/* Rendu via portal pour être au-dessus de tout */}
      {mounted && isOpen && createPortal(menuContent, document.body)}
    </>
  );
}
