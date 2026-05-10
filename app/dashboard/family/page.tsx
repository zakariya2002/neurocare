'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import FamilyOnboarding from '@/components/FamilyOnboarding';
import OnboardingChecklistCard from '@/components/family/onboarding/ChecklistCard';
import { FEATURES } from '@/lib/feature-flags';

// Labels des professions
const professionLabels: { [key: string]: string } = {
  educator: 'Éducateur spécialisé',
  moniteur_educateur: 'Moniteur éducateur',
  psychologist: 'Psychologue',
  psychomotricist: 'Psychomotricien',
  occupational_therapist: 'Ergothérapeute',
  speech_therapist: 'Orthophoniste',
  physiotherapist: 'Kinésithérapeute',
  apa_teacher: 'Enseignant APA',
  music_therapist: 'Musicothérapeute',
};

interface UpcomingAppointment {
  id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  notes?: string;
  educator: {
    id: string;
    first_name: string;
    last_name: string;
    profession_type: string;
    avatar_url?: string;
  };
}

export default function FamilyDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    fetchData();

    if (searchParams.get('booking') === 'success') {
      setShowSuccessMessage(true);
    }
  }, []);

  const handleCloseSuccessMessage = () => {
    setShowSuccessMessage(false);
    router.replace('/dashboard/family');
  };

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    setUserId(session.user.id);
    setUserEmail(session.user.email || null);

    const { data } = await supabase
      .from('family_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (data) {
      setProfile(data);
      setFamilyId(data.id);
      // Fetch upcoming appointments immediately without waiting for re-render
      fetchUpcomingAppointments(data.id);
    }
  };

  const fetchUpcomingAppointments = async (fId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        status,
        notes,
        educator:educator_profiles!educator_id (
          id,
          first_name,
          last_name,
          profession_type,
          avatar_url
        )
      `)
      .eq('family_id', fId)
      .gte('appointment_date', today)
      .in('status', ['accepted', 'confirmed'])
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching appointments:', error);
    }

    if (data) {
      // Mapper les données pour gérer le format tableau de Supabase
      const mappedData = data.map((apt: any) => ({
        ...apt,
        educator: Array.isArray(apt.educator) && apt.educator.length > 0
          ? apt.educator[0]
          : apt.educator
      }));
      setUpcomingAppointments(mappedData as UpcomingAppointment[]);
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

  // Déterminer l'icône de profil selon le genre
  const getProfileIcon = () => {
    if (profile?.gender === 'male') return '/images/icons/avatar-male.svg';
    if (profile?.gender === 'female') return '/images/icons/avatar-female.svg';
    return (profile?.id?.charCodeAt(0) || 0) % 2 === 0 ? '/images/icons/avatar-male.svg' : '/images/icons/avatar-female.svg';
  };

  // Déterminer l'icône de profil d'un éducateur (basé sur l'ID pour la consistance)
  const getEducatorIcon = (id?: string) => {
    return (id?.charCodeAt(0) || 0) % 2 === 0 ? '/images/icons/avatar-male.svg' : '/images/icons/avatar-female.svg';
  };

  // Menu items configuration
  type MenuItem = {
    href: string;
    label: string;
    icon: string | React.ReactNode;
    tourId?: string;
  };

  const menuItems: MenuItem[] = [
    {
      href: '/dashboard/family/profile',
      label: 'Mon profil',
      icon: getProfileIcon(),
      tourId: 'action-profile',
    },
    {
      href: '/dashboard/family/favorites',
      label: 'Mes favoris',
      icon: '/images/icons/favorite-heart.svg',
      tourId: 'action-favorites',
    },
    {
      href: '/dashboard/family/children',
      label: 'Mes proches',
      icon: '/images/icons/3.svg',
      tourId: 'action-children',
    },
    {
      href: '/dashboard/family/receipts',
      label: 'Mes reçus',
      icon: '/images/icons/7.svg',
      tourId: 'action-receipts',
    },
    {
      href: '/dashboard/family/bookings',
      label: 'Mes rendez-vous',
      icon: '/images/icons/4.svg',
      tourId: 'action-bookings',
    },
    {
      href: '/dashboard/family/search',
      label: 'Recherche',
      icon: '/images/icons/9.svg',
      tourId: 'action-search',
    },
    {
      href: '/dashboard/family/messages',
      label: 'Mes messages',
      icon: '/images/icons/5.svg',
      tourId: 'action-messages',
    },
    {
      href: '/dashboard/family/aides',
      label: 'Aide',
      icon: '/images/icons/8.svg',
      tourId: 'action-help',
    },
    ...(FEATURES.onboardingPostDiag
      ? [{
          href: '/dashboard/family/onboarding',
          label: 'Premiers pas',
          icon: (
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
              <svg className="w-5 h-5" fill="none" stroke="#d97706" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          ) as React.ReactNode,
        }]
      : []),
    ...(FEATURES.rappelsMdph
      ? [{
          href: '/dashboard/family/rappels',
          label: 'Rappels MDPH',
          icon: (
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fee2e2' }}>
              <svg className="w-5 h-5" fill="none" stroke="#dc2626" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          ) as React.ReactNode,
        }]
      : []),
    ...(FEATURES.courriersAdmin
      ? [{
          href: '/dashboard/family/courriers',
          label: 'Modèles de courriers',
          icon: (
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
              <svg className="w-5 h-5" fill="none" stroke="#2563eb" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          ) as React.ReactNode,
        }]
      : []),
    ...(FEATURES.justificatifsAnnuels
      ? [{
          href: '/dashboard/family/receipts/annuel',
          label: 'Justificatif annuel',
          icon: (
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#c9eaea' }}>
              <svg className="w-5 h-5" fill="none" stroke="#027e7e" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          ) as React.ReactNode,
        }]
      : []),
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navbar teal */}
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      {/* Tutoriel d'onboarding */}
      {familyId && <FamilyOnboarding familyId={familyId} userEmail={userEmail || undefined} />}

      {/* Bandeau de bienvenue */}
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-5 md:py-6 flex items-center justify-start lg:justify-center gap-4" style={{ backgroundColor: '#05a5a5' }} data-tour="welcome-banner">
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
                src={profile?.gender === 'male' ? '/images/icons/avatar-male.svg' : profile?.gender === 'female' ? '/images/icons/avatar-female.svg' : ((profile?.id?.charCodeAt(0) || 0) % 2 === 0 ? '/images/icons/avatar-male.svg' : '/images/icons/avatar-female.svg')}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Texte de bienvenue */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">
              Bonjour {profile?.first_name || 'Utilisateur'}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 pb-8 lg:max-w-5xl lg:mx-auto lg:w-full lg:px-8 px-3 sm:px-4 md:px-6">
        {/* Message de succès après paiement */}
        {showSuccessMessage && (
          <div className="lg:mx-0 mt-3 sm:mt-4 bg-green-50 border border-green-200 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-green-900 mb-1">
                  Réservation confirmée !
                </h2>
                <p className="text-sm text-green-800 mb-3">
                  Votre rendez-vous a été réservé avec succès. Un email de confirmation vous a été envoyé.
                </p>

                {/* Informations importantes */}
                <div className="bg-white rounded-lg p-3 border border-green-200 space-y-2">
                  <p className="text-xs font-semibold text-green-900 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Comment ça fonctionne :
                  </p>
                  <ul className="text-xs text-green-800 space-y-1.5 ml-1">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600">1.</span>
                      <span>Vous avez reçu un <strong>code PIN à 4 chiffres</strong> par email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600">2.</span>
                      <span>Donnez ce code au professionnel au <strong>début de la séance</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600">3.</span>
                      <span>Le paiement est prélevé <strong>uniquement après la réalisation</strong> du RDV</span>
                    </li>
                  </ul>

                  <div className="pt-2 border-t border-green-100 mt-2">
                    <p className="text-xs text-amber-700 flex items-start gap-1">
                      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Annulation gratuite jusqu&apos;à 48h avant. Après : 50% de la prestation sera débité.</span>
                    </p>
                  </div>
                </div>
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

        {/* Section Mes prochains rendez-vous */}
        <div className="mt-3 sm:mt-4 md:mt-6 lg:px-0" data-tour="appointments-section">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3">Mes prochains rendez-vous</h2>

          {upcomingAppointments.length > 0 ? (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex-shrink-0 bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 overflow-hidden"
                  style={{ width: 'calc(50% - 8px)', minWidth: '170px', scrollSnapAlign: 'start' }}
                >
                  {/* Date badge */}
                  <div
                    className="px-2.5 sm:px-3 py-2 sm:py-3 flex items-center gap-2"
                    style={{ backgroundColor: '#027e7e' }}
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[11px] md:text-xs font-semibold text-white">
                      {formatAppointmentDate(apt.appointment_date, apt.start_time)}
                    </span>
                  </div>

                  {/* Educator info */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Avatar éducateur */}
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200" style={{ background: apt.educator?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #027e7e 0%, #3a9e9e 100%)' }}>
                        {apt.educator?.avatar_url ? (
                          <img
                            src={apt.educator.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={getEducatorIcon(apt.educator?.id)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 text-sm">
                          {apt.educator?.first_name}
                        </p>
                        <p className="font-bold text-gray-900 text-sm">
                          {apt.educator?.last_name?.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {professionLabels[apt.educator?.profession_type] || 'Professionnel'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f5f5' }}>
                <svg className="w-8 h-8" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-xs md:text-sm mb-3 sm:mb-4">Vous n'avez pas encore de rendez-vous prévu</p>
              <Link
                href="/dashboard/family/search"
                className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 text-xs sm:text-sm md:text-base text-white font-semibold rounded-xl transition-all hover:opacity-90"
                style={{ backgroundColor: '#027e7e' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher un professionnel
              </Link>
            </div>
          )}
        </div>

        {/* Bloc Premiers pas (A1) — visible tant que l'onboarding post-diagnostic n'est pas terminé */}
        {FEATURES.onboardingPostDiag && familyId && (
          <OnboardingChecklistCard familyId={familyId} />
        )}

        {/* Section Mon compte */}
        <div className="mt-3 sm:mt-4 md:mt-6 lg:mx-0 bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden" data-tour="account-section">
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
                  data-tour={item.tourId}
                >
                  {typeof item.icon === 'string' ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={item.icon}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0">{item.icon}</div>
                  )}
                  <span className="font-medium text-gray-900 text-xs md:text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Espace pour iOS */}
        <div className="h-20"></div>
      </div>

      {/* Footer teal */}
      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
