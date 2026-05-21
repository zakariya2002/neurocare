'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import EducatorNavbar from '@/components/EducatorNavbar';
import MyResponseCard from '@/components/annonces/MyResponseCard';
import {
  AnnouncementResponse,
  FamilyAnnouncement,
  ResponseStatus,
  RESPONSE_STATUS_LABELS,
} from '@/components/annonces/types';

type Tab = 'all' | ResponseStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: RESPONSE_STATUS_LABELS.pending },
  { key: 'accepted', label: RESPONSE_STATUS_LABELS.accepted },
  { key: 'rejected', label: RESPONSE_STATUS_LABELS.rejected },
  { key: 'withdrawn', label: RESPONSE_STATUS_LABELS.withdrawn },
];

export default function MyAnnouncementsResponsesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<AnnouncementResponse[]>([]);
  const [tab, setTab] = useState<Tab>('all');
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

      const res = await fetch('/api/educator/responses');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Impossible de charger vos candidatures (HTTP ${res.status}).`);
        setResponses([]);
        return;
      }
      const data = await res.json();
      const list: AnnouncementResponse[] = data.items || data.responses || [];

      // Fallback : si annonce non jointe, fetch individuel
      const missing = list.filter((r) => !r.announcement).map((r) => r.announcement_id);
      const uniqueMissing = Array.from(new Set(missing));
      const fetched: Record<string, FamilyAnnouncement> = {};
      if (uniqueMissing.length > 0) {
        await Promise.all(
          uniqueMissing.map(async (id) => {
            try {
              const r = await fetch(`/api/announcements/${id}`);
              if (r.ok) {
                const d = await r.json();
                if (d.announcement) fetched[id] = d.announcement;
              }
            } catch {
              // ignore
            }
          }),
        );
      }
      const enriched = list.map((r) =>
        r.announcement ? r : { ...r, announcement: fetched[r.announcement_id] },
      );
      setResponses(enriched);
    } catch (err: any) {
      setError(err?.message || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawn = (responseId: string) => {
    setResponses((prev) =>
      prev.map((r) => (r.id === responseId ? { ...r, status: 'withdrawn' as ResponseStatus } : r)),
    );
  };

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      all: responses.length,
      pending: 0,
      read: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };
    responses.forEach((r) => {
      c[r.status] = (c[r.status] || 0) + 1;
    });
    return c;
  }, [responses]);

  const filtered = useMemo(() => {
    const list = tab === 'all' ? responses : responses.filter((r) => r.status === tab);
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [responses, tab]);

  return (
    <div className="min-h-screen min-h-[100dvh]" style={{ backgroundColor: '#fdf9f4' }}>
      <EducatorNavbar profile={profile} />

      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold text-gray-900"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              Mes candidatures
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Suivez l'état de vos réponses aux annonces familles.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/dashboard/educator/favorites"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-semibold rounded-xl border transition-all"
              style={{ borderColor: '#f0879f', color: '#b9456d' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#f0879f" stroke="#f0879f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              Mes favoris
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

        {/* Tabs */}
        <div className="mt-4 mb-4 overflow-x-auto -mx-3 sm:mx-0">
          <div className="flex gap-2 px-3 sm:px-0 min-w-max">
            {TABS.map((t) => {
              const active = tab === t.key;
              const count = counts[t.key];
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all whitespace-nowrap ${
                    active ? 'text-white' : 'text-gray-700 bg-white border-gray-200 hover:border-teal-400'
                  }`}
                  style={active ? { backgroundColor: '#027e7e', borderColor: '#027e7e' } : {}}
                  aria-pressed={active}
                >
                  {t.label}
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] px-1 rounded-full text-xs font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100">
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 px-4">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}
            >
              <svg className="w-8 h-8" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              {tab === 'all' ? 'Aucune candidature pour le moment' : 'Aucune candidature dans cette catégorie'}
            </h3>
            <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
              Parcourez les annonces familles et postulez à celles qui vous correspondent.
            </p>
            <Link
              href="/annonces"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition-all"
              style={{ backgroundColor: '#027e7e' }}
            >
              Voir les annonces
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filtered.map((r) => (
              <MyResponseCard key={r.id} response={r} onWithdrawn={handleWithdrawn} />
            ))}
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  );
}
