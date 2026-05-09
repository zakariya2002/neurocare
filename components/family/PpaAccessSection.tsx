'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';

interface CollabRow {
  id: string;
  permission: 'read' | 'write';
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'left';
  invited_at: string;
  inviter: { first_name: string | null; last_name: string | null } | null;
  invitee: { first_name: string | null; last_name: string | null } | null;
}

export default function PpaAccessSection({ childId }: { childId: string }) {
  const toast = useToast();
  const [collabs, setCollabs] = useState<CollabRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/ppa/${childId}/collaborations`, { credentials: 'include' });
    if (res.ok) {
      const json = await res.json();
      setCollabs(json.collaborations || []);
    }
    setLoading(false);
  }, [childId]);

  useEffect(() => {
    load();
  }, [load]);

  async function revoke(id: string) {
    if (!confirm('Révoquer l\'accès de ce professionnel au PPA ?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/ppa/collaborations/${id}/revoke`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.showToast(json.error || 'Erreur', 'error');
        return;
      }
      toast.showToast('Accès révoqué', 'success');
      load();
    } finally {
      setBusyId(null);
    }
  }

  const active = collabs.filter((c) => ['pending', 'accepted'].includes(c.status));

  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100">
      <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
        Professionnels avec accès au PPA
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Vous pouvez révoquer un accès à tout moment.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : active.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aucun professionnel n'a actuellement d'accès partagé au PPA.
        </p>
      ) : (
        <ul className="space-y-2">
          {active.map((c) => (
            <li
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50"
            >
              <div className="text-sm">
                <p className="font-semibold text-gray-900">
                  {(c.invitee?.first_name || '') + ' ' + (c.invitee?.last_name || '')}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {c.status === 'pending' ? 'En attente d\'acceptation' : 'Accès actif'}
                  {' · '}
                  {c.permission === 'write' ? 'Lecture + écriture' : 'Lecture seule'}
                  {' · '}
                  Invité(e) par {(c.inviter?.first_name || '') + ' ' + (c.inviter?.last_name || '')}
                </p>
              </div>
              <button
                onClick={() => revoke(c.id)}
                disabled={busyId === c.id}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 bg-white"
              >
                Révoquer
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
