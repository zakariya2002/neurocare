'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EducatorProfile } from '@/types';
import { getCurrentPosition, reverseGeocode, geocodeAddress, calculateDistance } from '@/lib/geolocation';
import PublicNavbar from '@/components/PublicNavbar';
import { professions, getProfessionByValue } from '@/lib/professions-config';
import { useToast } from '@/components/Toast';

// Composant bouton favori
function FavoriteButton({ educatorId, familyId, isFavorite, onToggle }: {
  educatorId: string;
  familyId: string | null;
  isFavorite: boolean;
  onToggle: (educatorId: string, newState: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!familyId) {
      showToast('Veuillez vous connecter en tant que famille pour ajouter des favoris', 'info');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        await supabase
          .from('favorite_educators')
          .delete()
          .eq('family_id', familyId)
          .eq('educator_id', educatorId);
        onToggle(educatorId, false);
      } else {
        await supabase
          .from('favorite_educators')
          .insert({ family_id: familyId, educator_id: educatorId });
        onToggle(educatorId, true);
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`p-2 rounded-full transition-all ${
        isFavorite
          ? 'text-white hover:opacity-90'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-400'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={isFavorite ? { backgroundColor: '#f0879f' } : {}}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <svg
        className="w-5 h-5"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}


// Catégories de professions pour les filtres
const professionCategories = [
  {
    name: 'Éducatif',
    icon: '👨‍🏫',
    professions: professions.filter(p => p.category === 'Éducatif'),
  },
  {
    name: 'Psychologie',
    icon: '🧠',
    professions: professions.filter(p => p.category === 'Psychologie'),
  },
  {
    name: 'Thérapies',
    icon: '💆',
    professions: professions.filter(p => p.category === 'Thérapies'),
  },
  {
    name: 'Autres',
    icon: '✨',
    professions: professions.filter(p => p.category === 'Autres'),
  },
];

type EducatorWithDistance = EducatorProfile & { distance?: number };

const ITEMS_PER_PAGE = 10;

export default function SearchPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [educators, setEducators] = useState<EducatorWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [geolocating, setGeolocating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyProfile, setFamilyProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    professionTypes: [] as string[],
    minExperience: '',
    maxRate: '',
    minRating: '',
    radius: '',
    gender: '',
  });

  // Lecture des paramètres URL au chargement et à chaque changement d'URL
  useEffect(() => {
    const profession = searchParams.get('profession');
    const location = searchParams.get('location');
    const specialization = searchParams.get('specialization');
    const query = searchParams.get('q');

    // Ne mettre à jour que si des paramètres sont présents dans l'URL
    if (profession || location || specialization || query) {
      setFilters(prev => ({
        ...prev,
        location: location || prev.location,
        professionTypes: profession ? [profession] : prev.professionTypes,
      }));

      if (specialization || query) {
        setSearchTerm(specialization || query || '');
      }

      setShowFilters(true);
    }
  }, [searchParams]);

  // Appel initial
  useEffect(() => {
    fetchEducators();
    checkAuth();
  }, []);

  // À chaque changement de filtre, relancer la recherche
  useEffect(() => {
    // Éviter le double appel au montage initial
    const hasFilters = filters.location || filters.professionTypes.length > 0 ||
                       filters.minExperience || filters.maxRate || filters.minRating ||
                       filters.radius || filters.gender || searchTerm;
    if (hasFilters) {
      fetchEducators();
    }
  }, [filters.location, filters.professionTypes, filters.minExperience, filters.maxRate, filters.minRating, filters.radius, filters.gender, searchTerm]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setUserRole(session?.user?.user_metadata?.role || null);

    if (session?.user && session.user.user_metadata?.role === 'family') {
      const { data: familyProfileData } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (familyProfileData) {
        setFamilyId(familyProfileData.id);
        setFamilyProfile(familyProfileData);

        // Favorites query depends on familyProfileData.id, runs after profile fetch
        const { data: favoritesData } = await supabase
          .from('favorite_educators')
          .select('educator_id')
          .eq('family_id', familyProfileData.id);

        if (favoritesData) {
          setFavorites(new Set(favoritesData.map(f => f.educator_id)));
        }
      }
    }
  };

  const handleFavoriteToggle = (educatorId: string, newState: boolean) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newState) {
        newFavorites.add(educatorId);
      } else {
        newFavorites.delete(educatorId);
      }
      return newFavorites;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole(null);
    setFamilyId(null);
    setFamilyProfile(null);
    setFavorites(new Set());
    window.location.href = '/';
  };

  const fetchEducators = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('public_educator_profiles')
        .select('id, first_name, last_name, bio, avatar_url, avatar_moderation_status, location, profession_type, specializations, hourly_rate, years_of_experience, rating, total_reviews, subscription_status, suspended_until, verification_badge, gender')
        .eq('verification_badge', true)
        .gte('years_of_experience', 1)
        .order('rating', { ascending: false });

      // Note: Le filtrage par location est fait côté client pour plus de précision
      if (filters.minExperience) {
        query = query.gte('years_of_experience', parseInt(filters.minExperience));
      }
      if (filters.maxRate) {
        query = query.lte('hourly_rate', parseFloat(filters.maxRate));
      }
      if (filters.minRating) {
        query = query.gte('rating', parseFloat(filters.minRating));
      }

      const { data, error } = await query;

      if (error) throw error;

      let filtered = (data || []).filter(educator => {
        const suspendedUntil = (educator as any).suspended_until;
        if (!suspendedUntil) return true;
        return new Date(suspendedUntil) < new Date();
      });

      if (filters.professionTypes.length > 0) {
        filtered = filtered.filter(educator =>
          filters.professionTypes.includes(educator.profession_type || 'educator')
        );
      }

      // Filtrer par genre si sélectionné
      if (filters.gender) {
        filtered = filtered.filter(educator =>
          educator.gender === filters.gender
        );
      }

      // Filtrer par localisation (si pas de rayon défini)
      if (filters.location && !filters.radius) {
        const locationLower = filters.location.toLowerCase();
        // Extraire le nom de la ville (avant la virgule si format "Ville, Département")
        const cityName = locationLower.split(',')[0].trim();

        filtered = filtered.filter(educator => {
          if (!educator.location) return false;
          const educatorLocation = educator.location.toLowerCase();
          // Vérifier si la ville correspond (au début ou contient le nom)
          return educatorLocation.includes(cityName) ||
                 educatorLocation.startsWith(cityName);
        });
      }

      // Filtrer par terme de recherche (spécialisations, bio, nom)
      if (searchTerm) {
        const termLower = searchTerm.toLowerCase();
        filtered = filtered.filter(educator => {
          // Rechercher dans les spécialisations
          const specMatch = educator.specializations?.some((spec: string) =>
            spec.toLowerCase().includes(termLower)
          );
          // Rechercher dans la bio
          const bioMatch = educator.bio?.toLowerCase().includes(termLower);
          // Rechercher dans le nom
          const nameMatch = `${educator.first_name} ${educator.last_name}`.toLowerCase().includes(termLower);

          return specMatch || bioMatch || nameMatch;
        });
      }

      if (filters.location && filters.radius) {
        const radiusKm = parseInt(filters.radius);
        const searchCoords = await geocodeAddress(filters.location);

        if (searchCoords) {
          const educatorsWithDistance = await Promise.all(
            filtered.map(async (educator) => {
              if (educator.location) {
                const coords = await geocodeAddress(educator.location);
                if (coords) {
                  const distance = calculateDistance(
                    searchCoords.latitude,
                    searchCoords.longitude,
                    coords.latitude,
                    coords.longitude
                  );
                  return { ...educator, distance };
                }
              }
              return { ...educator, distance: undefined };
            })
          );

          filtered = educatorsWithDistance
            .filter(e => e.distance !== undefined && e.distance <= radiusKm)
            .sort((a, b) => {
              const aIsPremium = ['active', 'trialing'].includes((a as any).subscription_status);
              const bIsPremium = ['active', 'trialing'].includes((b as any).subscription_status);

              if (aIsPremium && !bIsPremium) return -1;
              if (!aIsPremium && bIsPremium) return 1;

              return (a.distance || 0) - (b.distance || 0);
            });

          setEducators(filtered as any);
          return;
        }
      }

      const sortedFiltered = [...filtered].sort((a, b) => {
        const aIsPremium = ['active', 'trialing'].includes((a as any).subscription_status);
        const bIsPremium = ['active', 'trialing'].includes((b as any).subscription_status);

        if (aIsPremium && !bIsPremium) return -1;
        if (!aIsPremium && bIsPremium) return 1;

        return (b.rating || 0) - (a.rating || 0);
      });

      setEducators(sortedFiltered as any);
    } catch (error) {
      console.error('Erreur lors de la récupération des professionnels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfessionToggle = (professionValue: string) => {
    const current = filters.professionTypes;
    if (current.includes(professionValue)) {
      setFilters({
        ...filters,
        professionTypes: current.filter(p => p !== professionValue),
      });
    } else {
      setFilters({
        ...filters,
        professionTypes: [...current, professionValue],
      });
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEducators();

    // Tracking Meta — recherche utilisée par un visiteur
    import('@/lib/meta-pixel').then(({ trackEvent }) => {
      trackEvent('Search', {
        search_string: searchTerm,
        location: filters.location || '',
        profession_types: filters.professionTypes,
      });
    });
  };

  const totalPages = Math.ceil(educators.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEducators = educators.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGetLocation = async () => {
    setGeolocating(true);
    try {
      const position = await getCurrentPosition();
      const address = await reverseGeocode(position.latitude, position.longitude);
      if (address) {
        setFilters({ ...filters, location: address });
      }
    } catch (error: any) {
      showToast(error.message || 'Impossible d\'obtenir votre position', 'error');
      console.error('Erreur de géolocalisation:', error);
    } finally {
      setGeolocating(false);
    }
  };

  // Arrondissements de Paris
  const parisArrondissements = [
    'Paris 1er', 'Paris 2e', 'Paris 3e', 'Paris 4e', 'Paris 5e',
    'Paris 6e', 'Paris 7e', 'Paris 8e', 'Paris 9e', 'Paris 10e',
    'Paris 11e', 'Paris 12e', 'Paris 13e', 'Paris 14e', 'Paris 15e',
    'Paris 16e', 'Paris 17e', 'Paris 18e', 'Paris 19e', 'Paris 20e'
  ];

  // Recherche d'adresse avec autocomplétion
  const searchLocationSuggestions = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    // Cas spécial pour Paris - montrer les arrondissements
    const queryLower = query.toLowerCase();
    if (queryLower.startsWith('paris')) {
      const filtered = parisArrondissements.filter(arr =>
        arr.toLowerCase().includes(queryLower)
      );
      if (filtered.length > 0) {
        setLocationSuggestions(['Paris', ...filtered]);
        setShowLocationSuggestions(true);
        return;
      }
    }

    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=10&type=municipality`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const suggestions = data.features.map((feature: any) => feature.properties.label);
        setLocationSuggestions(suggestions.slice(0, 8));
        setShowLocationSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    } catch (error) {
      console.error('Erreur recherche adresse:', error);
      setLocationSuggestions([]);
    }
  };

  const handleLocationChange = (value: string) => {
    setFilters({ ...filters, location: value });
    searchLocationSuggestions(value);
  };

  const selectLocationSuggestion = (suggestion: string) => {
    setFilters({ ...filters, location: suggestion });
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
  };

  const resetFilters = () => {
    setFilters({
      location: '',
      professionTypes: [],
      minExperience: '',
      maxRate: '',
      minRating: '',
      radius: '',
      gender: '',
    });
    setSearchTerm('');
    setCurrentPage(1);
    // Nettoyer l'URL
    router.push('/search');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.location) count++;
    if (filters.radius) count++;
    if (filters.professionTypes.length > 0) count += filters.professionTypes.length;
    if (filters.minExperience) count++;
    if (filters.maxRate) count++;
    if (filters.minRating) count++;
    if (filters.gender) count++;
    if (searchTerm) count++;
    return count;
  };

  const getProfessionLabel = (professionType: string | undefined) => {
    if (!professionType) return 'Professionnel';
    const profession = getProfessionByValue(professionType);
    return profession?.label || 'Professionnel';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <PublicNavbar />

      {/* Section Titre */}
      <section className="pt-16 xl:pt-20 pb-6 sm:pb-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Pictogramme */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#027e7e' }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Trouver un professionnel
          </h1>
          {/* Ligne décorative */}
          <div className="w-28 h-[2px] bg-gray-300 mx-auto mb-4"></div>
          <p className="text-base text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Découvrez nos professionnels qualifiés pour l'accompagnement des personnes avec TND
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Bouton filtres mobile */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="filters-panel"
            className="w-full flex items-center justify-between bg-white rounded-xl md:rounded-2xl shadow-md px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#027e7e] focus:ring-offset-2 group hover:shadow-lg transition-all"
          >
            <span className="flex items-center gap-2.5 font-bold text-gray-800">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform" style={{ backgroundColor: '#027e7e' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="text-left">
                <span className="block">Filtrer les résultats</span>
                {getActiveFiltersCount() > 0 && (
                  <span className="text-xs font-medium" style={{ color: '#027e7e' }}>{getActiveFiltersCount()} filtre(s) actif(s)</span>
                )}
              </div>
            </span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${showFilters ? 'bg-teal-100' : 'bg-gray-100'}`}>
              <svg className={`w-5 h-5 transition-transform duration-300 ${showFilters ? 'rotate-180 text-teal-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6">
          {/* Filtres */}
          <div id="filters-panel" className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-3 sm:p-4 md:p-5 lg:sticky lg:top-24 border border-gray-100 overflow-hidden relative">
              {/* Barre décorative supérieure */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#027e7e' }}></div>

              <div className="flex items-center gap-2.5 mb-4 sm:mb-5 pt-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#027e7e' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>Filtrer</h2>
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'Open Sans, sans-serif' }}>Affinez votre recherche</p>
                </div>
              </div>

              <div className="space-y-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                {/* Type de professionnel */}
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <svg className="w-4 h-4" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Type de professionnel
                  </label>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {professionCategories.map((category) => (
                      <div key={category.name} className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </div>
                        <div className="space-y-1.5 pl-2">
                          {category.professions.map((profession) => (
                            <label key={profession.value} className="flex items-center cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={filters.professionTypes.includes(profession.value)}
                                onChange={() => handleProfessionToggle(profession.value)}
                                className="h-4 w-4 border-gray-300 rounded cursor-pointer"
                                style={{ accentColor: '#027e7e' }}
                              />
                              <span className="ml-2 text-sm text-gray-700 group-hover:text-teal-600 transition-colors">
                                {profession.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Localisation */}
                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <svg className="w-4 h-4" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Localisation
                  </label>
                  <div className="relative">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Tapez une ville..."
                        value={filters.location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        onFocus={() => filters.location.length >= 2 && setShowLocationSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                        className="w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:ring-2 focus:border-transparent transition-all"
                        style={{ outlineColor: '#027e7e' }}
                      />
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={geolocating}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 font-medium text-sm shadow-md hover:shadow-lg hover:opacity-90"
                        style={{ backgroundColor: '#f0879f' }}
                        aria-label="Utiliser ma position actuelle pour la recherche"
                      >
                        {geolocating ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" aria-hidden="true"></div>
                            <span>Localisation en cours...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            </svg>
                            <span>Utiliser ma position actuelle</span>
                          </>
                        )}
                      </button>
                    </div>
                    {/* Liste des suggestions */}
                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                      <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto" role="listbox" aria-label="Suggestions de localisation">
                        {locationSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => selectLocationSuggestion(suggestion)}
                            className="px-4 py-2.5 hover:bg-teal-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                            role="option"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Rayon de recherche */}
                  {filters.location && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-600">Rayon de recherche</label>
                        <span className="text-sm font-bold" style={{ color: '#027e7e' }}>
                          {filters.radius ? `${filters.radius} km` : 'Ville exacte'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={filters.radius || '0'}
                        onChange={(e) => setFilters({ ...filters, radius: e.target.value === '0' ? '' : e.target.value })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2"
                        style={{ accentColor: '#027e7e' }}
                        aria-label={`Rayon de recherche: ${filters.radius ? `${filters.radius} kilomètres` : 'ville exacte'}`}
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0</span>
                        <span>25</span>
                        <span>50</span>
                        <span>75</span>
                        <span>100 km</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expérience */}
                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <svg className="w-4 h-4" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                    </svg>
                    Expérience minimum
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="Nombre d'années"
                      value={filters.minExperience}
                      onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:ring-2 focus:border-transparent transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">ans</span>
                  </div>
                </div>

                {/* Tarif */}
                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <svg className="w-4 h-4" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tarif maximum
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Tarif horaire max"
                      value={filters.maxRate}
                      onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:ring-2 focus:border-transparent transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€/h</span>
                  </div>
                </div>

                {/* Genre */}
                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <svg className="w-4 h-4" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Genre
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFilters({ ...filters, gender: filters.gender === 'male' ? '' : 'male' })}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all border ${
                        filters.gender === 'male'
                          ? 'text-white border-transparent'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
                      }`}
                      style={filters.gender === 'male' ? { backgroundColor: '#027e7e' } : {}}
                      aria-pressed={filters.gender === 'male'}
                      aria-label="Filtrer par genre homme"
                    >
                      Homme
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilters({ ...filters, gender: filters.gender === 'female' ? '' : 'female' })}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all border ${
                        filters.gender === 'female'
                          ? 'text-white border-transparent'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
                      }`}
                      style={filters.gender === 'female' ? { backgroundColor: '#027e7e' } : {}}
                      aria-pressed={filters.gender === 'female'}
                      aria-label="Filtrer par genre femme"
                    >
                      Femme
                    </button>
                  </div>
                </div>

                <div className="pt-4 space-y-2.5 border-t border-gray-200">
                  <button
                    onClick={handleSearch}
                    className="w-full text-white py-3 px-4 rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                    style={{ backgroundColor: '#027e7e' }}
                    aria-label="Lancer la recherche avec les filtres sélectionnés"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Rechercher
                  </button>
                  <button
                    onClick={resetFilters}
                    className="w-full bg-gray-50 text-gray-700 py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-100 hover:border-gray-300 font-medium transition-all flex items-center justify-center gap-2 group"
                    aria-label="Réinitialiser tous les filtres de recherche"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Réinitialiser les filtres
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="lg:col-span-3" role="region" aria-label="Résultats de recherche" aria-live="polite" aria-busy={loading}>
            {loading ? (
              <div className="text-center py-16 bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4" style={{ borderColor: 'rgba(2, 126, 126, 0.2)' }} aria-hidden="true"></div>
                  </div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 mx-auto" style={{ borderTopColor: '#027e7e', borderRightColor: 'rgba(2, 126, 126, 0.2)', borderBottomColor: 'rgba(2, 126, 126, 0.2)', borderLeftColor: 'rgba(2, 126, 126, 0.2)' }} aria-hidden="true"></div>
                </div>
                <p className="text-gray-700 font-semibold mt-5 text-base" style={{ fontFamily: 'Verdana, sans-serif' }}>Recherche en cours...</p>
                <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'Open Sans, sans-serif' }}>Nous trouvons les meilleurs professionnels pour vous</p>
              </div>
            ) : educators.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100">
                <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
                  <svg className="w-10 h-10" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>Aucun professionnel trouvé</h3>
                <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>Nous n'avons pas trouvé de professionnels correspondant à vos critères. Essayez de modifier vos filtres.</p>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#027e7e' }}
                  aria-label="Réinitialiser tous les filtres de recherche"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedEducators.map((educator) => (
                  <div
                    key={educator.id}
                    className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group hover:-translate-y-1 relative cursor-pointer"
                    onClick={(e) => {
                      // Ne pas naviguer si on clique sur le bouton favori
                      if ((e.target as HTMLElement).closest('button')) return;
                      router.push(`/educator/${educator.id}`);
                    }}
                  >
                    {/* Bouton favori */}
                    <div className="absolute top-3 right-3 z-10">
                      <FavoriteButton
                        educatorId={educator.id}
                        familyId={familyId}
                        isFavorite={favorites.has(educator.id)}
                        onToggle={handleFavoriteToggle}
                      />
                    </div>
                    <div className="p-2.5 sm:p-4 pr-11 sm:pr-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-2.5">
                        <div className="flex gap-2 sm:gap-3">
                          {/* Photo de profil */}
                          <div className="flex-shrink-0 relative">
                            {educator.avatar_url && educator.avatar_moderation_status === 'approved' ? (
                              <div className="relative group/avatar">
                                {/* Avatar glow removed for clean look */}
                                <img
                                  src={educator.avatar_url}
                                  alt={`Photo de profil de ${educator.first_name} ${educator.last_name}, ${getProfessionLabel(educator.profession_type)}`}
                                  className="relative w-12 h-12 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white shadow-lg ring-2 ring-[rgba(2,126,126,0.2)] transition-all"
                                />
                              </div>
                            ) : (
                              <div className="relative group/avatar">
                                {/* Avatar glow removed for clean look */}
                                <div className="relative w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 border-white shadow-lg ring-2 ring-[rgba(2,126,126,0.2)] transition-all" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }} role="img" aria-label={`Photo de profil par défaut de ${educator.first_name} ${educator.last_name}`}>
                                  <svg className="w-6 h-6 sm:w-10 sm:h-10" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 mb-1.5">
                            <h3 className="text-xs sm:text-base font-bold text-gray-900 group-hover:text-teal-700 transition-colors truncate" style={{ fontFamily: 'Verdana, sans-serif' }}>
                              {educator.first_name} {educator.last_name}
                            </h3>
                          </div>

                          {/* Badge profession */}
                          <div className="mb-1.5 sm:mb-2">
                            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg border shadow-sm" style={{ backgroundColor: 'rgba(2, 126, 126, 0.05)', color: '#027e7e', borderColor: 'rgba(2, 126, 126, 0.2)' }}>
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse" style={{ backgroundColor: '#027e7e' }} aria-hidden="true"></span>
                              <span className="truncate max-w-[150px] sm:max-w-none">{getProfessionLabel(educator.profession_type)}</span>
                            </span>
                          </div>

                          {/* Note moyenne */}
                          {educator.rating > 0 && (
                            <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg w-fit border" style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)', borderColor: 'rgba(240, 135, 159, 0.2)' }} role="group" aria-label={`Note moyenne: ${educator.rating.toFixed(1)} sur 5 étoiles, basée sur ${educator.total_reviews} avis`}>
                              <div className="flex items-center gap-0.5" aria-hidden="true">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                      i < Math.round(educator.rating)
                                        ? ''
                                        : 'text-gray-300'
                                    }`}
                                    style={i < Math.round(educator.rating) ? { color: '#f0879f' } : {}}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-xs sm:text-sm font-bold" style={{ color: '#f0879f' }}>
                                {educator.rating.toFixed(1)}
                              </span>
                              <span className="text-[10px] sm:text-sm font-medium" style={{ color: '#f4a3b3' }}>
                                ({educator.total_reviews} avis)
                              </span>
                            </div>
                          )}

                          {/* Localisation */}
                          <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs sm:text-sm truncate">{educator.location}</span>
                          </div>

                          {/* Badges expérience et taux horaire */}
                          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs flex-wrap mb-1.5 sm:mb-2">
                            {educator.years_of_experience && educator.years_of_experience > 0 && (
                              <span className="inline-flex items-center gap-1 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border" style={{ backgroundColor: 'rgba(58, 158, 158, 0.1)', color: '#3a9e9e', borderColor: 'rgba(58, 158, 158, 0.2)' }}>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {educator.years_of_experience} ans
                              </span>
                            )}
                            {educator.hourly_rate && educator.hourly_rate > 0 && (
                              <span className="inline-flex items-center gap-1 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border" style={{ backgroundColor: 'rgba(107, 190, 190, 0.1)', color: '#6bbebe', borderColor: 'rgba(107, 190, 190, 0.2)' }}>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {educator.hourly_rate}€/h
                              </span>
                            )}
                          </div>

                          {/* Badge distance */}
                          {educator.distance !== undefined && (
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs flex-wrap">
                              <span className="inline-flex items-center gap-1 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-white rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold shadow-sm" style={{ backgroundColor: '#027e7e' }}>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {educator.distance} km
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-3 sm:p-3.5 md:p-5 border border-gray-100 mt-3 sm:mt-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-sm text-gray-500 order-2 sm:order-1" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                        Affichage {startIndex + 1} - {Math.min(endIndex, educators.length)} sur {educators.length} résultats
                      </p>

                      <div className="flex items-center gap-2 order-1 sm:order-2">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all group"
                          aria-label="Page précédente"
                        >
                          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span className="hidden sm:inline">Précédent</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => goToPage(page)}
                                  className={`min-w-[40px] h-10 px-2.5 py-1.5 text-sm font-bold rounded-xl transition-all ${
                                    currentPage === page
                                      ? 'text-white shadow-md scale-105'
                                      : 'text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-teal-300 hover:text-teal-600'
                                  }`}
                                  style={currentPage === page ? { backgroundColor: '#027e7e' } : {}}
                                  aria-label={`Page ${page}`}
                                  aria-current={currentPage === page ? 'page' : undefined}
                                >
                                  {page}
                                </button>
                              );
                            } else if (
                              page === currentPage - 2 ||
                              page === currentPage + 2
                            ) {
                              return (
                                <span key={page} className="px-1 text-gray-300 font-bold">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg group"
                          style={{ backgroundColor: '#027e7e' }}
                          aria-label="Page suivante"
                        >
                          <span className="hidden sm:inline">Suivant</span>
                          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-white py-10" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-5">
              <Link href="/" className="inline-block">
                <img
                  src="/images/logo-neurocare.svg"
                  alt="neurocare"
                  className="h-16 brightness-0 invert mx-auto"
                />
              </Link>
            </div>
            <p className="text-teal-100 text-base mb-6">
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
              <p className="text-teal-100">
                © 2024 NeuroCare. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
