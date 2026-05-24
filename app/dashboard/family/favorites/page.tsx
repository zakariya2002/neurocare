'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import { getProfessionByValue } from '@/lib/professions-config';

interface FavoriteEducator {
  id: string;
  educator_id: string;
  created_at: string;
  educator: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    profession_type: string | null;
    location: string | null;
    hourly_rate: number | null;
    rating: number;
    total_reviews: number;
    years_of_experience: number;
    bio: string | null;
    verification_badge: boolean;
  };
}

export default function FavoritesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteEducator[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);

      // Récupérer le profil famille
      const { data: familyProfile } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!familyProfile) {
        router.push('/auth/login');
        return;
      }

      setProfile(familyProfile);
      setFamilyId(familyProfile.id);

      // Récupérer les favoris avec les infos des éducateurs
      const { data: favoritesData, error } = await supabase
        .from('favorite_educators')
        .select(`
          id,
          educator_id,
          created_at,
          educator:educator_profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            profession_type,
            location,
            hourly_rate,
            rating,
            total_reviews,
            years_of_experience,
            bio,
            verification_badge
          )
        `)
        .eq('family_id', familyProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformer et filtrer les favoris où l'éducateur existe encore
      const validFavorites = (favoritesData || [])
        .map((f: any) => ({
          ...f,
          educator: Array.isArray(f.educator) ? f.educator[0] : f.educator
        }))
        .filter((f: any) => f.educator !== null && f.educator !== undefined) as FavoriteEducator[];

      setFavorites(validFavorites);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string, educatorId: string) => {
    setRemoving(educatorId);
    try {
      const { error } = await supabase
        .from('favorite_educators')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setRemoving(null);
    }
  };

  const getProfessionLabel = (professionType: string | null) => {
    if (!professionType) return 'Professionnel';
    const profession = getProfessionByValue(professionType);
    return profession?.label || 'Professionnel';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      {/* Section Titre */}
      <section className="py-3 sm:py-5 md:py-8 px-3 sm:px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Flèche retour */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            aria-label="Retour à la page précédente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Retour</span>
          </button>
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0879f' }}>
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Mes favoris
          </h1>
          <div className="w-24 sm:w-32 h-[2px] bg-gray-300 mx-auto mb-3 sm:mb-4 md:mb-6"></div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Professionnels que vous avez enregistrés
          </p>
        </div>
      </section>

      <div className="flex-1 max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-16 w-full">
        {/* Liste des favoris */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4" style={{ borderColor: 'rgba(240, 135, 159, 0.2)' }} aria-hidden="true"></div>
              </div>
              <div className="animate-spin rounded-full h-20 w-20 border-4 mx-auto" style={{ borderTopColor: '#f0879f', borderRightColor: '#f4a3b3', borderBottomColor: '#f8c0cb', borderLeftColor: 'rgba(240, 135, 159, 0.2)' }} aria-hidden="true"></div>
            </div>
            <p className="text-gray-700 font-semibold mt-6 text-lg" style={{ fontFamily: 'Verdana, sans-serif' }}>Chargement...</p>
            <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'Open Sans, sans-serif' }}>Récupération de vos favoris</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)' }}>
              <svg className="w-12 h-12" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>Aucun favori</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Vous n'avez pas encore ajouté de professionnels à vos favoris.
            </p>
            <Link
              href="/dashboard/family/search"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition-all"
              style={{ backgroundColor: '#027e7e' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Rechercher des professionnels
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {favorites.length} professionnel(s) dans vos favoris
            </p>

            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group hover:-translate-y-1 relative cursor-pointer"
                onClick={() => router.push(`/professionnel/${favorite.educator.id}`)}
              >
                {/* Bouton retirer - position absolue en haut à droite */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(favorite.id, favorite.educator.id);
                    }}
                    disabled={removing === favorite.educator.id}
                    className="p-2 rounded-full text-white hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
                    style={{ backgroundColor: '#f0879f' }}
                    aria-label={`Retirer ${favorite.educator.first_name} ${favorite.educator.last_name} des favoris`}
                  >
                    {removing === favorite.educator.id ? (
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full block" aria-hidden="true"></span>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="p-4 sm:p-6 pr-14">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                    <div className="flex gap-3 sm:gap-5">
                      {/* Avatar */}
                      <div className="flex-shrink-0 relative">
                        {favorite.educator.avatar_url ? (
                          <div className="relative group/avatar">
                            <div className="absolute -inset-1 rounded-full blur opacity-25 group-hover/avatar:opacity-50 transition-opacity" style={{ backgroundColor: '#027e7e' }} aria-hidden="true"></div>
                            <img
                              src={favorite.educator.avatar_url}
                              alt={`Photo de ${favorite.educator.first_name} ${favorite.educator.last_name}`}
                              className="relative w-16 h-16 sm:w-28 sm:h-28 rounded-full object-cover border-2 sm:border-3 border-white shadow-xl ring-2 ring-[rgba(2,126,126,0.2)] transition-all"
                            />
                          </div>
                        ) : (
                          <div className="relative group/avatar">
                            <div className="absolute -inset-1 rounded-full blur opacity-25 group-hover/avatar:opacity-50 transition-opacity" style={{ backgroundColor: '#027e7e' }} aria-hidden="true"></div>
                            <div className="relative w-16 h-16 sm:w-28 sm:h-28 rounded-full flex items-center justify-center border-2 sm:border-3 border-white shadow-xl ring-2 ring-[rgba(2,126,126,0.2)] transition-all" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
                              <svg className="w-8 h-8 sm:w-14 sm:h-14" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                          <h3 className="text-base sm:text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors truncate" style={{ fontFamily: 'Verdana, sans-serif' }}>
                            {favorite.educator.first_name} {favorite.educator.last_name}
                          </h3>
                          {favorite.educator.verification_badge && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-sm w-fit flex-shrink-0" style={{ backgroundColor: '#f0879f' }}>
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Vérifié
                            </span>
                          )}
                        </div>

                        <div className="mb-2 sm:mb-3">
                          <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl border shadow-sm" style={{ backgroundColor: 'rgba(2, 126, 126, 0.05)', color: '#027e7e', borderColor: 'rgba(2, 126, 126, 0.2)' }}>
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse" style={{ backgroundColor: '#027e7e' }} aria-hidden="true"></span>
                            <span className="truncate max-w-[150px] sm:max-w-none">{getProfessionLabel(favorite.educator.profession_type)}</span>
                          </span>
                        </div>

                        {favorite.educator.rating > 0 && (
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl w-fit border" style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)', borderColor: 'rgba(240, 135, 159, 0.2)' }}>
                            <div className="flex items-center gap-0.5" aria-hidden="true">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${i < Math.round(favorite.educator.rating) ? '' : 'text-gray-300'}`}
                                  style={i < Math.round(favorite.educator.rating) ? { color: '#f0879f' } : {}}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs sm:text-base font-bold" style={{ color: '#f0879f' }}>
                              {favorite.educator.rating.toFixed(1)}
                            </span>
                            <span className="text-[10px] sm:text-sm font-medium" style={{ color: '#f4a3b3' }}>
                              ({favorite.educator.total_reviews} avis)
                            </span>
                          </div>
                        )}

                        {favorite.educator.location && (
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs sm:text-base truncate">{favorite.educator.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-sm flex-wrap">
                          {favorite.educator.years_of_experience && favorite.educator.years_of_experience > 0 && (
                            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-medium border" style={{ backgroundColor: 'rgba(58, 158, 158, 0.1)', color: '#3a9e9e', borderColor: 'rgba(58, 158, 158, 0.2)' }}>
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {favorite.educator.years_of_experience} ans
                            </span>
                          )}
                          {favorite.educator.hourly_rate && favorite.educator.hourly_rate > 0 && (
                            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-medium border" style={{ backgroundColor: 'rgba(107, 190, 190, 0.1)', color: '#6bbebe', borderColor: 'rgba(107, 190, 190, 0.2)' }}>
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {favorite.educator.hourly_rate}€/h
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer teal */}
      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
