'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import EducatorNavbar from '@/components/EducatorNavbar';
import PublicNavbar from '@/components/PublicNavbar';

interface FamilyProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  avatar_url: string | null;
  avatar_moderation_status: string;
  created_at: string;
}

interface ChildProfile {
  id: string;
  first_name: string;
  birth_date: string | null;
  tnd_types: string[];
  tnd_other: string | null;
  description: string | null;
  accompaniment_types: string[];
  accompaniment_goals: string | null;
  location_preference: string | null;
}

const tndTypeLabels: Record<string, string> = {
  tsa: 'TSA',
  tdah: 'TDAH',
  dyslexie: 'Dyslexie',
  dyspraxie: 'Dyspraxie',
  dyscalculie: 'Dyscalculie',
  dysorthographie: 'Dysorthographie',
  dysphasie: 'Dysphasie',
  tdi: 'TDI',
  tdc: 'TDC',
  hpi: 'HPI',
  trouble_anxieux: 'Trouble anxieux',
  autre: 'Autre',
};

const accompanimentTypeLabels: Record<string, string> = {
  scolaire: 'Soutien scolaire',
  comportemental: 'Gestion du comportement',
  socialisation: 'Socialisation',
  autonomie: 'Autonomie',
  communication: 'Communication',
  motricite: 'Motricité',
  sensoriel: 'Sensoriel',
  loisirs: 'Loisirs',
};

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

