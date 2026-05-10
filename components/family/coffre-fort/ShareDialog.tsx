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
  /** Notifie le parent qu'un partage a changé (refresh éventuel). */
  onChange?: () => void;
}

/**
 * Dialog de gestion des partages d'un document : liste les partages actifs,
 * permet d'en créer / révoquer.
 */
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
      <div className="bg-white sm:rounded-2xl shadow-xl w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 id="share-dialog-title" className="text-lg font-bold text-gray-900">
              Partager ce document
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

        <div className="p-4 sm:p-6 space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-900">
            Vous gardez le contrôle. Le destinataire doit déjà être collaborateur du dossier
            de l&apos;enfant. Vous pouvez révoquer un partage à tout moment.
          </div>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Partages actifs</h3>
            {loading ? (
              <p className="text-xs text-gray-500">Chargement…</p>
            ) : shares.length === 0 ? (
              <p className="text-xs text-gray-500">Aucun partage pour ce document.</p>
            ) : (
              <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                {shares.map((s) => (
                  <li key={s.id} className="p-3 flex flex-wrap items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {s.recipient?.display_name ?? s.recipient?.email ?? s.shared_with_user_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ACCESS_LEVEL_LABELS[s.access_level]}
                        {s.expires_at && ` · expire le ${formatFrenchDateTime(s.expires_at)}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevoke(s.id)}
                      disabled={submitting}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      Révoquer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Ajouter un partage</h3>

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
              <form onSubmit={handleGrant} className="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
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
                            ? 'border-teal-500 bg-teal-50 text-teal-800'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
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
                  className="w-full px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  {submitting ? 'Partage en cours…' : 'Accorder le partage'}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
