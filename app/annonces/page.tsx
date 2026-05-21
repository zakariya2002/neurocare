'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import AnnouncementListItem from '@/components/annonces/AnnouncementListItem';
import AnnouncementFilters, {
  AnnouncementFiltersState,
  initialFilters,
  countActiveFilters,
} from '@/components/annonces/AnnouncementFilters';
import { FamilyAnnouncement } from '@/components/annonces/types';
import { geocodeAddress, calculateDistance } from '@/lib/geolocation';

type Sort = 'recent' | 'nearest';
const ITEMS_PER_PAGE = 10;

type AnnouncementWithDistance = FamilyAnnouncement & { distance?: number };

export default function AnnouncementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [announcements, setAnnouncements] = useState<AnnouncementWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<Sort>('recent');
  const [filters, setFilters] = useState<AnnouncementFiltersState>(initialFilters);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isPro, setIsPro] = useState(false);

  // Charge l'état des favoris du pro connecté (silencieux si non connecté ou non pro)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/educator/favorite-ids', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { isPro: false, ids: [] }))
      .then((data) => {
        if (cancelled) return;
        setFavoriteIds(new Set(data.ids || []));
        setIsPro(!!data.isPro);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleFavorite = async (announcementId: string, next: boolean) => {
    // Optimistic
    setFavoriteIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(announcementId);
      else copy.delete(announcementId);
      return copy;
    });
    try {
      const res = await fetch(`/api/announcements/${announcementId}/favorite`, {
        method: next ? 'POST' : 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Favori échoué');
    } catch {
      // Rollback en cas d'erreur
      setFavoriteIds((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(announcementId);
        else copy.add(announcementId);
        return copy;
      });
    }
  };

  // Pré-remplissage depuis l'URL (location/profession)
  useEffect(() => {
    const location = searchParams.get('location');
    const profession = searchParams.get('profession');
    if (location || profession) {
      setFilters((prev) => ({
        ...prev,
        location: location || prev.location,
        desiredProfessions: profession ? [profession] : prev.desiredProfessions,
      }));
      setShowFilters(true);
    }
  }, [searchParams]);

  // Fetch à chaque changement de filtres
  useEffect(() => {
    fetchAnnouncements();
    setCurrentPage(1);
  }, [
    filters.location,
    filters.radius,
    filters.accompanimentTypes,
    filters.desiredProfessions,
    filters.tndContext,
    filters.placeTypes,
    filters.genderPreference,
    filters.hoursMin,
    filters.hoursMax,
    filters.startDateFrom,
  ]);

  const buildQuery = (): string => {
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    if (filters.radius) params.set('radius', filters.radius);
    filters.accompanimentTypes.forEach((t) => params.append('accompaniment_types', t));
    filters.desiredProfessions.forEach((p) => params.append('desired_professions', p));
    filters.tndContext.forEach((t) => params.append('tnd_context', t));
    filters.placeTypes.forEach((p) => params.append('place_types', p));
    if (filters.genderPreference) params.set('gender_preference', filters.genderPreference);
    if (filters.hoursMin) params.set('hours_min', filters.hoursMin);
    if (filters.hoursMax) params.set('hours_max', filters.hoursMax);
    if (filters.startDateFrom) params.set('start_date_from', filters.startDateFrom);
    return params.toString();
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      const res = await fetch(`/api/announcements${qs ? `?${qs}` : ''}`);
      if (!res.ok) {
        setAnnouncements([]);
        return;
      }
      const data = await res.json();
      let list: AnnouncementWithDistance[] = data.items || data.announcements || [];

      // Calcul distances si possible
      if (filters.location && filters.radius) {
        const radiusKm = parseInt(filters.radius, 10);
        const searchCoords = await geocodeAddress(filters.location);
        if (searchCoords) {
          list = list.map((a) => {
            if (typeof a.latitude === 'number' && typeof a.longitude === 'number') {
              const distance = calculateDistance(
                searchCoords.latitude,
                searchCoords.longitude,
                a.latitude,
                a.longitude,
              );
              return { ...a, distance };
            }
            return a;
          });
          // Si l'API n'a pas filtré par radius, on filtre côté client
          list = list.filter((a) => typeof a.distance !== 'number' || a.distance <= radiusKm);
        }
      }

      setAnnouncements(list);
    } catch (err) {
      console.error('Erreur fetch annonces:', err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const sorted = useMemo(() => {
    const copy = [...announcements];
    if (sort === 'nearest' && filters.location) {
      copy.sort((a, b) => {
        const da = typeof a.distance === 'number' ? a.distance : Number.MAX_SAFE_INTEGER;
        const db = typeof b.distance === 'number' ? b.distance : Number.MAX_SAFE_INTEGER;
        return da - db;
      });
    } else {
      copy.sort((a, b) => {
        const ta = new Date(a.published_at || a.created_at).getTime();
        const tb = new Date(b.published_at || b.created_at).getTime();
        return tb - ta;
      });
    }
    return copy;
  }, [announcements, sort, filters.location]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginated = sorted.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCount = countActiveFilters(filters);

  const handleReset = () => {
    setFilters(initialFilters);
    setSort('recent');
    setCurrentPage(1);
    router.push('/annonces');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar />

      {/* Header */}
      <section className="pt-16 xl:pt-20 pb-6 sm:pb-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#027e7e' }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: 'Verdana, sans-serif' }}
          >
            Annonces familles
          </h1>
          <div className="w-28 h-[2px] bg-gray-300 mx-auto mb-4"></div>
          <p className="text-base text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Familles à la recherche d'un accompagnement spécialisé près de chez vous
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
            className="w-full flex items-center justify-between bg-white rounded-xl md:rounded-2xl shadow-md px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-100"
          >
            <span className="flex items-center gap-2.5 font-bold text-gray-800">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: '#027e7e' }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 8h12M9 12h6m-3 4h0" />
                </svg>
              </div>
              <div className="text-left">
                <span className="block">Filtrer les annonces</span>
                {activeCount > 0 && (
                  <span className="text-xs font-medium" style={{ color: '#027e7e' }}>
                    {activeCount} filtre(s) actif(s)
                  </span>
                )}
              </div>
            </span>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                showFilters ? 'bg-teal-100' : 'bg-gray-100'
              }`}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  showFilters ? 'rotate-180 text-teal-600' : 'text-gray-500'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6">
          <div id="filters-panel" className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <AnnouncementFilters
              filters={filters}
              onChange={setFilters}
              onReset={handleReset}
              activeCount={activeCount}
            />
          </div>

          <div className="lg:col-span-3" role="region" aria-label="Annonces familles" aria-live="polite" aria-busy={loading}>
            {/* Barre de tri */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-3 sm:p-4 border border-gray-100 mb-3 sm:mb-4 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-gray-600">
                {loading ? 'Chargement…' : (
                  <>
                    <strong className="text-gray-900">{sorted.length}</strong>{' '}
                    {sorted.length > 1 ? 'annonces trouvées' : 'annonce trouvée'}
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-xs sm:text-sm font-medium text-gray-600">
                  Trier :
                </label>
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white"
                >
                  <option value="recent">Plus récentes</option>
                  <option value="nearest" disabled={!filters.location}>
                    Plus proches{!filters.location ? ' (adresse requise)' : ''}
                  </option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100">
                <div
                  className="animate-spin rounded-full h-16 w-16 border-4 mx-auto"
                  style={{
                    borderTopColor: '#027e7e',
                    borderRightColor: 'rgba(2, 126, 126, 0.2)',
                    borderBottomColor: 'rgba(2, 126, 126, 0.2)',
                    borderLeftColor: 'rgba(2, 126, 126, 0.2)',
                  }}
                  aria-hidden="true"
                />
                <p
                  className="text-gray-700 font-semibold mt-5 text-base"
                  style={{ fontFamily: 'Verdana, sans-serif' }}
                >
                  Chargement des annonces…
                </p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 px-4">
                <div
                  className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}
                >
                  <svg className="w-10 h-10" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  Aucune annonce
                </h3>
                <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
                  Aucune annonce ne correspond — élargissez votre zone ou ajustez vos filtres.
                </p>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paginated.map((a) => (
                  <AnnouncementListItem
                    key={a.id}
                    announcement={a}
                    favorited={favoriteIds.has(a.id)}
                    onToggleFavorite={isPro ? handleToggleFavorite : undefined}
                  />
                ))}

                {totalPages > 1 && (
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-3 sm:p-4 border border-gray-100 mt-3 sm:mt-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-sm text-gray-500">
                        Affichage {startIndex + 1} - {Math.min(endIndex, sorted.length)} sur {sorted.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Page précédente"
                        >
                          Précédent
                        </button>
                        <span className="text-sm text-gray-600">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                          style={{ backgroundColor: '#027e7e' }}
                          aria-label="Page suivante"
                        >
                          Suivant
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

      <footer className="text-white py-10" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-teal-100 text-base mb-6">
            Connecter les familles avec les meilleurs professionnels spécialisés
          </p>
          <div className="flex justify-center gap-5 mb-6 flex-wrap">
            <Link href="/about" className="text-teal-100 hover:text-white transition-colors">
              Qui sommes-nous ?
            </Link>
            <Link href="/search" className="text-teal-100 hover:text-white transition-colors">
              Trouver un professionnel
            </Link>
            <Link href="/annonces" className="text-teal-100 hover:text-white transition-colors">
              Annonces familles
            </Link>
            <Link href="/contact" className="text-teal-100 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
          <div className="border-t border-teal-600 pt-6">
            <p className="text-teal-100">© 2026 NeuroCare. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
