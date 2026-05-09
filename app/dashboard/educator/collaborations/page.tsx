'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

interface CollabRow {
  id: string;
  child_id: string;
  invited_by: string;
  invited_educator_id: string;
  permission: 'read' | 'write';
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'left';
  message: string | null;
  invited_at: string;
  responded_at: string | null;
  inviter: { id: string; first_name: string | null; last_name: string | null } | null;
  invitee: { id: string; first_name: string | null; last_name: string | null } | null;
  child: { id: string; first_name: string } | null;
}

export default function CollaborationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [received, setReceived] = useState<CollabRow[]>([]);
  const [sent, setSent] = useState<CollabRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      const res = await fetch('/api/ppa/invitations', { credentials: 'include' });
      if (!res.ok) {
        if (!cancelled) toast.showToast('Impossible de charger les collaborations', 'error');
        return;
      }
      const json = await res.json();
      if (!cancelled) {
        setReceived(json.received || []);
        setSent(json.sent || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router, toast]);

  async function act(id: string, action: 'accept' | 'decline' | 'revoke' | 'leave') {
    setBusyId(id);
    try {
      const res = await fetch(`/api/ppa/collaborations/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.showToast(json.error || 'Erreur', 'error');
        return;
      }
      // Refresh
      const refreshed = await fetch('/api/ppa/invitations', { credentials: 'include' });
      const json = await refreshed.json();
      setReceived(json.received || []);
      setSent(json.sent || []);
      toast.showToast('Collaboration mise à jour', 'success');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-500">Chargement…</p>
      </div>
    );
  }

  const pendingReceived = received.filter((r) => r.status === 'pending');
  const acceptedReceived = received.filter((r) => r.status === 'accepted');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/educator" className="text-sm text-gray-500 hover:text-gray-700">← Retour</Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Collaborations sur le PPA</h1>
          <p className="text-sm text-gray-500 mt-1">Coordonnez le suivi avec d'autres professionnels.</p>
        </div>

        {/* Invitations reçues en attente */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Invitations reçues</h2>
          {pendingReceived.length === 0 ? (
            <p className="text-sm text-gray-500 bg-white rounded-xl p-5 border border-gray-100">
              Aucune invitation en attente.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingReceived.map((c) => (
                <div key={c.id} className="bg-white rounded-xl p-5 border border-gray-100">
                  <p className="text-sm text-gray-700">
                    <strong>{(c.inviter?.first_name || '') + ' ' + (c.inviter?.last_name || '')}</strong>{' '}
                    vous invite à{' '}
                    <strong>{c.permission === 'write' ? 'consulter et modifier' : 'consulter'}</strong>{' '}
                    le PPA de <strong>{c.child?.first_name || 'l\'enfant'}</strong>.
                  </p>
                  {c.message && (
                    <p className="mt-2 text-sm text-gray-600 italic bg-gray-50 rounded-lg p-3 border border-gray-100">
                      « {c.message} »
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={busyId === c.id}
                      onClick={() => act(c.id, 'accept')}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: '#41005c' }}
                    >
                      Accepter
                    </button>
                    <button
                      disabled={busyId === c.id}
                      onClick={() => act(c.id, 'decline')}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200 bg-white"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Collaborations actives */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Collaborations actives</h2>
          {acceptedReceived.length === 0 ? (
            <p className="text-sm text-gray-500 bg-white rounded-xl p-5 border border-gray-100">
              Aucune collaboration active sur des suivis externes.
            </p>
          ) : (
            <div className="space-y-3">
              {acceptedReceived.map((c) => (
                <div key={c.id} className="bg-white rounded-xl p-5 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-700">
                      Suivi de <strong>{c.child?.first_name || 'l\'enfant'}</strong> — invité(e) par{' '}
                      <strong>{(c.inviter?.first_name || '') + ' ' + (c.inviter?.last_name || '')}</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Permission : {c.permission === 'write' ? 'lecture + écriture' : 'lecture seule'}
                    </p>
                  </div>
                  <button
                    disabled={busyId === c.id}
                    onClick={() => act(c.id, 'leave')}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200 bg-white"
                  >
                    Quitter
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Invitations envoyées */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Invitations envoyées</h2>
          {sent.length === 0 ? (
            <p className="text-sm text-gray-500 bg-white rounded-xl p-5 border border-gray-100">
              Vous n'avez encore invité personne.
            </p>
          ) : (
            <div className="space-y-3">
              {sent.map((c) => (
                <div key={c.id} className="bg-white rounded-xl p-5 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-700">
                      <strong>{(c.invitee?.first_name || '') + ' ' + (c.invitee?.last_name || '')}</strong>{' '}
                      pour <strong>{c.child?.first_name || 'l\'enfant'}</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Statut : <StatusBadge status={c.status} /> ·{' '}
                      {c.permission === 'write' ? 'lecture + écriture' : 'lecture seule'}
                    </p>
                  </div>
                  {(c.status === 'pending' || c.status === 'accepted') && (
                    <button
                      disabled={busyId === c.id}
                      onClick={() => act(c.id, 'revoke')}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 bg-white"
                    >
                      Révoquer
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'En attente', cls: 'text-amber-700 bg-amber-50' },
    accepted: { label: 'Acceptée', cls: 'text-green-700 bg-green-50' },
    declined: { label: 'Refusée', cls: 'text-gray-600 bg-gray-100' },
    revoked: { label: 'Révoquée', cls: 'text-gray-600 bg-gray-100' },
    left: { label: 'Quittée', cls: 'text-gray-600 bg-gray-100' },
  };
  const m = map[status] || { label: status, cls: 'text-gray-600 bg-gray-100' };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${m.cls}`}>{m.label}</span>;
}
