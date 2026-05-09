'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import EducatorNavbar from '@/components/EducatorNavbar';

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

function fullName(p: { first_name: string | null; last_name: string | null } | null | undefined): string {
  if (!p) return 'Un confrère';
  return `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Un confrère';
}

function initial(p: { first_name: string | null } | null | undefined): string {
  return p?.first_name?.[0]?.toUpperCase() || '?';
}

export default function CollaborationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<any>(null);
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

      const { data: profileData } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (!cancelled) setProfile(profileData);

      const res = await fetch('/api/ppa/invitations', { credentials: 'include' });
      if (!res.ok) {
        if (!cancelled) {
          toast.showToast('Impossible de charger les collaborations', 'error');
          setLoading(false);
        }
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
      const refreshed = await fetch('/api/ppa/invitations', { credentials: 'include' });
      const json = await refreshed.json();
      setReceived(json.received || []);
      setSent(json.sent || []);
      toast.showToast('Collaboration mise à jour', 'success');
    } finally {
      setBusyId(null);
    }
  }

  const pendingReceived = received.filter((r) => r.status === 'pending');
  const acceptedReceived = received.filter((r) => r.status === 'accepted');
  const totalCount = pendingReceived.length + acceptedReceived.length + sent.length;

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
              <img src="/images/icons/handshake-badge.svg" alt="" className="w-full h-full" />
            </div>
            <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">Mes collaborations</h1>
            <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm mt-1">Partagez le dossier complet d&apos;un enfant avec d&apos;autres professionnels</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="space-y-5">
            {/* Empty state principal */}
            <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border border-purple-100 p-6 sm:p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #41005c 0%, #7c3aed 100%)' }}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Travaillez à plusieurs sur un même dossier</h2>
              <p className="text-sm text-gray-600 max-w-lg mx-auto mb-6 leading-relaxed">
                Invitez d&apos;autres professionnels (orthophoniste, psychologue, ergothérapeute…) à <strong>consulter ou éditer le dossier complet</strong> d&apos;un enfant que vous suivez : profil, PPA, historique de séances, notes.
              </p>
            </div>

            {/* Comment faire — étapes visuelles */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: '#41005c' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Comment inviter un confrère ?
              </h3>
              <ol className="space-y-3">
                {[
                  { n: 1, title: 'Ouvrez le dossier d\'un enfant', desc: 'Depuis vos rendez-vous ou vos bénéficiaires, sélectionnez l\'enfant concerné.' },
                  { n: 2, title: 'Cliquez sur « Inviter un confrère »', desc: 'Saisissez l\'email du professionnel, choisissez les permissions (consultation ou édition) et ajoutez un message.' },
                  { n: 3, title: 'Le confrère reçoit une invitation', desc: 'Il accepte ou refuse depuis son propre espace. La famille est notifiée et peut révoquer l\'accès à tout moment.' },
                ].map((step) => (
                  <li key={step.n} className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#41005c' }}>
                      {step.n}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                <Link
                  href="/dashboard/educator/appointments"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#41005c' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Voir mes rendez-vous
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Invitations reçues en attente — section visuellement distincte */}
            {pendingReceived.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Invitations reçues <span className="text-gray-400 font-medium">({pendingReceived.length})</span>
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    À traiter
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingReceived.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl p-4 sm:p-5 border-2" style={{ borderColor: '#fde68a' }}>
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold flex-shrink-0" style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}>
                          {initial(c.inviter)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base text-gray-700">
                            <strong>{fullName(c.inviter)}</strong> vous invite à{' '}
                            <strong>{c.permission === 'write' ? 'consulter et modifier' : 'consulter'}</strong>{' '}
                            le PPA de <strong>{c.child?.first_name || 'l\'enfant'}</strong>.
                          </p>
                          {c.message && (
                            <p className="mt-2 text-sm text-gray-600 italic bg-gray-50 rounded-lg p-3 border border-gray-100">
                              « {c.message} »
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">{formatRelative(c.invited_at)}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              disabled={busyId === c.id}
                              onClick={() => act(c.id, 'accept')}
                              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: '#41005c' }}
                            >
                              Accepter
                            </button>
                            <button
                              disabled={busyId === c.id}
                              onClick={() => act(c.id, 'decline')}
                              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Collaborations actives */}
            {acceptedReceived.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
                  Collaborations actives <span className="text-gray-400 font-medium">({acceptedReceived.length})</span>
                </h2>
                <div className="space-y-3">
                  {acceptedReceived.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                            {initial(c.inviter)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-700">
                              Suivi de <strong>{c.child?.first_name || 'l\'enfant'}</strong>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Invité(e) par <strong>{fullName(c.inviter)}</strong> · {c.permission === 'write' ? 'lecture + écriture' : 'lecture seule'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-shrink-0">
                          <StatusBadge status={c.status} />
                          <button
                            disabled={busyId === c.id}
                            onClick={() => act(c.id, 'leave')}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors"
                          >
                            Quitter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Invitations envoyées */}
            {sent.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
                  Invitations envoyées <span className="text-gray-400 font-medium">({sent.length})</span>
                </h2>
                <div className="space-y-3">
                  {sent.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0" style={{ backgroundColor: '#fce7f3', color: '#be185d' }}>
                            {initial(c.invitee)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-gray-700">
                              <strong>{fullName(c.invitee)}</strong> · {c.child?.first_name || 'l\'enfant'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {c.permission === 'write' ? 'lecture + écriture' : 'lecture seule'} · envoyée {formatRelative(c.invited_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-shrink-0">
                          <StatusBadge status={c.status} />
                          {(c.status === 'pending' || c.status === 'accepted') && (
                            <button
                              disabled={busyId === c.id}
                              onClick={() => act(c.id, 'revoke')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 bg-white disabled:opacity-50 hover:bg-red-50 transition-colors"
                            >
                              Révoquer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
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
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${m.cls}`}>{m.label}</span>;
}
