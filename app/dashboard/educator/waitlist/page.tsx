'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function EducatorWaitlistPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
  }, []);

  return (
    <div className="min-h-screen bg-[#fdf9f4]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/dashboard/educator" className="text-sm text-[#41005c] hover:underline">← Retour au tableau de bord</Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-2">
            Liste d&apos;attente
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Familles qui attendent un créneau correspondant à leurs critères. Elles sont automatiquement notifiées dès qu&apos;un slot se libère.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement…</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucune famille en liste d&apos;attente</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Les familles peuvent rejoindre votre liste d&apos;attente depuis votre fiche publique.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-lg" style={{ color: '#41005c' }}>
                {entries.length}
              </div>
              <p className="text-sm text-gray-700">
                <strong>{entries.length}</strong> famille{entries.length > 1 ? 's' : ''} en attente d&apos;un créneau chez vous
              </p>
            </div>

            {entries.map(entry => (
              <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#f0fafa] flex items-center justify-center text-[#027e7e] font-semibold flex-shrink-0">
                    {entry.family_first_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {entry.family_first_name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Inscrite le {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(entry.preferred_days || []).map(d => (
                        <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-[#f0fafa] text-[#027e7e] font-medium">
                          {DAY_LABELS[d] || d}
                        </span>
                      ))}
                    </div>

                    {entry.preferred_time_range && (
                      <p className="text-xs text-gray-600 mb-2">
                        🕐 Créneaux préférés : {entry.preferred_time_range.start} – {entry.preferred_time_range.end}
                      </p>
                    )}

                    {entry.notes && (
                      <p className="text-sm text-gray-700 italic mt-2 bg-gray-50 rounded-lg p-3">
                        « {entry.notes} »
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-3">
                      {entry.notified_count > 0
                        ? `${entry.notified_count} notification${entry.notified_count > 1 ? 's' : ''} envoyée${entry.notified_count > 1 ? 's' : ''}`
                        : 'Pas encore notifiée'}
                    </p>
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
