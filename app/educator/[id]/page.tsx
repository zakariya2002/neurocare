'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import PublicNavbar from '@/components/PublicNavbar';
import FamilyNavbar from '@/components/FamilyNavbar';
import ContactQuestionnaireModal from '@/components/ContactQuestionnaireModal';
import WaitlistJoinModal from '@/components/waitlist/WaitlistJoinModal';
import { useToast } from '@/components/Toast';
interface EducatorProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string;
  phone: string;
  location: string;
  years_of_experience: number;
  hourly_rate: number;
  specializations: string[];
  skills: string | null;
  languages: string[];
  avatar_url: string | null;
  avatar_moderation_status: string;
  cv_url: string | null;
  linkedin_url: string | null;
  video_presentation_url: string | null;
  video_duration_seconds: number | null;
  gender: 'male' | 'female' | null;
  created_at: string;
}

interface WeeklySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Exception {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  exception_type: 'blocked' | 'available' | 'vacation';
  reason: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  family: {
    first_name: string;
  };
}

// Fonction pour capitaliser correctement un prénom
const capitalizeFirstName = (name: string): string => {
  if (!name || !name.trim()) return '';
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Fonction pour formater un nom de famille
const formatLastName = (name: string): string => {
  if (!name || !name.trim()) return '';
  return name.trim().toUpperCase();
};

// Fonction pour obtenir le nom complet formaté
const getFormattedFullName = (firstName: string, lastName: string): string => {
  const formattedFirstName = capitalizeFirstName(firstName);
  const formattedLastName = formatLastName(lastName);

  if (formattedFirstName && formattedLastName) {
    return `${formattedFirstName} ${formattedLastName}`;
  } else if (formattedLastName) {
    return formattedLastName;
  } else if (formattedFirstName) {
    return formattedFirstName;
  }
  return 'Profil sans nom';
};

const DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

export default function EducatorPublicProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [educator, setEducator] = useState<EducatorProfile | null>(null);
  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>([]);
  const [dailyAvailabilities, setDailyAvailabilities] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'educator' | 'family' | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'availability' | 'cv' | 'video' | 'reviews'>('about');
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [familyProfileId, setFamilyProfileId] = useState<string | null>(null);
  const [familyProfile, setFamilyProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isBlockedByEducator, setIsBlockedByEducator] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initPage = async () => {
      try {
        // Vérifier l'authentification de manière non-intrusive
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted && session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);

          // Parallelize educator and family profile checks
          const [educatorProfileResult, familyProfileResult] = await Promise.all([
            supabase
              .from('educator_profiles')
              .select('id')
              .eq('user_id', session.user.id)
              .single(),
            supabase
              .from('family_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single(),
          ]);

          if (educatorProfileResult.data) {
            setUserRole('educator');
          } else if (familyProfileResult.data) {
            setUserRole('family');
            setFamilyProfileId(familyProfileResult.data.id);
            setFamilyProfile(familyProfileResult.data);

            // Vérifier si la famille est bloquée par cet éducateur
            try {
              const response = await fetch(`/api/check-blocked?educatorId=${params.id}&familyId=${familyProfileResult.data.id}`);
              if (response.ok) {
                const data = await response.json();
                if (data.isBlocked) {
                  setIsBlockedByEducator(true);
                  setError('Ce profil n\'est plus accessible');
                  setLoading(false);
                  return;
                }
              }
            } catch (e) {
              console.error('Erreur vérification blocage:', e);
            }
          }
        }

        // Charger le profil
        await fetchEducatorProfile();
      } catch (error) {
        console.error('Erreur initialisation:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      }
    };

    initPage();

    // Cleanup pour éviter les mises à jour après unmount
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const handleContact = async () => {
    if (isAuthenticated) {
      // Si c'est une famille, vérifier si une conversation existe déjà
      if (userRole === 'family' && familyProfileId) {
        // Vérifier si une conversation existe déjà
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('educator_id', params.id)
          .eq('family_id', familyProfileId)
          .single();

        if (existingConv) {
          // Si une conversation existe, rediriger directement vers la messagerie
          router.push(`/messages?educator=${params.id}`);
        } else {
          // Sinon, ouvrir le modal questionnaire pour créer une nouvelle conversation
          setShowContactModal(true);
        }
      } else {
        // Si c'est un éducateur, rediriger vers la messagerie
        router.push(`/messages?educator=${params.id}`);
      }
    } else {
      // Rediriger vers la connexion avec un redirect vers cette page
      router.push(`/auth/login?redirect=/educator/${params.id}`);
    }
  };

  const handleQuestionnaireSubmit = async (data: any, childId: string | null) => {
    if (!familyProfileId) return;

    try {
      // Vérifier si une conversation existe déjà
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('educator_id', params.id)
        .eq('family_id', familyProfileId)
        .single();

      if (existingConv) {
        // Si une conversation existe déjà, mettre à jour avec les nouvelles données
        await supabase
          .from('conversations')
          .update({
            questionnaire_data: data,
            child_id: childId,
            request_message: data.message || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingConv.id);
      } else {
        // Créer une nouvelle conversation avec les données du questionnaire
        const { error: insertError } = await supabase
          .from('conversations')
          .insert({
            educator_id: params.id,
            family_id: familyProfileId,
            status: 'pending',
            questionnaire_data: data,
            child_id: childId,
            request_message: data.message || null,
          });

        if (insertError) {
          console.error('Erreur création conversation:', insertError);
          throw insertError;
        }
      }

      // Fermer le modal et rediriger vers la messagerie
      setShowContactModal(false);
      router.push(`/messages?educator=${params.id}`);
    } catch (error) {
      console.error('Erreur envoi questionnaire:', error);
      showToast('Une erreur est survenue lors de l\'envoi de votre demande.', 'error');
    }
  };

  const fetchEducatorProfile = async () => {
    setLoading(true);
    setError('');

    try {
      // Récupérer le profil éducateur (requête publique, pas besoin d'être connecté)
      const { data: profile, error: profileError } = await supabase
        .from('public_educator_profiles')
        .select('*')
        .eq('id', params.id)
        .single();

      if (profileError) {
        console.error('Erreur profil:', profileError);
        setError('Profil éducateur introuvable');
        setLoading(false);
        return;
      }

      if (!profile) {
        setError('Profil éducateur introuvable');
        setLoading(false);
        return;
      }

      setEducator(profile);

      // Tous les éducateurs sont Premium (pas d'abonnement requis)
      setIsPremium(true);

      // Tracker la vue du profil (en arrière-plan, ne pas bloquer l'affichage)
      fetch('/api/track-profile-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ educatorId: params.id }),
      }).catch(error => console.error('Erreur tracking vue:', error));

      // Tracking Meta — vue de fiche pro (utilisé pour les audiences retargeting)
      import('@/lib/meta-pixel').then(({ trackEvent }) => {
        trackEvent('ViewContent', {
          content_type: 'educator_profile',
          content_ids: [params.id],
          content_name: `${profile.first_name} ${profile.last_name}`.trim(),
        });
      });

      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().slice(0, 5); // Format "HH:MM"

      // Parallelize all independent queries that use params.id
      const [slotsResult, dailySlotsResult, excsResult, reviewsResult] = await Promise.all([
        // Récupérer les disponibilités hebdomadaires (ancien système)
        supabase
          .from('educator_weekly_availability')
          .select('*')
          .eq('educator_id', params.id)
          .eq('is_active', true)
          .order('day_of_week')
          .order('start_time'),
        // Récupérer les disponibilités quotidiennes (nouveau système)
        supabase
          .from('educator_availability')
          .select('*')
          .eq('educator_id', params.id)
          .eq('is_available', true)
          .gte('availability_date', today)
          .order('availability_date')
          .order('start_time')
          .limit(30),
        // Récupérer les exceptions (uniquement futures)
        supabase
          .from('educator_availability_exceptions')
          .select('*')
          .eq('educator_id', params.id)
          .gte('date', today)
          .order('date')
          .limit(10),
        // Récupérer les avis
        supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            family_id
          `)
          .eq('educator_id', params.id)
          .order('created_at', { ascending: false }),
      ]);

      if (!slotsResult.error && slotsResult.data) {
        setWeeklySlots(slotsResult.data);
      }

      if (!dailySlotsResult.error && dailySlotsResult.data) {
        // Filtrer les créneaux d'aujourd'hui dont l'heure de fin est passée
        const filteredSlots = dailySlotsResult.data.filter(slot => {
          if (slot.availability_date === today) {
            return slot.end_time > currentTime;
          }
          return true;
        });
        setDailyAvailabilities(filteredSlots);
      }

      if (!excsResult.error && excsResult.data) {
        setExceptions(excsResult.data);
      }

      if (!reviewsResult.error && reviewsResult.data) {
        setReviews(reviewsResult.data.map((r: any) => ({
          ...r,
          family: { first_name: 'Famille' }
        })));
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Erreur chargement profil:', err);
      setError('Erreur lors du chargement du profil');
      setLoading(false);
    }
  };

  const getDayLabel = (dayNum: number) => {
    return DAYS.find(d => d.value === dayNum)?.label || '';
  };

  const getExceptionTypeLabel = (type: string) => {
    const labels = {
      blocked: 'Indisponible',
      available: 'Disponible',
      vacation: 'Vacances'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getExceptionTypeColor = (type: string) => {
    const colors = {
      blocked: 'bg-red-100 text-red-700 border-red-200',
      available: 'bg-green-100 text-green-700 border-green-200',
      vacation: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#027e7e' }} role="status" aria-label="Chargement en cours"></div>
          <p className="mt-4 text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !educator) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4">
            {isBlockedByEducator ? (
              <svg className="mx-auto h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
            {isBlockedByEducator ? 'Profil non accessible' : 'Profil introuvable'}
          </h1>
          <p className="text-gray-600 mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {isBlockedByEducator
              ? 'Ce professionnel a choisi de ne plus être visible pour vous. Vous pouvez rechercher d\'autres professionnels disponibles.'
              : error
            }
          </p>
          <Link
            href="/search"
            className="inline-block px-6 py-3 text-white rounded-md hover:opacity-90 transition-all"
            style={{ backgroundColor: '#027e7e' }}
          >
            {isBlockedByEducator ? 'Rechercher d\'autres professionnels' : 'Retour à la recherche'}
          </Link>
        </div>
      </div>
    );
  }

  const showAvatar = educator.avatar_url && educator.avatar_moderation_status === 'approved';

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      {userRole === 'family' ? (
        <FamilyNavbar profile={familyProfile} familyId={familyProfileId} userId={userId} />
      ) : (
        <PublicNavbar />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 xl:pt-20 pb-6 lg:pb-10">
        {/* En-tête du profil */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden mb-3 sm:mb-4 md:mb-6 border border-gray-100">
          <div className="px-4 sm:px-6 py-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {showAvatar ? (
                  <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-md ring-2 ring-gray-100">
                    <img
                      src={educator.avatar_url || undefined}
                      alt={`${educator.first_name} ${educator.last_name}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md ring-2 ring-gray-100 flex items-center justify-center">
                    <img
                      src={educator.gender === 'male' ? '/images/icons/avatar-male.svg' : educator.gender === 'female' ? '/images/icons/avatar-female.svg' : ((educator.id?.charCodeAt(0) || 0) % 2 === 0 ? '/images/icons/avatar-male.svg' : '/images/icons/avatar-female.svg')}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Informations principales */}
              <div className="flex-1 text-center sm:text-left pb-1">
                <div className="mb-3">
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Verdana, sans-serif' }}>
                      {educator.first_name?.trim() && (
                        <span style={{ color: '#027e7e' }}>
                          {capitalizeFirstName(educator.first_name)}{' '}
                        </span>
                      )}
                      <span className="text-gray-900">
                        {formatLastName(educator.last_name)}
                      </span>
                    </h1>
                  </div>
                  {!educator.first_name?.trim() && (
                    <p className="text-xs text-orange-600 italic mt-1">⚠️ Prénom non renseigné</p>
                  )}
                  {/* Étoiles */}
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1 justify-center sm:justify-start">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                          return (
                            <svg
                              key={star}
                              className={`w-3.5 h-3.5 ${star <= Math.round(avgRating) ? '' : 'text-gray-300'}`}
                              style={star <= Math.round(avgRating) ? { color: '#f0879f' } : {}}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          );
                        })}
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#f0879f' }}>
                        {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">({reviews.length} avis)</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-xs" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  <div className="flex items-center bg-gray-50 px-2 py-1.5 rounded-md">
                    <svg className="h-4 w-4 mr-1.5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium text-gray-700">{educator.location}</span>
                  </div>
                  {educator.years_of_experience && (
                    <div className="flex items-center px-2 py-1.5 rounded-md" style={{ backgroundColor: 'rgba(58, 158, 158, 0.1)' }}>
                      <svg className="h-4 w-4 mr-1.5" style={{ color: '#3a9e9e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-gray-700">
                        {educator.years_of_experience} {educator.years_of_experience > 1 ? 'ans' : 'an'} d'expérience
                      </span>
                    </div>
                  )}
                  {educator.hourly_rate && (
                    <div className="flex items-center px-2 py-1.5 rounded-md border" style={{ backgroundColor: 'rgba(107, 190, 190, 0.1)', borderColor: 'rgba(107, 190, 190, 0.3)' }}>
                      <svg className="h-4 w-4 mr-1.5" style={{ color: '#6bbebe' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-bold" style={{ color: '#027e7e' }}>{educator.hourly_rate}€/h</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bouton contact */}
              <div className="mt-4 sm:mt-0 sm:ml-4">
                <button
                  onClick={handleContact}
                  className="inline-flex items-center px-5 py-2 text-sm text-white rounded-lg hover:opacity-90 font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                  style={{ backgroundColor: '#027e7e' }}
                  aria-label={isAuthenticated ? `Envoyer un message à ${educator.first_name} ${educator.last_name}` : `Contacter ${educator.first_name} ${educator.last_name}`}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {isAuthenticated ? 'Envoyer un message' : 'Contacter'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton Demander un rendez-vous - Mis en avant */}
        {isAuthenticated && userRole === 'family' && (weeklySlots.length > 0 || dailyAvailabilities.length > 0) && (
          <div className="mb-6 space-y-3">
            <Link
              href={`/educator/${params.id}/book-appointment`}
              className="flex items-center justify-center w-full px-5 sm:px-6 py-2.5 sm:py-3 text-white rounded-lg sm:rounded-xl hover:opacity-90 font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              style={{ backgroundColor: '#027e7e' }}
              aria-label={`Demander un rendez-vous avec ${educator.first_name} ${educator.last_name}`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Demander un rendez-vous</span>
            </Link>
            <button
              type="button"
              onClick={() => setWaitlistOpen(true)}
              className="flex items-center justify-center w-full px-5 py-2.5 rounded-lg font-semibold text-sm border-2 transition-all hover:bg-[#f0fafa]"
              style={{ borderColor: '#027e7e', color: '#027e7e' }}
            >
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Aucun créneau ? Être notifié(e) d&apos;un créneau</span>
            </button>
          </div>
        )}

        {/* Bouton Waitlist seul - quand aucune dispo */}
        {isAuthenticated && userRole === 'family' && weeklySlots.length === 0 && dailyAvailabilities.length === 0 && (
          <div className="mb-6 bg-[#f0fafa] border border-[#027e7e]/20 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Aucun créneau disponible pour le moment</h3>
                <p className="text-sm text-gray-600">Inscrivez-vous en liste d&apos;attente — vous serez prévenu(e) par email dès qu&apos;un créneau s&apos;ouvre.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWaitlistOpen(true)}
              className="w-full px-5 py-2.5 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-all"
              style={{ backgroundColor: '#027e7e' }}
            >
              Être notifié(e) d&apos;un créneau
            </button>
          </div>
        )}

        {/* Modale liste d'attente */}
        {educator && (
          <WaitlistJoinModal
            educatorId={educator.id}
            educatorName={`${educator.first_name} ${educator.last_name}`}
            open={waitlistOpen}
            onClose={() => setWaitlistOpen(false)}
          />
        )}

        {/* Onglets */}
        <div className="mb-5" role="tablist" aria-label="Sections du profil">
          <div className="bg-white rounded-lg shadow-md p-1 sm:p-1.5 flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            <button
              onClick={() => setActiveTab('about')}
              role="tab"
              aria-selected={activeTab === 'about'}
              aria-controls="about-panel"
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                activeTab === 'about'
                  ? 'text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={activeTab === 'about' ? { backgroundColor: '#027e7e' } : {}}
            >
              À propos
            </button>
            <button
              onClick={() => setActiveTab('cv')}
              role="tab"
              aria-selected={activeTab === 'cv'}
              aria-controls="cv-panel"
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                activeTab === 'cv'
                  ? 'text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={activeTab === 'cv' ? { backgroundColor: '#027e7e' } : {}}
            >
              CV
            </button>
            {educator.video_presentation_url && (
              <button
                onClick={() => setActiveTab('video')}
                role="tab"
                aria-selected={activeTab === 'video'}
                aria-controls="video-panel"
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                  activeTab === 'video'
                    ? 'text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={activeTab === 'video' ? { backgroundColor: '#f0879f' } : {}}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Vidéo
              </button>
            )}
            <button
              onClick={() => setActiveTab('availability')}
              role="tab"
              aria-selected={activeTab === 'availability'}
              aria-controls="availability-panel"
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                activeTab === 'availability'
                  ? 'text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={activeTab === 'availability' ? { backgroundColor: '#027e7e' } : {}}
            >
              Disponibilités
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              role="tab"
              aria-selected={activeTab === 'reviews'}
              aria-controls="reviews-panel"
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                activeTab === 'reviews'
                  ? 'text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={activeTab === 'reviews' ? { backgroundColor: '#f0879f' } : {}}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Avis {reviews.length > 0 && `(${reviews.length})`}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-4">
            {/* Onglet À propos */}
            {activeTab === 'about' && (
              <>
            {/* Bio */}
            {educator.bio && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-2" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
                    <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>À propos</h2>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{educator.bio}</p>
              </div>
            )}

            {/* Compétences */}
            {educator.skills && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Compétences</h2>
                </div>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">
                    {educator.skills}
                  </p>
                </div>
              </div>
            )}

            {/* Diplôme */}
            {(educator as any).diploma_type && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Diplôme</h2>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-gray-900">{(educator as any).diploma_type}</h3>
                    {(educator as any).diploma_verification_status === 'verified' && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Vérifié
                      </span>
                    )}
                    {(educator as any).diploma_verification_status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                        En vérification
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
              </>
            )}

            {/* Onglet CV */}
            {activeTab === 'cv' && (
              <div role="tabpanel" id="cv-panel" aria-labelledby="cv-tab" className="bg-white rounded-xl shadow-lg p-3 sm:p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Curriculum Vitae</h2>
                </div>

                {educator.cv_url ? (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-xs sm:text-sm">Consultez le CV de l'éducateur ci-dessous :</p>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <iframe
                        src={educator.cv_url}
                        className="w-full h-[400px] sm:h-[600px]"
                        title="CV de l'éducateur"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <a
                        href={educator.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 text-white rounded-lg hover:opacity-90 font-medium transition shadow-md hover:shadow-lg text-xs sm:text-sm"
                        style={{ backgroundColor: '#027e7e' }}
                        aria-label="Ouvrir le CV en plein écran dans un nouvel onglet"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ouvrir en plein écran
                      </a>
                      <a
                        href={educator.cv_url}
                        download
                        className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition text-xs sm:text-sm"
                        aria-label="Télécharger le CV"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Télécharger
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 font-medium text-sm">Aucun CV disponible</p>
                    <p className="text-xs text-gray-500 mt-1">L'éducateur n'a pas encore téléchargé son CV.</p>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Vidéo de présentation */}
            {activeTab === 'video' && educator.video_presentation_url && (
              <div role="tabpanel" id="video-panel" aria-labelledby="video-tab" className="bg-white rounded-xl shadow-lg p-3 sm:p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mr-2" style={{ backgroundColor: '#f0879f' }}>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-bold text-gray-900">Vidéo de présentation</h2>
                    {educator.video_duration_seconds && (
                      <p className="text-xs sm:text-sm text-gray-500">
                        Durée : {Math.floor(educator.video_duration_seconds / 60)}:{(educator.video_duration_seconds % 60).toString().padStart(2, '0')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg">
                  <video
                    src={educator.video_presentation_url}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                    poster={educator.avatar_url || undefined}
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>

                <div className="mt-3 sm:mt-4 rounded-lg p-2.5 sm:p-3" style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)', border: '1px solid rgba(240, 135, 159, 0.3)' }}>
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(240, 135, 159, 0.2)' }}>
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm" style={{ color: '#c4607a' }}>Découvrez {capitalizeFirstName(educator.first_name)} en vidéo</p>
                      <p className="text-xs mt-1" style={{ color: '#d4768c' }}>
                        Cette vidéo vous permet de mieux connaître le professionnel avant de prendre rendez-vous.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Disponibilités */}
            {activeTab === 'availability' && (
              <>
                {/* Horaires hebdomadaires */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Horaires habituels</h2>
                  </div>

                  {weeklySlots.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-600 font-medium text-sm">Aucune disponibilité régulière définie</p>
                      <p className="text-xs text-gray-500 mt-1">L'éducateur n'a pas encore configuré ses horaires.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {DAYS.map((day) => {
                        const daySlots = weeklySlots.filter(slot => slot.day_of_week === day.value);
                        if (daySlots.length === 0) return null;

                        return (
                          <div key={day.value} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
                                  <span className="font-bold text-xs" style={{ color: '#027e7e' }}>{day.label.substring(0, 2)}</span>
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-gray-900">{day.label}</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {daySlots.map((slot) => (
                                      <span key={slot.id} className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm font-medium" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(2, 126, 126, 0.3)', color: '#027e7e' }}>
                                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Exceptions et périodes spéciales */}
                {exceptions.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Périodes spéciales</h2>
                    </div>

                    <div className="space-y-3">
                      {exceptions.map((exc) => (
                        <div
                          key={exc.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="font-bold text-gray-900">
                                  {new Date(exc.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getExceptionTypeColor(exc.exception_type)}`}>
                                  {getExceptionTypeLabel(exc.exception_type)}
                                </span>
                              </div>
                              {exc.start_time && exc.end_time && (
                                <p className="text-sm text-gray-600 ml-7">
                                  {exc.start_time.substring(0, 5)} - {exc.end_time.substring(0, 5)}
                                </p>
                              )}
                              {exc.reason && (
                                <p className="text-sm text-gray-500 italic ml-7 mt-1">{exc.reason}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-blue-700">
                          <strong>Info :</strong> Ces périodes sont des exceptions aux horaires habituels.
                          Contactez l'éducateur pour confirmer les disponibilités.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message si aucune donnée */}
                {weeklySlots.length === 0 && exceptions.length === 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-10 border border-gray-100 text-center">
                    <svg className="w-14 h-14 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Disponibilités non configurées</h3>
                    <p className="text-gray-600 text-sm">
                      Cet éducateur n'a pas encore défini ses disponibilités.
                      <br />
                      Contactez-le directement pour connaître ses horaires.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Onglet Avis */}
            {activeTab === 'reviews' && (
              <div role="tabpanel" id="reviews-panel" aria-labelledby="reviews-tab" className="bg-white rounded-xl shadow-lg p-3 sm:p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mr-2" style={{ backgroundColor: '#f0879f' }}>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-base sm:text-xl font-bold text-gray-900">Avis des familles</h2>
                      <p className="text-xs text-gray-500">{reviews.length} avis au total</p>
                    </div>
                  </div>
                  {reviews.length > 0 && (
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                          return (
                            <svg
                              key={star}
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${star <= Math.round(avgRating) ? '' : 'text-gray-300'}`}
                              style={star <= Math.round(avgRating) ? { color: '#f0879f' } : {}}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          );
                        })}
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}/5
                      </p>
                    </div>
                  )}
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(240, 135, 159, 0.15)' }}>
                              <span className="font-bold text-sm" style={{ color: '#f0879f' }}>
                                {review.family?.first_name?.charAt(0)?.toUpperCase() || 'A'}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {capitalizeFirstName(review.family?.first_name || 'Anonyme')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating ? '' : 'text-gray-300'}`}
                                style={star <= review.rating ? { color: '#f0879f' } : {}}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 text-sm leading-relaxed mt-3 pl-13">
                            "{review.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-gray-600 font-medium text-sm">Aucun avis pour le moment</p>
                    <p className="text-xs text-gray-500 mt-1">Soyez le premier à laisser un avis après votre rendez-vous !</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Barre latérale */}
          <div className="space-y-4">
            {/* LinkedIn - visible uniquement sur À propos et Certifications */}
            {educator.linkedin_url && activeTab === 'about' && (
              <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-3">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">LinkedIn</h2>
                </div>
                <a
                  href={educator.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Voir le profil LinkedIn
                </a>
              </div>
            )}

            {/* Langues - visible uniquement sur À propos */}
            {educator.languages && educator.languages.length > 0 && activeTab === 'about' && (
              <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-3">
                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Langues parlées</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {educator.languages.map((lang, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold border border-green-200 hover:shadow-md transition-all duration-200"
                    >
                      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action - Sticky */}
            <div className="sticky top-24 rounded-xl md:rounded-xl p-3 sm:p-5 md:p-6 border-2 shadow-lg" style={{ backgroundColor: 'rgba(2, 126, 126, 0.08)', borderColor: 'rgba(2, 126, 126, 0.3)' }}>
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md" style={{ backgroundColor: '#027e7e' }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Intéressé(e) ?</h3>
                <p className="text-xs text-gray-700 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  {isAuthenticated
                    ? "Envoyez un message pour discuter avec cet éducateur et réserver une séance."
                    : "Connectez-vous ou créez un compte pour contacter cet éducateur et réserver une séance."
                  }
                </p>
              </div>
              <div className="space-y-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={handleContact}
                      className="block w-full text-center px-5 py-2.5 text-sm text-white rounded-lg hover:opacity-90 font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                      style={{ backgroundColor: '#027e7e' }}
                    >
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Envoyer un message
                      </span>
                    </button>
                    {userRole && (
                      <Link
                        href={userRole === 'educator' ? '/dashboard/educator' : '/dashboard/family'}
                        className="block w-full text-center px-5 py-2.5 text-sm bg-white border-2 rounded-lg hover:bg-teal-50 font-bold shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                        style={{ borderColor: '#027e7e', color: '#027e7e' }}
                      >
                        Mon dashboard
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      href={`/auth/login?redirect=/messages?educator=${params.id}`}
                      className="block w-full text-center px-5 py-2.5 text-sm text-white rounded-lg hover:opacity-90 font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                      style={{ backgroundColor: '#027e7e' }}
                    >
                      Se connecter
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="block w-full text-center px-5 py-2.5 text-sm bg-white border-2 rounded-lg hover:bg-teal-50 font-bold shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                      style={{ borderColor: '#027e7e', color: '#027e7e' }}
                    >
                      Créer un compte
                    </Link>
                  </>
                )}
              </div>
              <div className="mt-4 pt-4" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'rgba(2, 126, 126, 0.3)' }}>
                <div className="flex items-center justify-center text-xs text-gray-600">
                  <svg className="w-4 h-4 mr-1.5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-medium">100% sécurisé</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-white py-10 mt-12" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4">
              <Link href="/" className="inline-block">
                <img
                  src="/images/logo-neurocare.svg"
                  alt="neurocare"
                  className="h-16 brightness-0 invert mx-auto"
                />
              </Link>
            </div>
            <p className="text-teal-100 text-base mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Connecter les familles avec les meilleurs éducateurs spécialisés
            </p>
            <div className="flex justify-center gap-5 mb-6 flex-wrap">
              <Link href="/about" className="text-teal-100 hover:text-white transition-colors">
                Qui sommes-nous ?
              </Link>
              <Link href="/search" className="text-teal-100 hover:text-white transition-colors">
                Trouver un professionnel
              </Link>
              <Link href="/contact" className="text-teal-100 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
            <div className="border-t border-teal-600 pt-6">
              <p className="text-teal-200">
                © 2024 NeuroCare. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal questionnaire de contact */}
      {educator && familyProfileId && (
        <ContactQuestionnaireModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          educatorId={params.id}
          educatorName={`${capitalizeFirstName(educator.first_name)} ${formatLastName(educator.last_name)}`}
          familyId={familyProfileId}
          onSubmit={handleQuestionnaireSubmit}
        />
      )}
    </div>
  );
}
