'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import EducatorNavbar from '@/components/EducatorNavbar';
import AnnouncementListItem from '@/components/annonces/AnnouncementListItem';
import { FamilyAnnouncement } from '@/components/annonces/types';

interface FavoriteRow {
  id: string;
  created_at: string;
  announcement_id: string;
  announcement: FamilyAnnouncement;
}

export default function EducatorFavoritesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/pro/login');
        return;
      }
      const { data: profileData } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      setProfile(profileData);

      const res = await fetch('/api/educator/favorites');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Impossible de charger vos favoris (HTTP ${res.status}).`);
        setFavorites([]);
        return;
      }
      const data = await res.json();
      setFavorites(data.items || []);
    } catch (err: any) {
      setError(err?.message || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (announcementId: string, next: boolean) => {
    // Sur cette page, "next === false" toujours (on retire un favori)
    // Optimistic
    setFavorites((prev) => prev.filter((f) => f.announcement_id !== announcementId));
    try {
      const res = await fetch(`/api/announcements/${announcementId}/favorite`, {
        method: next ? 'POST' : 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Échec');
    } catch {
      // Rollback : on recharge la liste depuis le serveur
      load();
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh]" style={{ backgroundColor: '#fdf9f4' }}>
      <EducatorNavbar profile={profile} />

      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold text-gray-900 inline-flex items-center gap-2"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#f0879f" stroke="#f0879f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              Mes favoris
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Les annonces que vous avez sauvegardées pour y revenir plus tard.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/dashboard/educator/announcements"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
            >
              Mes candidatures
            </Link>
            <Link
              href="/annonces"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-semibold rounded-xl border border-teal-200 text-teal-700 hover:bg-teal-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Voir les annonces
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 mt-4">
            <div
              className="animate-spin rounded-full h-12 w-12 border-4 mx-auto"
              style={{
                borderTopColor: '#027e7e',
                borderRightColor: 'rgba(2, 126, 126, 0.2)',
                borderBottomColor: 'rgba(2, 126, 126, 0.2)',
                borderLeftColor: 'rgba(2, 126, 126, 0.2)',
              }}
              aria-hidden="true"
            />
            <p className="text-gray-500 mt-4">Chargement…</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 px-4 mt-4">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(240, 135, 159, 0.15)' }}
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#f0879f" stroke="#f0879f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Aucun favori pour le moment
            </h3>
            <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
              Cliquez sur le cœur d&apos;une annonce pour la sauvegarder ici et y revenir plus tard.
            </p>
            <Link
              href="/annonces"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition-all"
              style={{ backgroundColor: '#027e7e' }}
            >
              Parcourir les annonces
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 mt-4">
            {favorites.map((f) => (
              <AnnouncementListItem
                key={f.id}
                announcement={f.announcement}
                favorited={true}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  );
}
