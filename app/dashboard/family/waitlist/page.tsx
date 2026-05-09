'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import FamilyNavbar from '@/components/FamilyNavbar';

const DAY_LABELS: Record<string, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu',
  friday: 'Ven', saturday: 'Sam', sunday: 'Dim',
};

interface WaitlistEntry {
  id: string;
  educator_id: string;
  preferred_days: string[];
  preferred_time_range: { start: string; end: string } | null;
  status: 'active' | 'matched' | 'cancelled' | 'expired';
  notified_count: number;
  last_notified_at: string | null;
  expires_at: string;
  created_at: string;
  educator: {
    id: string;
    first_name: string;
    last_name: string;
    profession: string | null;
    photo_url: string | null;
    city: string | null;
  } | null;
}

export default function FamilyWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/waitlist/list');
      const data = await res.json();
      if (res.ok) setEntries(data.entries || []);
    } catch (err) {
      console.error('Erreur chargement waitlist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleLeave = async (entryId: string) => {
    if (!confirm('Quitter cette liste d\'attente ?')) return;
    setLeavingId(entryId);
    try {
      const res = await fetch('/api/waitlist/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId }),
      });
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== entryId));
      }
    } catch (err) {
      console.error('Erreur leave:', err);
    } finally {
      setLeavingId(null);
    }
  };

  const activeEntries = entries.filter(e => e.status === 'active');
  const inactiveEntries = entries.filter(e => e.status !== 'active');

  return (
    <div className="min-h-screen bg-[#fdf9f4]">
      <FamilyNavbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Mes listes d&apos;attente
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Vous serez prévenu(e) par email dès qu&apos;un créneau correspondant à vos critères se libère.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement…</div>
        ) : activeEntries.length === 0 && inactiveEntries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#f0fafa] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#027e7e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucune liste d&apos;attente</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Quand un professionnel n&apos;a pas de créneau dispo, rejoignez sa liste d&apos;attente depuis sa fiche.
            </p>
            <Link href="/search" className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg text-sm transition-all hover:opacity-90" style={{ backgroundColor: '#027e7e' }}>
              Rechercher un professionnel
            </Link>
          </div>
        ) : (
          <>
            {activeEntries.length > 0 && (
              <div className="space-y-4 mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">En attente ({activeEntries.length})</h2>
                {activeEntries.map(entry => (
                  <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          {entry.educator?.photo_url ? (
                            <img src={entry.educator.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#f0fafa] flex items-center justify-center text-[#027e7e] font-semibold">
                              {entry.educator?.first_name?.[0] || '?'}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {entry.educator ? `${entry.educator.first_name} ${entry.educator.last_name}` : 'Professionnel'}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {entry.educator?.profession || ''}
                              {entry.educator?.city ? ` · ${entry.educator.city}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(entry.preferred_days || []).map(d => (
                            <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-[#f0fafa] text-[#027e7e] font-medium">
                              {DAY_LABELS[d] || d}
                            </span>
                          ))}
                        </div>

                        {entry.preferred_time_range && (
                          <p className="text-xs text-gray-500">
                            🕐 {entry.preferred_time_range.start} – {entry.preferred_time_range.end}
                          </p>
                        )}

                        {entry.notified_count > 0 && (
                          <p className="text-xs text-gray-400 mt-2">
                            {entry.notified_count} notification{entry.notified_count > 1 ? 's' : ''} envoyée{entry.notified_count > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-row sm:flex-col gap-2">
                        {entry.educator && (
                          <Link
                            href={`/educator/${entry.educator.id}`}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white font-semibold rounded-lg text-sm transition-all hover:opacity-90"
                            style={{ backgroundColor: '#027e7e' }}
                          >
                            Voir le profil
                          </Link>
                        )}
                        <button
                          onClick={() => handleLeave(entry.id)}
                          disabled={leavingId === entry.id}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 font-semibold rounded-lg text-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                        >
                          {leavingId === entry.id ? '...' : 'Quitter'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {inactiveEntries.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Historique</h2>
                {inactiveEntries.map(entry => (
                  <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 p-5 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {entry.educator ? `${entry.educator.first_name} ${entry.educator.last_name}` : 'Professionnel'}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {entry.status === 'cancelled' ? 'Annulée' : entry.status === 'expired' ? 'Expirée' : 'Réservé'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
