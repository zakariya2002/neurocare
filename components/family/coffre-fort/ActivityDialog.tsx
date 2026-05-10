'use client';

import { useEffect, useState } from 'react';
import {
  AUDIT_ACTION_LABELS,
  formatFrenchDateTime,
  type AuditAction,
  type ChildDocumentRow,
} from '@/lib/family/coffre-fort';

interface LogEntry {
  id: string;
  document_id: string;
  user_id: string;
  action: AuditAction;
  ip: string | null;
  user_agent: string | null;
  occurred_at: string;
  actor_display_name: string | null;
}

interface Props {
  open: boolean;
  document: ChildDocumentRow | null;
  childId: string;
  currentUserId: string;
  onClose: () => void;
}

/**
 * Affiche l'historique d'activité (audit log) d'un document : qui a vu / téléchargé /
 * partagé / modifié / supprimé, et quand.
 */
export default function ActivityDialog({
  open,
  document,
  childId,
  currentUserId,
  onClose,
}: Props) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !document) {
      setEntries([]);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/family/children/${childId}/documents/${document.id}/log`, {
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? 'Erreur de chargement');
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setEntries((json.entries ?? []) as LogEntry[]);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message ?? 'Erreur');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, document, childId]);

  if (!open || !document) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-stretch sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-dialog-title"
    >
      <div className="bg-white sm:rounded-2xl shadow-xl w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 id="activity-dialog-title" className="text-lg font-bold text-gray-900">
              Activité du document
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{document.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <p className="text-xs text-gray-500 mb-3">
            Chaque consultation, téléchargement ou partage de ce document est tracé. Vous voyez ici
            les 100 dernières actions.
          </p>

          {loading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : error ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune activité enregistrée pour le moment.</p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {entries.map((entry) => {
                const isMe = entry.user_id === currentUserId;
                const actor = entry.actor_display_name
                  ?? (isMe ? 'Vous' : 'Utilisateur inconnu');
                return (
                  <li key={entry.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)', color: '#027e7e' }}
                        aria-hidden="true"
                      >
                        {actor.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          <span>{actor}</span>{' '}
                          <span className="font-normal text-gray-600">
                            — {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatFrenchDateTime(entry.occurred_at)}
                          {entry.ip && ` · ${entry.ip}`}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
