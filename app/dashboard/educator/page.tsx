'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import EducatorMobileMenu from '@/components/EducatorMobileMenu';
import NotificationBell from '@/components/NotificationBell';
import { getProfessionByValue } from '@/lib/professions-config';

interface UpcomingAppointment {
  id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  notes?: string;
  family: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export default function EducatorDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [subscription, setSubscription] = useState<any>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [syncingSubscription, setSyncingSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();

    if (searchParams.get('subscription') === 'success') {
      setShowSuccessMessage(true);
    }
  }, []);

  const handleCloseSuccessMessage = () => {
    setShowSuccessMessage(false);
    router.replace('/dashboard/educator');
  };

  const loadDashboard = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/pro/login');
      return;
    }

    setUserId(session.user.id);

    const { data: profileData } = await supabase
      .from('educator_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    // Set profile immediately so UI renders
    setProfile(profileData);

    // Fetch subscription + appointments in parallel
    const today = new Date().toISOString().split('T')[0];

    const [subResult, aptsResult] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('*')
        .eq('educator_id', profileData.id)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .maybeSingle(),
      supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          status,
          notes,
          family:family_profiles!family_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('educator_id', profileData.id)
        .gte('appointment_date', today)
        .in('status', ['accepted', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5),
    ]);

    setSubscription(subResult.data);

    if (aptsResult.data) {
      const mappedData = aptsResult.data.map((apt: any) => ({
        ...apt,
        family: Array.isArray(apt.family) && apt.family.length > 0
          ? apt.family[0]
          : apt.family
      }));
      setUpcomingAppointments(mappedData as UpcomingAppointment[]);
    }

    setLoading(false);

    if (searchParams.get('subscription') === 'success' && !subResult.data && profileData.id) {
      syncSubscription(profileData.id);
    }
  };

  const syncSubscription = async (educatorId: string) => {
    if (syncingSubscription) return;

    setSyncingSubscription(true);
    try {
      const response = await fetch('/api/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ educatorId }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        window.location.href = '/dashboard/educator';
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSyncingSubscription(false);
    }
  };

  const formatAppointmentDate = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    const formattedDate = date.toLocaleDateString('fr-FR', options);
    const time = timeStr?.slice(0, 5) || '';
    return `${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)} à ${time}`;
  };

  const isPremium = subscription && ['active', 'trialing'].includes(subscription.status);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  // Déterminer l'icône de profil selon le genre
  const getProfileIcon = () => {
    if (profile?.gender === 'male') return '/images/icons/avatar-male.svg';
    if (profile?.gender === 'female') return '/images/icons/avatar-female.svg';
    return (profile?.id?.charCodeAt(0) || 0) % 2 === 0 ? '/images/icons/avatar-male.svg' : '/images/icons/avatar-female.svg';
  };

  // Déterminer l'icône pour une famille
  const getFamilyIcon = (id?: string) => {
    return (id?.charCodeAt(0) || 0) % 2 === 0 ? '/images/icons/avatar-male.svg' : '/images/icons/avatar-female.svg';
  };

  // Menu items configuration pour les professionnels
  const menuItems = [
    {
      href: '/dashboard/educator/profile',
      label: 'Mon profil',
      icon: getProfileIcon(),
    },
    {
      href: '/dashboard/educator/appointments',
      label: 'Rendez-vous',
      icon: '/images/icons/4.svg',
    },
    {
      href: '/dashboard/educator/availability',
      label: 'Disponibilités',
      icon: '/images/icons/clock.svg',
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: '/images/icons/5.svg',
    },
    {
      href: '/dashboard/educator/invoices',
      label: 'Mes factures',
      icon: '/images/icons/7.svg',
    },
    {
      href: '/dashboard/educator/diploma',
      label: 'Vérification',
      icon: '/images/icons/diploma.svg',
    },
    {
      href: '/dashboard/educator/payouts',
      label: 'Paiements',
      icon: '/images/icons/subscription.svg',
    },
    {
      href: '/pro/sap-accreditation',
      label: 'Agrément SAP',
      icon: '/images/icons/sap-badge.svg',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        {/* Navbar skeleton */}
        <div className="sticky top-0 z-40 h-14" style={{ backgroundColor: '#41005c' }}>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="w-7 h-7 rounded bg-white/20 animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-10 w-24 rounded bg-white/20 animate-pulse" />
              <div className="px-2 py-0.5 rounded-full w-10 h-5 bg-white/20 animate-pulse" />
            </div>
            <div className="w-7 h-7 rounded bg-white/20 animate-pulse" />
          </div>
        </div>
        {/* Welcome banner skeleton */}
        <div className="px-4 py-5 flex items-center gap-4" style={{ backgroundColor: '#5a1a75' }}>
          <div className="w-14 h-14 rounded-full bg-white/20 animate-pulse flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-white/20 animate-pulse" />
            <div className="h-3 w-28 rounded bg-white/20 animate-pulse" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 px-3 sm:px-4 py-4">
          <div className="h-4 w-48 rounded bg-gray-200 animate-pulse mb-3" />
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <div className="h-20 rounded-lg bg-gray-100 animate-pulse" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                  <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navbar violet */}
      <nav className="sticky top-0 z-40" style={{ backgroundColor: '#41005c' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 relative">
            {/* Menu Hamburger */}
            <EducatorMobileMenu profile={profile} isPremium={isPremium} onLogout={handleLogout} />

            {/* Logo centré */}
            <Link href="/dashboard/educator" className="absolute left-1/2 transform -translate-x-1/2" aria-label="Retour au tableau de bord">
              <div className="flex items-center gap-1">
                <img
                  src="/images/logo-neurocare.svg"
                  alt="NeuroCare Pro"
                  className="h-16"
                />
                <span className="px-1.5 py-0.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: '#f0879f' }}>PRO</span>
              </div>
            </Link>

            {/* Notifications à droite */}
            <div className="flex items-center">
              {profile?.id && userId && (
                <NotificationBell educatorId={profile.id} userId={userId} />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Bandeau de bienvenue */}
      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 flex items-center justify-start lg:justify-center gap-4" style={{ backgroundColor: '#5a1a75' }}>
        <div className="flex items-center gap-4 lg:flex-col lg:text-center">
          {/* Avatar */}
          <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={getProfileIcon()}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Texte de bienvenue */}
          <div>
            <div className="flex items-center gap-2 flex-wrap lg:justify-center">
              <h1 className="text-xl lg:text-2xl font-bold text-white">
                Bonjour {profile?.first_name || 'Professionnel'}
              </h1>
              {isPremium && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-white text-xs font-bold rounded-full" style={{ backgroundColor: '#f0879f' }}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Premium
                </span>
              )}
            </div>
            <p className="text-white/80 text-sm mt-0.5">
              {getProfessionByValue(profile?.profession_type)?.label || 'Professionnel'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 pb-8 lg:max-w-5xl lg:mx-auto lg:w-full lg:px-8 px-0">
        {/* Message de succès après paiement */}
        {showSuccessMessage && (
          <div className="mx-3 sm:mx-4 lg:mx-0 mt-3 sm:mt-4 bg-green-50 border border-green-200 rounded-xl md:rounded-2xl p-3 sm:p-4" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-green-900 mb-1">
                  Abonnement activé !
                </h2>
                <p className="text-sm text-green-800">
                  Bienvenue dans NeuroCare Pro. Votre abonnement est maintenant actif.
                </p>
              </div>
              <button
                onClick={handleCloseSuccessMessage}
                className="flex-shrink-0 text-green-600 hover:text-green-800 transition"
                aria-label="Fermer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Message de synchronisation */}
        {syncingSubscription && (
          <div className="mx-3 sm:mx-4 lg:mx-0 mt-3 sm:mt-4 bg-blue-50 border border-blue-200 rounded-xl md:rounded-2xl p-3 sm:p-4 flex items-center gap-3" role="status" aria-live="polite">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" aria-hidden="true"></div>
            <p className="text-blue-800 font-medium">
              Synchronisation de votre abonnement en cours...
            </p>
          </div>
        )}

        {/* Alerte si profil non vérifié */}
        {profile && !profile.verification_badge && (
          <div className="mx-3 sm:mx-4 lg:mx-0 mt-3 sm:mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl md:rounded-2xl p-3 sm:p-4" role="alert">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-gray-900 mb-1">
                  Profil non vérifié
                </h2>
                <p className="text-xs text-gray-700 mb-3">
                  Complétez la vérification pour être visible des familles.
                </p>
                <Link
                  href="/dashboard/educator/diploma"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold text-xs transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Vérifier mon profil
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Section Mes prochains rendez-vous */}
        <div className="mt-4 sm:mt-6 lg:mt-8 px-3 sm:px-4 lg:px-0">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3">Mes prochains rendez-vous</h2>

          {upcomingAppointments.length > 0 ? (
            <div
              className={`flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-hide ${upcomingAppointments.length === 1 ? 'justify-center sm:justify-start' : ''}`}
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex-shrink-0 bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 overflow-hidden"
                  style={{
                    width: upcomingAppointments.length === 1 ? 'calc(80% - 8px)' : 'calc(55% - 6px)',
                    minWidth: upcomingAppointments.length === 1 ? '280px' : '200px',
                    maxWidth: upcomingAppointments.length === 1 ? '350px' : '260px',
                    scrollSnapAlign: 'start'
                  }}
                >
                  {/* Date badge */}
                  <div
                    className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2"
                    style={{ backgroundColor: '#41005c' }}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      {formatAppointmentDate(apt.appointment_date, apt.start_time)}
                    </span>
                  </div>

                  {/* Family info */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar famille */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200" style={{ background: apt.family?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #41005c 0%, #5a1a75 100%)' }}>
                        {apt.family?.avatar_url ? (
                          <img
                            src={apt.family.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={getFamilyIcon(apt.family?.id)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 text-sm">
                          {apt.family?.first_name}
                        </p>
                        <p className="font-bold text-gray-900 text-sm">
                          {apt.family?.last_name?.toUpperCase()}
                        </p>
                        <p className="text-[10px] sm:text-xs mt-1 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)', color: '#41005c' }}>
                          Famille
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                <svg className="w-8 h-8" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-xs md:text-sm mb-3 sm:mb-4">Vous n'avez pas encore de rendez-vous prévu</p>
              <Link
                href="/dashboard/educator/appointments"
                className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 text-xs sm:text-sm md:text-base text-white font-semibold rounded-xl transition-all hover:opacity-90"
                style={{ backgroundColor: '#41005c' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Voir mes demandes
              </Link>
            </div>
          )}
        </div>

        {/* Section Mon compte */}
        <div className="mt-4 sm:mt-6 lg:mt-8 mx-3 sm:mx-4 lg:mx-0 bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-gray-100">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Mon compte</h2>
          </div>

          <div className="p-2 sm:p-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={item.icon}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-medium text-gray-900 text-xs sm:text-sm whitespace-nowrap">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Espace pour iOS */}
        <div className="h-20"></div>
      </div>

      {/* Footer violet */}
      <div className="mt-auto" style={{ backgroundColor: '#41005c', height: '40px' }}></div>
    </div>
  );
}
