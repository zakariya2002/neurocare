'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import EducatorMobileMenu from '@/components/EducatorMobileMenu';
import NotificationBell from '@/components/NotificationBell';

interface EducatorNavbarProps {
  profile?: any;
  /** @deprecated plus utilisé, conservé pour compatibilité tant que les appelants ne sont pas nettoyés */
  subscription?: any;
}

export default function EducatorNavbar({ profile: propProfile }: EducatorNavbarProps) {
  const [profile, setProfile] = useState<any>(propProfile || null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(!propProfile);
  const pathname = usePathname();

  useEffect(() => {
    // Toujours récupérer le userId depuis la session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });

    if (!propProfile) {
      fetchData();
    } else {
      setProfile(propProfile);
    }
  }, [propProfile]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setUserId(session.user.id);

      // Récupérer le profil éducateur
      const { data: educatorProfile } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (educatorProfile) {
        setProfile(educatorProfile);
      }
    } catch (error) {
      console.error('Erreur chargement navbar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/dashboard/educator', label: 'Accueil', exact: true },
    { href: '/dashboard/educator/profile', label: 'Mon profil' },
    { href: '/dashboard/educator/appointments', label: 'RDV' },
    { href: '/dashboard/educator/availability', label: 'Disponibilités' },
    { href: '/dashboard/educator/payouts', label: 'Paiements' },
    { href: '/dashboard/educator/invoices', label: 'Factures' },
    { href: '/dashboard/educator/subscription', label: 'Abonnement' },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  const isHomePage = pathname === '/dashboard/educator';

  return (
    <nav className="sticky top-0 z-40" style={{ backgroundColor: '#41005c' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 relative">
          {/* Gauche: Hamburger (mobile) ou Notifications (desktop) */}
          <div className="flex items-center">
            <div className="lg:hidden">
              <EducatorMobileMenu profile={profile} onLogout={handleLogout} />
            </div>
            <div className="hidden lg:block">
              {profile?.id && userId && (
                <NotificationBell educatorId={profile.id} userId={userId} position="left" />
              )}
            </div>
          </div>

          {/* Centre: Logo */}
          <Link href="/dashboard/educator" className="absolute left-1/2 transform -translate-x-1/2" aria-label="Accueil">
            <div className="flex items-center gap-1.5">
              <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-16" />
              <span className="px-1.5 py-0.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: '#f0879f' }}>PRO</span>
            </div>
          </Link>

          {/* Droite: Notifications (mobile) ou Déconnexion (desktop) */}
          <div className="flex items-center">
            <div className="lg:hidden">
              {profile?.id && userId && (
                <NotificationBell educatorId={profile.id} userId={userId} position="right" />
              )}
            </div>
            <button
              onClick={handleLogout}
              className="hidden lg:block px-4 py-2 font-medium transition rounded-lg hover:opacity-90"
              style={{ backgroundColor: '#fdf9f4', color: '#41005c' }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
