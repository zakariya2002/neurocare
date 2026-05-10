'use client';

import { useEffect, useState } from 'react';
import {
  ACCESS_LEVELS,
  ACCESS_LEVEL_LABELS,
  formatFrenchDateTime,
  type AccessLevel,
  type ChildDocumentRow,
} from '@/lib/family/coffre-fort';

interface ShareRow {
  id: string;
  document_id: string;
  shared_with_user_id: string;
  access_level: AccessLevel;
  granted_by: string;
  expires_at: string | null;
  created_at: string;
  recipient: { display_name: string | null; email: string | null } | null;
}

interface EligibleCollaborator {
  user_id: string;
  display_name: string | null;
  email: string | null;
}

interface Props {
  open: boolean;
  document: ChildDocumentRow | null;
  childId: string;
  onClose: () => void;
  onChange?: () => void;
}

const RED_BG = '#fee2e2';
const RED_BORDER = 'rgba(220, 38, 38, 0.25)';
const RED_TEXT = '#7f1d1d';

function initials(name: string | null | undefined, fallback: string): string {
  const n = (name ?? '').trim();
  if (!n) return fallback;
  const parts = n.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ShareDialog({ open, document, childId, onClose, onChange }: Props) {
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [eligible, setEligible] = useState<EligibleCollaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('read');
  const [expiresAt, setExpiresAt] = useState<string>('');

  useEffect(() => {
    if (!open || !document) {
      setShares([]);
      setEligible([]);
      setError(null);
      setLoading(false);
      setSubmitting(false);
      setSelectedUser('');
      setAccessLevel('read');
      setExpiresAt('');
      return;
    }
    fetchShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, document?.id]);

  const fetchShares = async () => {
    if (!document) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/family/children/${childId}/documents/${document.id}/shares`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Erreur de chargement');
      }
      const json = await res.json();
      setShares((json.shares ?? []) as ShareRow[]);
      setEligible((json.eligibleCollaborators ?? []) as EligibleCollaborator[]);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !selectedUser) {
      setError('Sélectionnez un destinataire.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/family/children/${childId}/documents/${document.id}/shares`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shared_with_user_id: selectedUser,
            access_level: accessLevel,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          }),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Erreur enregistrement');
      }
      setSelectedUser('');
      setAccessLevel('read');
      setExpiresAt('');
      await fetchShares();
      onChange?.();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    if (!document) return;
    if (!confirm('Révoquer ce partage ? Le destinataire ne pourra plus accéder à ce document.')) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/family/children/${childId}/documents/${document.id}/shares/${shareId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Erreur révocation');
      }
      await fetchShares();
      onChange?.();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !document) return null;

  const sharedUserIds = new Set(shares.map((s) => s.shared_with_user_id));
  const availableEligible = eligible.filter((c) => !sharedUserIds.has(c.user_id));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-stretch sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.7 13.3l6.6 3.4M15.3 7.3l-6.6 3.4M19 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM19 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2
                id="share-dialog-title"
                className="text-base sm:text-lg font-bold truncate"
                style={{ fontFamily: 'Verdana, sans-serif', color: RED_TEXT }}
              >
                Partager ce document
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

        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{
              backgroundColor: 'rgba(2, 126, 126, 0.08)',
              borderColor: 'rgba(2, 126, 126, 0.25)',
              color: '#015c5c',
            }}
          >
            Vous gardez le contrôle. Le destinataire doit déjà être collaborateur du dossier
            de l&apos;enfant. Vous pouvez révoquer un partage à tout moment.
          </div>

          <section>
            <h3 className="text-sm font-bold mb-2" style={{ color: '#015c5c' }}>
              Partages actifs
            </h3>
            {loading ? (
              <p className="text-xs text-gray-500">Chargement…</p>
            ) : shares.length === 0 ? (
              <p className="text-xs text-gray-500">Aucun partage pour ce document.</p>
            ) : (
              <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                {shares.map((s) => {
                  const name = s.recipient?.display_name ?? s.recipient?.email ?? s.shared_with_user_id;
                  return (
                    <li key={s.id} className="p-3 flex items-center gap-3">
                      <span
                        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: '#027e7e' }}
                        aria-hidden="true"
                      >
                        {initials(s.recipient?.display_name, '?')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                        <p className="text-[11px] text-gray-500">
                          {ACCESS_LEVEL_LABELS[s.access_level]}
                          {s.expires_at && ` · expire le ${formatFrenchDateTime(s.expires_at)}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevoke(s.id)}
                        disabled={submitting}
                        className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded-md disabled:opacity-50"
                      >
                        Révoquer
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-bold mb-2" style={{ color: '#015c5c' }}>
              Ajouter un partage
            </h3>

            {availableEligible.length === 0 && eligible.length === 0 ? (
              <p className="text-xs text-gray-500">
                Aucun pro n&apos;est encore collaborateur du dossier. Invitez-en un depuis
                la fiche enfant pour pouvoir lui partager des documents.
              </p>
            ) : availableEligible.length === 0 ? (
              <p className="text-xs text-gray-500">
                Tous les collaborateurs disponibles ont déjà un partage sur ce document.
              </p>
            ) : (
              <form
                onSubmit={handleGrant}
                className="space-y-3 border border-gray-200 rounded-xl p-3 bg-gray-50"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Destinataire</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                    required
                  >
                    <option value="">— Choisir un collaborateur —</option>
                    {availableEligible.map((c) => (
                      <option key={c.user_id} value={c.user_id}>
                        {c.display_name ?? c.email ?? c.user_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Niveau d&apos;accès</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {ACCESS_LEVELS.map((lvl) => (
                      <label
                        key={lvl}
                        className={`flex-1 cursor-pointer px-3 py-2 rounded-lg border text-sm transition ${
                          accessLevel === lvl
                            ? 'shadow-sm font-semibold'
                            : 'hover:border-gray-400'
                        }`}
                        style={
                          accessLevel === lvl
                            ? {
                                borderColor: '#027e7e',
                                backgroundColor: 'rgba(2, 126, 126, 0.08)',
                                color: '#015c5c',
                              }
                            : {
                                borderColor: '#d1d5db',
                                backgroundColor: '#ffffff',
                                color: '#374151',
                              }
                        }
                      >
                        <input
                          type="radio"
                          name="access_level"
                          value={lvl}
                          checked={accessLevel === lvl}
                          onChange={() => setAccessLevel(lvl)}
                          className="sr-only"
                        />
                        {ACCESS_LEVEL_LABELS[lvl]}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Expiration du partage (optionnel)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selectedUser}
                  className="w-full px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 shadow-sm"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  {submitting ? 'Partage en cours…' : 'Accorder le partage'}
                </button>
              </form>
            )}
          </section>
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
