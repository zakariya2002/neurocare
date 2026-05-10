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

const RED_BG = '#fee2e2';
const RED_BORDER = 'rgba(220, 38, 38, 0.25)';
const RED_TEXT = '#7f1d1d';

const ACTION_VISUAL: Record<
  AuditAction,
  { iconPath: string; color: string; bg: string }
> = {
  view: {
    iconPath:
      'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7s-8.27-2.94-9.54-7z',
    color: '#3a9e9e',
    bg: 'rgba(58, 158, 158, 0.12)',
  },
  download: {
    iconPath:
      'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z',
    color: '#027e7e',
    bg: 'rgba(2, 126, 126, 0.12)',
  },
  signed_url: {
    iconPath:
      'M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1',
    color: '#0891b2',
    bg: 'rgba(8, 145, 178, 0.12)',
  },
  share_grant: {
    iconPath:
      'M8.7 13.3l6.6 3.4M15.3 7.3l-6.6 3.4M19 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM19 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.12)',
  },
  share_revoke: {
    iconPath:
      'M18.36 5.64a9 9 0 1 1-12.73 0M12 3v6',
    color: '#a16207',
    bg: 'rgba(217, 119, 6, 0.12)',
  },
  update: {
    iconPath:
      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.12)',
  },
  delete: {
    iconPath:
      'M19 7l-.87 12.14A2 2 0 0 1 16.14 21H7.86a2 2 0 0 1-1.99-1.86L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3',
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.12)',
  },
  create: {
    iconPath: 'M12 4v16m8-8H4',
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.12)',
  },
};

function relativeFr(iso: string): string {
  const t = new Date(iso).getTime();
  const diffMs = Date.now() - t;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "à l'instant";
  const min = Math.round(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `il y a ${hr} h`;
  const day = Math.round(hr / 24);
  if (day < 7) return `il y a ${day} j`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

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
      <div className="bg-white sm:rounded-2xl shadow-xl w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden">
        <div
          className="px-4 sm:px-6 py-3.5 border-b flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: RED_BG, borderColor: RED_BORDER }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(220, 38, 38, 0.18)' }}
              aria-hidden="true"
            >
              <svg className="w-5 h-5" fill="none" stroke="#dc2626" strokeWidth={2} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <h2
                id="activity-dialog-title"
                className="text-base sm:text-lg font-bold truncate"
                style={{ fontFamily: 'Verdana, sans-serif', color: RED_TEXT }}
              >
                Activité du document
              </h2>
              <p className="text-[11px] sm:text-xs truncate" style={{ color: '#991b1b' }}>
                {document.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-red-100/60 rounded-lg transition flex-shrink-0"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" style={{ color: RED_TEXT }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          <p className="text-[11px] sm:text-xs text-gray-500 mb-3">
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
            <ol className="relative space-y-3 pl-6 before:absolute before:top-2 before:bottom-2 before:left-[14px] before:w-px before:bg-gray-200">
              {entries.map((entry) => {
                const isMe = entry.user_id === currentUserId;
                const actor = entry.actor_display_name ?? (isMe ? 'Vous' : 'Utilisateur inconnu');
                const visual = ACTION_VISUAL[entry.action] ?? {
                  iconPath: 'M12 8v4m0 4h.01',
                  color: '#6b7280',
                  bg: 'rgba(107, 114, 128, 0.12)',
                };
                return (
                  <li key={entry.id} className="relative">
                    <span
                      className="absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center ring-2 ring-white"
                      style={{ backgroundColor: visual.bg }}
                      aria-hidden="true"
                    >
                      <svg className="w-4 h-4" fill="none" stroke={visual.color} strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={visual.iconPath} />
                      </svg>
                    </span>
                    <div className="bg-white rounded-xl border border-gray-100 px-3 py-2 shadow-sm">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-semibold">{actor}</span>
                          <span className="font-normal text-gray-600">
                            {' '}
                            — {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-gray-500 whitespace-nowrap">
                          {relativeFr(entry.occurred_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatFrenchDateTime(entry.occurred_at)}
                        {entry.ip && <span className="ml-1.5">· {entry.ip}</span>}
                      </p>
                      {entry.user_agent && (
                        <p
                          className="text-[10px] text-gray-400 mt-0.5 truncate"
                          title={entry.user_agent}
                        >
                          {entry.user_agent}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-white flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
