'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import MyAnnouncementCard from '@/components/family/announcements/MyAnnouncementCard';
import {
  AnnouncementStatus,
  FamilyAnnouncement,
  STATUS_LABELS,
} from '@/components/family/announcements/types';

type FilterKey = 'all' | AnnouncementStatus;

const TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'draft', label: STATUS_LABELS.draft },
  { key: 'pending', label: STATUS_LABELS.pending },
  { key: 'published', label: STATUS_LABELS.published },
  { key: 'rejected', label: STATUS_LABELS.rejected },
  { key: 'filled', label: STATUS_LABELS.filled },
  { key: 'expired', label: STATUS_LABELS.expired },
];

export default function FamilyAnnouncementsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<FamilyAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      setUserId(session.user.id);

      const { data: family } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!active) return;

      if (family) {
        setProfile(family);
        setFamilyId(family.id);
      }

      try {
        const res = await fetch('/api/family/announcements');
        if (!res.ok) throw new Error('Impossible de charger les annonces.');
        const body = await res.json();
        if (active) setAnnouncements(body.announcements || []);
      } catch (e: any) {
        if (active) setError(e.message || 'Erreur de chargement.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const filtered = useMemo(() => {
    if (filter === 'all') return announcements;
    return announcements.filter((a) => a.status === filter);
  }, [announcements, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: announcements.length };
    for (const a of announcements) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [announcements]);

  const handleArchive = async (id: string) => {
    if (!confirm('Archiver cette annonce ?')) return;
    try {
      const res = await fetch(`/api/family/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      if (!res.ok) throw new Error('Archivage impossible.');
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      setError(e.message || 'Erreur.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      <section className="py-3 sm:py-5 md:py-8 px-3 sm:px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            aria-label="Retour"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Retour</span>
          </button>

          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <h1
                className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900"
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                Mes annonces
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Publiez vos besoins et recevez des candidatures de pros.
              </p>
            </div>
            <Link
              href="/dashboard/family/announcements/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl hover:opacity-90 transition-all text-sm font-bold shadow-md"
              style={{ backgroundColor: '#f0879f' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle annonce
            </Link>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
            {TABS.map((tab) => {
              const active = filter === tab.key;
              const count = counts[tab.key] || 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full border transition-all ${
                    active ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                  style={active ? { backgroundColor: '#027e7e' } : {}}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r text-sm mb-4" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto"
                style={{ borderTopColor: '#027e7e', borderRightColor: '#3a9e9e', borderBottomColor: '#6bbebe', borderLeftColor: 'rgba(2, 126, 126, 0.2)' }} />
              <p className="text-gray-600 mt-4 text-sm">Chargement...</p>
            </div>
          ) : filtered.length === 0 ? (
            announcements.length === 0 ? (
              <div className="text-center py-16 sm:py-20 bg-white rounded-2xl shadow-md border border-gray-100 px-4">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
                  <svg className="w-10 h-10" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  Aucune annonce pour le moment
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  Publiez vos besoins et laissez les professionnels venir à vous. C&apos;est gratuit et rapide.
                </p>
                <Link
                  href="/dashboard/family/announcements/new"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Créer ma première annonce
                </Link>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-600">Aucune annonce dans ce filtre.</p>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <MyAnnouncementCard key={a.id} announcement={a} onArchive={handleArchive} />
              ))}
            </div>
          )}

          <div className="h-20" />
        </div>
      </section>

      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
