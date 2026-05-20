'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnnouncementResponse } from './types';

interface ResponsesListProps {
  announcementId: string;
  responses: AnnouncementResponse[];
  onChange?: (responses: AnnouncementResponse[]) => void;
}

const STATUS_LABELS: Record<AnnouncementResponse['status'], string> = {
  new: 'Nouvelle',
  read: 'Lue',
  shortlisted: 'Présélectionnée',
  accepted: 'Acceptée',
  declined: 'Déclinée',
};

const STATUS_STYLES: Record<AnnouncementResponse['status'], React.CSSProperties> = {
  new: { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309', borderColor: 'rgba(245, 158, 11, 0.3)' },
  read: { backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#374151', borderColor: 'rgba(107, 114, 128, 0.3)' },
  shortlisted: { backgroundColor: 'rgba(240, 135, 159, 0.1)', color: '#be3a5d', borderColor: 'rgba(240, 135, 159, 0.3)' },
  accepted: { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#15803d', borderColor: 'rgba(34, 197, 94, 0.3)' },
  declined: { backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#b91c1c', borderColor: 'rgba(220, 38, 38, 0.3)' },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function ResponsesList({ announcementId, responses, onChange }: ResponsesListProps) {
  const [list, setList] = useState<AnnouncementResponse[]>(responses);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const updateStatus = async (response: AnnouncementResponse, next: AnnouncementResponse['status']) => {
    setBusyId(response.id);
    setError('');
    try {
      const res = await fetch(`/api/announcements/${announcementId}/responses/${response.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Action impossible.');
      }
      const updated = list.map((r) => (r.id === response.id ? { ...r, status: next } : r));
      setList(updated);
      onChange?.(updated);
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue.');
    } finally {
      setBusyId(null);
    }
  };

  if (list.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
          <svg className="w-8 h-8" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">Aucune réponse pour le moment.</p>
        <p className="text-xs text-gray-400 mt-1">Les pros peuvent répondre dès que l&apos;annonce est publiée.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r text-sm" role="alert">
          {error}
        </div>
      )}

      {list.map((r) => {
        const pro = r.educator;
        return (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200"
                style={{ background: pro?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #027e7e 0%, #3a9e9e 100%)' }}
              >
                {pro?.avatar_url ? (
                  <img src={pro.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {(pro?.first_name?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    {pro ? (
                      <Link
                        href={`/educator/${pro.id}`}
                        className="font-semibold text-gray-900 hover:underline text-sm"
                      >
                        {pro.first_name} {pro.last_name?.toUpperCase()}
                      </Link>
                    ) : (
                      <p className="font-semibold text-gray-900 text-sm">Professionnel</p>
                    )}
                    {pro?.profession_type && (
                      <p className="text-xs text-gray-500">{pro.profession_type}</p>
                    )}
                  </div>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
                    style={STATUS_STYLES[r.status]}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{r.message}</p>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                  {r.proposed_rate !== null && r.proposed_rate !== undefined && (
                    <span className="font-semibold" style={{ color: '#027e7e' }}>
                      Tarif proposé : {r.proposed_rate} €
                    </span>
                  )}
                  <span>{formatDate(r.created_at)}</span>
                </div>

                {r.status !== 'accepted' && r.status !== 'declined' && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                    {r.status === 'new' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(r, 'read')}
                        disabled={busyId === r.id}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50"
                      >
                        Marquer comme lue
                      </button>
                    )}
                    {r.status !== 'shortlisted' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(r, 'shortlisted')}
                        disabled={busyId === r.id}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)', color: '#be3a5d' }}
                      >
                        Présélectionner
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('Choisir ce professionnel ? L\'annonce sera marquée comme pourvue.')) return;
                        updateStatus(r, 'accepted');
                      }}
                      disabled={busyId === r.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#027e7e' }}
                    >
                      Accepter ce pro
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(r, 'declined')}
                      disabled={busyId === r.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Décliner
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
