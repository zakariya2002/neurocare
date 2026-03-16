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
  subscription?: any;
}

export default function EducatorNavbar({ profile: propProfile, subscription: propSubscription }: EducatorNavbarProps) {
  const [profile, setProfile] = useState<any>(propProfile || null);
  const [subscription, setSubscription] = useState<any>(propSubscription || null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(!propProfile);
  const pathname = usePathname();

  useEffect(() => {
    if (!propProfile) {
      fetchData();
    } else {
      setProfile(propProfile);
      setSubscription(propSubscription);
    }
  }, [propProfile, propSubscription]);

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

        // Récupérer l'abonnement
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('educator_id', educatorProfile.id)
          .single();

        setSubscription(sub);
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

  const isPremium = subscription && ['active', 'trialing'].includes(subscription.status);

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
          {/* Mobile: Hamburger à gauche */}
          <div className="flex items-center lg:hidden">
            <EducatorMobileMenu profile={profile} isPremium={isPremium} onLogout={handleLogout} />
          </div>

          {/* Desktop: Logo à gauche (seulement sur la page d'accueil) */}
          {isHomePage ? (
            <Link href="/dashboard/educator" className="hidden lg:flex items-center gap-2" aria-label="Retour au tableau de bord éducateur">
              <img
                src="/images/logo-neurocare.svg"
                alt="NeuroCare"
                className="h-10"
              />
              <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: '#f0879f' }}>
                PRO
              </span>
            </Link>
          ) : (
            /* Desktop: Notifications à gauche (sur les autres pages) */
            <div className="hidden lg:flex items-center">
              {profile?.id && userId && (
                <NotificationBell educatorId={profile.id} userId={userId} position="left" />
              )}
            </div>
          )}

          {/* Mobile: Logo centré */}
          <Link href="/dashboard/educator" className="lg:hidden absolute left-1/2 transform -translate-x-1/2" aria-label="Retour au tableau de bord éducateur">
            <div className="flex items-center gap-2">
              <img
                src="/images/logo-neurocare.svg"
                alt="NeuroCare"
                className="h-10"
              />
              <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: '#f0879f' }}>
                PRO
              </span>
            </div>
          </Link>

          {/* Desktop: Navigation centrale */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href, link.exact)
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Droite: Notifications (seulement sur accueil) et déconnexion */}
          <div className="flex items-center gap-3">
            {isHomePage && profile?.id && userId && (
              <NotificationBell educatorId={profile.id} userId={userId} />
            )}
            {/* Mobile: toujours afficher les notifications à droite */}
            <div className="lg:hidden">
              {profile?.id && userId && (
                <NotificationBell educatorId={profile.id} userId={userId} />
              )}
            </div>
            <button onClick={handleLogout} className="hidden lg:block text-white/80 hover:text-white px-3 py-1.5 text-sm font-medium transition">
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