export default function FamilyPublicProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'educator' | 'family' | null>(null);
  const [educatorProfile, setEducatorProfile] = useState<any>(null);
  const [hasConversation, setHasConversation] = useState(false);
  const [children, setChildren] = useState<ChildProfile[]>([]);

  // Overscroll violet pour les éducateurs
  useEffect(() => {
    if (userRole === 'educator') {
      document.documentElement.classList.add('pro-theme');
      return () => {
        document.documentElement.classList.remove('pro-theme');
      };
    }
  }, [userRole]);

  useEffect(() => {
    fetchFamilyProfile();
    checkAuth();
  }, [params.id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    const role = session?.user?.user_metadata?.role;
    setUserRole(role === 'educator' || role === 'family' ? role : null);

    // Si c'est un éducateur, récupérer son profil et vérifier s'il a une conversation
    if (session?.user && session.user.user_metadata?.role === 'educator') {
      const { data: profile } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profile) {
        setEducatorProfile(profile);

        // Parallelize independent queries that all depend on profile.id
        const [convResult, childrenResult] = await Promise.all([
          // Vérifier s'il existe déjà une conversation
          supabase
            .from('conversations')
            .select('id')
            .eq('educator_id', profile.id)
            .eq('family_id', params.id)
            .single(),
          // Récupérer les accompagnements de la famille
          supabase
            .from('child_profiles')
            .select('id, first_name, birth_date, tnd_types, tnd_other, description, accompaniment_types, accompaniment_goals, location_preference')
            .eq('family_id', params.id)
            .eq('is_active', true)
            .order('created_at', { ascending: true }),
        ]);

        setHasConversation(!!convResult.data);
        setChildren(childrenResult.data || []);
      }
    }
  };

  const fetchFamilyProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Erreur:', error);
        return;
      }

      setFamily(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div
          className="animate-spin h-10 w-10 sm:h-12 sm:w-12 border-4 border-t-transparent rounded-full"
          style={{ borderColor: '#41005c', borderTopColor: 'transparent' }}
          role="status"
          aria-label="Chargement en cours"
        >
          <span className="sr-only">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="text-center px-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
            <svg className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Profil non trouvé</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-sm transition hover:opacity-90"
            style={{ backgroundColor: '#41005c' }}
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <div className="sticky top-0 z-40">
        {userRole === 'educator' ? (
          <EducatorNavbar profile={educatorProfile} />
        ) : (
          <PublicNavbar />
        )}
      </div>

      {/* Contenu principal */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 pb-24 sm:pb-8">
        {/* Bouton retour */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-gray-800 mb-3 sm:mb-4 md:mb-5 transition-colors"
          aria-label="Retour"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs md:text-sm font-medium">Retour</span>
        </button>

        {/* En-tête du profil */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-4 md:mb-6">
          {/* Bannière */}
          <div className="h-20 sm:h-28 md:h-32" style={{ background: 'linear-gradient(135deg, #41005c 0%, #6b21a8 50%, #a855f7 100%)' }} />

          {/* Info profil */}
          <div className="px-3 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 -mt-10 sm:-mt-12 md:-mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {family.avatar_url && family.avatar_moderation_status === 'approved' ? (
                  <img
                    src={family.avatar_url}
                    alt={getFormattedFullName(family.first_name, family.last_name)}
                    className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full object-cover border-3 sm:border-4 border-white shadow-lg ring-2 ring-gray-100"
                  />
                ) : (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full bg-white p-1 shadow-lg ring-1 ring-gray-100 flex items-center justify-center">
                    <img
                      src={(family.id?.charCodeAt(0) || 0) % 2 === 0 ? '/images/icons/avatar-male.svg' : '/images/icons/avatar-female.svg'}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Informations */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                  {getFormattedFullName(family.first_name, family.last_name)}
                </h1>
                <div className="flex items-center text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{family.location || 'Localisation non renseignée'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informations de contact */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-5 mb-3 sm:mb-4 md:mb-6">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2.5 sm:mb-3 flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            Profil Aidant
          </h2>
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center text-gray-600 text-xs sm:text-sm">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2.5 sm:mr-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {family.phone || 'Téléphone non renseigné'}
            </div>
            <div className="flex items-center text-gray-600 text-xs sm:text-sm">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2.5 sm:mr-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Membre depuis {new Date(family.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>

        {/* Section Accompagnements - visible uniquement pour les éducateurs */}
        {userRole === 'educator' && children.length > 0 && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-4 md:mb-6">
            {/* En-tête de section */}
            <div className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 border-b border-gray-100" style={{ backgroundColor: '#fdf9f4' }}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fdf2f4' }}>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Accompagnements</h2>
                  <p className="text-[10px] sm:text-xs text-gray-500">{children.length} enfant{children.length > 1 ? 's' : ''} enregistré{children.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3">
              {children.map((child) => (
                <div key={child.id} className="rounded-xl p-3 sm:p-4 border transition" style={{ backgroundColor: '#fdf9f4', borderColor: '#e5e7eb' }}>
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f3e8ff' }}>
                      <span className="text-sm sm:text-base font-semibold" style={{ color: '#41005c' }}>
                        {child.first_name[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">{child.first_name}</h3>
                        {child.birth_date && (
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            ({Math.floor((new Date().getTime() - new Date(child.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} ans)
                          </span>
                        )}
                        {child.location_preference && (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-600">
                            {child.location_preference === 'domicile' ? 'Domicile' :
                             child.location_preference === 'exterieur' ? 'Extérieur' : 'Dom./Ext.'}
                          </span>
                        )}
                      </div>

                      {/* Types de TND */}
                      {child.tnd_types && child.tnd_types.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                          {child.tnd_types.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium"
                              style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}
                            >
                              {type === 'autre' && child.tnd_other
                                ? `Autre: ${child.tnd_other}`
                                : tndTypeLabels[type] || type}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Types d'accompagnement */}
                      {child.accompaniment_types && child.accompaniment_types.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                          {child.accompaniment_types.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium"
                              style={{ backgroundColor: '#fdf2f4', color: '#e86b8a' }}
                            >
                              {accompanimentTypeLabels[type] || type}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {child.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 line-clamp-2">{child.description}</p>
                      )}

                      {/* Objectifs */}
                      {child.accompaniment_goals && (
                        <div className="mt-2 p-2 sm:p-2.5 rounded-lg" style={{ backgroundColor: '#f3e8ff' }}>
                          <p className="text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1" style={{ color: '#41005c' }}>Objectifs :</p>
                          <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{child.accompaniment_goals}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Boutons de contact */}
        {userRole === 'educator' && hasConversation ? (
          <Link
            href="/messages"
            className="flex items-center justify-center gap-2 w-full px-4 sm:px-5 py-2.5 sm:py-3 text-white rounded-xl md:rounded-2xl font-semibold transition-all shadow-md hover:shadow-lg hover:opacity-90 text-sm sm:text-base"
            style={{ backgroundColor: '#41005c' }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Envoyer un message
          </Link>
        ) : (
          <div className="rounded-xl md:rounded-2xl p-3 sm:p-4 border" style={{ backgroundColor: '#f3e8ff', borderColor: '#d8b4fe' }} role="alert">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#41005c' }}>
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm" style={{ color: '#41005c' }}>
                {!isAuthenticated
                  ? "Connectez-vous pour contacter cette famille."
                  : userRole === 'family'
                  ? "Profil d'une famille membre de la plateforme."
                  : "Pour contacter cette famille, démarrez une conversation via votre messagerie."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
