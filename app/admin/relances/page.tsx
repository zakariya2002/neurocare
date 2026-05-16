'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, StatCard } from '@/components/admin/ui';

interface Educator {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  verification_status: string | null;
  documents_count: number;
  days_since_signup: number;
  last_relance_at: string | null;
  last_relance_template: string | null;
  total_relances: number;
  suggested_template: 'j1' | 'j3' | 'j7';
}

interface Stats {
  total: number;
  relancesToday: number;
  relancesThisWeek: number;
  neverRelanced: number;
}

type Filter = 'all' | 'never' | 'stale';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'never', label: 'Jamais relancés' },
  { value: 'stale', label: 'Relancés il y a +3j' },
];

const templateLabels: Record<string, { label: string; variant: 'info' | 'warning' | 'danger' }> = {
  j1: { label: 'J+1 Bienvenue', variant: 'info' },
  j3: { label: 'J+3 Rappel', variant: 'warning' },
  j7: { label: 'J+7 Dernier rappel', variant: 'danger' },
};

export default function AdminRelances() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [educators, setEducators] = useState<Educator[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, relancesToday: 0, relancesThisWeek: 0, neverRelanced: 0 });
  const [filter, setFilter] = useState<Filter>('all');
  const [sending, setSending] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<'j1' | 'j3' | 'j7' | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Educator | null>(null);

  const checkAccess = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push('/auth/login'); return; }
    await loadData();
    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/relances');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur chargement');
      setEducators(data.educators);
      setStats(data.stats);
    } catch (error) {
      console.error('Erreur:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erreur lors du chargement des données');
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const sendRelance = async (educatorId: string, template: 'j1' | 'j3' | 'j7') => {
    setSending(educatorId);
    try {
      const res = await fetch('/api/admin/relances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ educatorId, template }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(data.message);
        await loadData();
      } else {
        showError(data.message || 'Erreur lors de l\'envoi');
      }
    } catch {
      showError('Erreur réseau');
    }
    setSending(null);
  };

  const sendBulkRelances = async () => {
    const neverRelanced = educators.filter((e) => e.total_relances === 0);
    if (neverRelanced.length === 0) {
      showError('Aucun éducateur à relancer');
      return;
    }

    setBulkSending(true);
    let sent = 0;
    let failed = 0;

    for (const edu of neverRelanced) {
      try {
        const res = await fetch('/api/admin/relances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ educatorId: edu.id, template: edu.suggested_template }),
        });
        const data = await res.json();
        if (res.ok && data.success) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setBulkSending(false);
    await loadData();
    if (failed === 0) {
      showSuccess(`${sent} relance${sent > 1 ? 's' : ''} envoyée${sent > 1 ? 's' : ''} avec succès`);
    } else {
      showError(`${sent} envoyée${sent > 1 ? 's' : ''}, ${failed} échouée${failed > 1 ? 's' : ''}`);
    }
  };

  // Apply client-side filter
  const filteredEducators = educators.filter((e) => {
    if (filter === 'never') return e.total_relances === 0;
    if (filter === 'stale') {
      if (!e.last_relance_at) return false;
      const daysSinceRelance = Math.floor(
        (Date.now() - new Date(e.last_relance_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceRelance >= 3;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-admin-muted-dark">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark">
          Relances documents
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
          Relancer les professionnels qui n&apos;ont pas encore soumis leurs documents
        </p>
      </div>

      {/* Toast notifications */}
      {successMessage && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 p-4">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">{errorMessage}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pros sans documents"
          value={stats.total}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Relancés aujourd'hui"
          value={stats.relancesToday}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Relancés cette semaine"
          value={stats.relancesThisWeek}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Jamais relancés"
          value={stats.neverRelanced}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
      </div>

      {/* Filters + bulk action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 dark:bg-admin-surface-dark-2 rounded-lg p-1">
          {filters.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-white dark:bg-admin-surface-dark text-gray-900 dark:text-admin-text-dark shadow-sm'
                  : 'text-gray-500 dark:text-admin-muted-dark hover:text-gray-700 dark:hover:text-admin-text-dark'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button
          variant="primary"
          loading={bulkSending}
          disabled={stats.neverRelanced === 0}
          onClick={sendBulkRelances}
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        >
          Relancer tous les non-relancés ({stats.neverRelanced})
        </Button>
      </div>

      {/* Template legend — clickable to preview */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-4 px-2">
          <span className="text-xs font-medium text-gray-500 dark:text-admin-muted-dark uppercase tracking-wide">
            Templates :
          </span>
          {Object.entries(templateLabels).map(([key, { label, variant }]) => (
            <button key={key} onClick={() => setPreviewTemplate(key as 'j1' | 'j3' | 'j7')}>
              <Badge variant={variant}>{label}</Badge>
            </button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-admin-border-dark bg-gray-50 dark:bg-admin-surface-dark-2">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Professionnel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden md:table-cell">Inscription</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Docs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden lg:table-cell">Dernière relance</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden md:table-cell">Template</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-admin-border-dark">
              {filteredEducators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 dark:text-admin-muted-dark">
                    Aucun professionnel à relancer
                  </td>
                </tr>
              ) : (
                filteredEducators.map((edu) => {
                  const tpl = templateLabels[edu.suggested_template];
                  return (
                    <tr key={edu.id} className="hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2 transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {edu.first_name?.[0]}{edu.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-admin-text-dark">
                              {edu.first_name} {edu.last_name}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-admin-muted-dark">
                              J+{edu.days_since_signup}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-600 dark:text-admin-muted-dark">{edu.email}</span>
                      </td>

                      {/* Inscription date */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-500 dark:text-admin-muted-dark">
                          {new Date(edu.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Documents count */}
                      <td className="px-4 py-3 text-center">
                        <Badge variant={edu.documents_count === 0 ? 'danger' : edu.documents_count < 4 ? 'warning' : 'success'}>
                          {edu.documents_count}/4
                        </Badge>
                      </td>

                      {/* Last relance */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {edu.last_relance_at ? (
                          <div>
                            <span className="text-sm text-gray-500 dark:text-admin-muted-dark">
                              {new Date(edu.last_relance_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-admin-muted-dark ml-1">
                              ({edu.total_relances}x)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-admin-muted-dark italic">Jamais</span>
                        )}
                      </td>

                      {/* Suggested template */}
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        {tpl && <Badge variant={tpl.variant}>{tpl.label}</Badge>}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={sending === edu.id}
                          onClick={() => setConfirmTarget(edu)}
                          leftIcon={
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          }
                        >
                          Relancer
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Template preview modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
      {/* Per-user confirm-by-preview modal */}
      {confirmTarget && (
        <RelanceConfirmModal
          educator={confirmTarget}
          sending={sending === confirmTarget.id}
          onClose={() => setConfirmTarget(null)}
          onConfirm={async () => {
            const target = confirmTarget;
            await sendRelance(target.id, target.suggested_template);
            setConfirmTarget(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Template Preview Modal ───────────────────────────────────────────────

function RelanceConfirmModal({
  educator,
  sending,
  onClose,
  onConfirm,
}: {
  educator: Educator;
  sending: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const template = educator.suggested_template;
  const [html, setHtml] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>('');
  const [to, setTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/relances/preview?template=${template}&educatorId=${encodeURIComponent(educator.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setHtml(data.html || null);
        setSubject(data.subject || '');
        setTo(data.to || null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [educator.id, template]);

  const tplLabel: Record<string, string> = {
    j1: 'J+1 — Bienvenue',
    j3: 'J+3 — Rappel',
    j7: 'J+7 — Dernier rappel',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-admin-surface-dark border border-gray-200 dark:border-admin-border-dark rounded-xl shadow-sm max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-admin-border-dark flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark">
              Aperçu avant envoi — {tplLabel[template]}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-admin-muted-dark">
              {educator.first_name} {educator.last_name}
              {to ? ` · ${to}` : educator.email ? ` · ${educator.email}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-admin-surface-dark-2 text-gray-500"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Subject line */}
        {subject && (
          <div className="px-5 py-2 border-b border-gray-200 dark:border-admin-border-dark flex-shrink-0 bg-gray-50 dark:bg-admin-surface-dark-2">
            <p className="text-xs text-gray-500 dark:text-admin-muted-dark">
              <span className="font-semibold">Objet : </span>
              <span className="text-gray-700 dark:text-admin-text-dark">{subject}</span>
            </p>
          </div>
        )}
        {/* Body */}
        <div className="overflow-y-auto flex-1 min-h-0 p-1 bg-gray-100 dark:bg-admin-surface-dark-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600" />
            </div>
          ) : html ? (
            <iframe
              srcDoc={html}
              className="w-full h-[600px] bg-white rounded"
              title="Apercu mail"
              sandbox=""
            />
          ) : (
            <p className="text-center py-10 text-gray-500">Impossible de charger l&apos;aperçu</p>
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 dark:border-admin-border-dark flex-shrink-0">
          <p className="text-xs text-gray-400 dark:text-admin-muted-dark">
            Le mail partira immédiatement à <span className="font-medium text-gray-600 dark:text-admin-text-dark">{to || educator.email || '—'}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={sending}>Annuler</Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              loading={sending}
              disabled={loading || !html}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            >
              Envoyer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatePreviewModal({ template, onClose }: { template: 'j1' | 'j3' | 'j7'; onClose: () => void }) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/relances/preview?template=${template}`)
      .then(res => res.json())
      .then(data => { setHtml(data.html || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [template]);

  const titles: Record<string, string> = {
    j1: 'J+1 — Bienvenue',
    j3: 'J+3 — Rappel',
    j7: 'J+7 — Dernier rappel',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-admin-surface-dark border border-gray-200 dark:border-admin-border-dark rounded-xl shadow-sm max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-admin-border-dark flex-shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark">
            {titles[template]}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-admin-surface-dark-2 text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 min-h-0 p-1 bg-gray-100 dark:bg-admin-surface-dark-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600" />
            </div>
          ) : html ? (
            <iframe
              srcDoc={html}
              className="w-full h-[600px] bg-white rounded"
              title="Apercu template"
              sandbox=""
            />
          ) : (
            <p className="text-center py-10 text-gray-500">Impossible de charger le template</p>
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-gray-200 dark:border-admin-border-dark flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}
