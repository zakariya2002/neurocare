'use client';

import Link from 'next/link';
import FamilyMobileMenu from '@/components/FamilyMobileMenu';
import FamilyNotificationBell from '@/components/FamilyNotificationBell';
import { signOut } from '@/lib/auth';

interface FamilyNavbarProps {
  profile?: any;
  familyId?: string | null;
  userId?: string | null;
}

export default function FamilyNavbar({ profile, familyId, userId }: FamilyNavbarProps) {
  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <nav className="z-40 flex-shrink-0" style={{ backgroundColor: '#027e7e' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center relative">
          {/* Mobile: Hamburger à gauche */}
          <div className="flex items-center md:hidden">
            <FamilyMobileMenu profile={profile} onLogout={handleLogout} />
          </div>

          {/* Desktop: Notifications à gauche */}
          <div className="hidden md:flex items-center">
            {familyId && userId && (
              <FamilyNotificationBell familyId={familyId} userId={userId} />
            )}
          </div>

          {/* Logo centré */}
          <Link href="/dashboard/family" className="absolute left-1/2 transform -translate-x-1/2">
            <img
              src="/images/logo-neurocare.svg"
              alt="NeuroCare - Retour au tableau de bord"
              className="h-10"
            />
          </Link>

          {/* Droite: Notifications mobile + Déconnexion desktop */}
          <div className="flex items-center gap-2">
            {/* Mobile: Notifications à droite */}
            <div className="md:hidden">
              {familyId && userId && (
                <FamilyNotificationBell familyId={familyId} userId={userId} />
              )}
            </div>
            {/* Bouton déconnexion desktop */}
            <button
              onClick={handleLogout}
              className="hidden md:block px-4 py-2 font-medium transition rounded-lg hover:opacity-90"
              style={{ backgroundColor: '#fdf9f4', color: '#027e7e' }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
