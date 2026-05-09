'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import EducatorNavbar from '@/components/EducatorNavbar';

const DAY_LABELS: Record<string, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu',
  friday: 'Ven', saturday: 'Sam', sunday: 'Dim',
};

interface Entry {
  id: string;
  family_first_name: string;
  preferred_days: string[];
  preferred_time_range: { start: string; end: string } | null;
  notes: string | null;
  notified_count: number;
  last_notified_at: string | null;
  created_at: string;
  expires_at: string;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

export default function EducatorWaitlistPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      const { data: profileData } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (!cancelled) setProfile(profileData);

      try {
        const res = await fetch('/api/educator/waitlist');
        const data = await res.json();
        if (!cancelled && res.ok) setEntries(data.entries || []);
      } catch (err) {
        console.error('Erreur chargement waitlist pro:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  // Tri décroissant par date d'inscription
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <div className="sticky top-0 z-40">
        <EducatorNavbar profile={profile} />
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8">
        {/* En-tête avec flèche retour */}
        <div className="mb-3 sm:mb-5 md:mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors"
            aria-label="Retour"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs md:text-sm font-medium">Retour</span>
          </button>
          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full flex items-center justify-center p-1" style={{ backgroundColor: '#41005c' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/icons/waitlist.svg" alt="" className="w-full h-full" />
            </div>
            <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">Liste d&apos;attente</h1>
            <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm mt-1">Familles en attente d&apos;un créneau sur votre profil</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
              <svg className="w-10 h-10" style={{ color: '#41005c' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Aucune famille en attente</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Quand des familles ne trouveront pas de créneau correspondant à leurs critères sur votre profil, elles pourront rejoindre votre liste d&apos;attente. Elles seront automatiquement notifiées dès qu&apos;un créneau se libère.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Compteur en haut */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0" style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}>
                {sortedEntries.length}
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-base text-gray-900 font-semibold">
                  {sortedEntries.length} famille{sortedEntries.length > 1 ? 's' : ''} en attente
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Notifiées automatiquement dès qu&apos;un créneau se libère
                </p>
              </div>
            </div>

            {/* Cards entries */}
            {sortedEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold flex-shrink-0" style={{ backgroundColor: '#f0fafa', color: '#027e7e' }}>
                    {entry.family_first_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {entry.family_first_name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-gray-400 flex-shrink-0">
                        Inscrite {formatRelative(entry.created_at)}
                      </p>
                    </div>

                    {/* Jours préférés en chips */}
                    {entry.preferred_days?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {entry.preferred_days.map((d) => (
                          <span
                            key={d}
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: '#f0fafa', color: '#027e7e' }}
                          >
                            {DAY_LABELS[d] || d}
                          </span>
                        ))}
                      </div>
                    )}

                    {entry.preferred_time_range && (
                      <p className="text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Créneaux préférés : <strong className="text-gray-700 font-semibold">{entry.preferred_time_range.start} – {entry.preferred_time_range.end}</strong>
                      </p>
                    )}

                    {entry.notes && (
                      <p className="text-sm text-gray-700 italic mt-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        « {entry.notes} »
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-[11px] sm:text-xs text-gray-400">
                      {entry.notified_count > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          {entry.notified_count} notification{entry.notified_count > 1 ? 's' : ''} envoyée{entry.notified_count > 1 ? 's' : ''}
                          {entry.last_notified_at && ` · dernière ${formatRelative(entry.last_notified_at)}`}
                        </span>
                      ) : (
                        <span>Pas encore notifiée</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
