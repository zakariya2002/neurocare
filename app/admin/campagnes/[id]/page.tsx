'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, StatCard } from '@/components/admin/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type CampagneStatus = 'draft' | 'sending' | 'sent';
type CampagneSegment = 'finess' | 'anfe' | 'sirene';
type ContactStatus = 'pending' | 'sent' | 'failed';

interface Campagne {
  id: string;
  name: string;
  segment: CampagneSegment;
  subject: string;
  html_body: string;
  status: CampagneStatus;
  total_contacts: number;
  sent_count: number;
  created_at: string;
  sent_at: string | null;
}

interface Contact {
  id: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
  metier: string | null;
  status: ContactStatus;
  sent_at: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const segmentLabels: Record<CampagneSegment, { label: string; variant: 'info' | 'warning' | 'purple' }> = {
  finess:  { label: 'FINESS',  variant: 'info' },
  anfe:    { label: 'ANFE',    variant: 'warning' },
  sirene:  { label: 'Sirène',  variant: 'purple' },
};

const statusConfig: Record<CampagneStatus, { label: string; variant: 'neutral' | 'warning' | 'success' }> = {
  draft:   { label: 'Brouillon', variant: 'neutral' },
  sending: { label: 'Envoi en cours…', variant: 'warning' },
  sent:    { label: 'Envoyée',   variant: 'success' },
};

const contactStatusConfig: Record<ContactStatus, { label: string; variant: 'neutral' | 'success' | 'danger' }> = {
  pending: { label: 'En attente', variant: 'neutral' },
  sent:    { label: 'Envoyé',     variant: 'success' },
  failed:  { label: 'Échec',      variant: 'danger' },
};

// ─── Import modal ─────────────────────────────────────────────────────────────

interface ImportModalProps {
  campagneId: string;
  onClose: () => void;
  onImported: (count: number) => void;
}

function ImportModal({ campagneId, onClose, onImported }: ImportModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);
    let contacts: unknown;
    try {
      contacts = JSON.parse(jsonText);
    } catch {
      setError('JSON invalide');
      return;
    }
    if (!Array.isArray(contacts)) {
      setError('Le JSON doit être un tableau d\'objets');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campagnes/${campagneId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur import');
      onImported(data.count as number);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-admin-surface-dark border border-gray-200 dark:border-admin-border-dark rounded-xl shadow-sm max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-admin-border-dark flex-shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark">
            Importer des contacts
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

        <div className="overflow-y-auto flex-1 min-h-0 p-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-admin-text-dark mb-1">
              JSON des contacts
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={14}
              placeholder={`[\n  {\n    "email": "contact@structure.fr",\n    "nom": "Dupont",\n    "prenom": "Marie",\n    "raison_sociale": "SESSAD Lyon Est"\n  }\n]`}
              className="w-full pl-3 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-admin-surface-dark text-gray-900 dark:text-admin-text-dark placeholder-gray-400 dark:placeholder-admin-muted-dark border-gray-300 dark:border-admin-border-dark focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-admin-muted-dark">
              Format : tableau JSON avec les champs <code className="bg-gray-100 dark:bg-admin-surface-dark-2 px-1 rounded">email</code>, <code className="bg-gray-100 dark:bg-admin-surface-dark-2 px-1 rounded">nom</code>, <code className="bg-gray-100 dark:bg-admin-surface-dark-2 px-1 rounded">prenom</code>, <code className="bg-gray-100 dark:bg-admin-surface-dark-2 px-1 rounded">raison_sociale</code>.
              Les doublons (même email) sont ignorés.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 dark:border-admin-border-dark flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="primary" loading={loading} onClick={handleImport}>
            Importer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampagneDetail() {
  const router   = useRouter();
  const params   = useParams();
  const id       = params.id as string;

  const [loading, setLoading]           = useState(true);
  const [campagne, setCampagne]         = useState<Campagne | null>(null);
  const [contacts, setContacts]         = useState<Contact[]>([]);
  const [previewHtml, setPreviewHtml]   = useState<string | null>(null);
  const [showImport, setShowImport]     = useState(false);
  const [sending, setSending]           = useState(false);
  const [sendProgress, setSendProgress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage]     = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/campagnes?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur chargement');
      setCampagne(data.campagne);
      setContacts(data.contacts || []);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    }
  }, [id]);

  const checkAccess = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push('/auth/login'); return; }
    await loadData();
    setLoading(false);
  }, [router, loadData]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Compute preview HTML: replace {{unsubscribe_url}} with a static placeholder
  useEffect(() => {
    if (campagne?.html_body) {
      setPreviewHtml(
        campagne.html_body.replace(
          /\{\{unsubscribe_url\}\}/g,
          'mailto:unsubscribe@neuro-care.fr?subject=Désabonnement'
        )
      );
    }
  }, [campagne?.html_body]);

  const handleSend = async () => {
    if (!campagne) return;
    if (!confirm(`Envoyer la campagne « ${campagne.name} » à ${campagne.total_contacts} contact(s) ?`)) return;

    setSending(true);
    setSendProgress('Initialisation de l\'envoi…');
    try {
      const res = await fetch(`/api/admin/campagnes/${id}/send`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur envoi');
      showSuccess(`Campagne envoyée : ${data.sent} envoyé(s), ${data.failed} échec(s)`);
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
      setSendProgress(null);
    }
  };

  const handleImported = async (count: number) => {
    setShowImport(false);
    showSuccess(`${count} contact(s) importé(s)`);
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-200 border-t-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-admin-muted-dark">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!campagne) {
    return (
      <div className="space-y-4">
        <Link href="/admin/campagnes">
          <Button variant="secondary" size="sm" leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          }>Retour</Button>
        </Link>
        <p className="text-gray-500 dark:text-admin-muted-dark">Campagne introuvable.</p>
      </div>
    );
  }

  const seg       = segmentLabels[campagne.segment];
  const statusCfg = statusConfig[campagne.status];
  const canSend   = campagne.status === 'draft' && campagne.total_contacts > 0;

  const sentCount   = contacts.filter((c) => c.status === 'sent').length;
  const failedCount = contacts.filter((c) => c.status === 'failed').length;
  const pendingCount = contacts.filter((c) => c.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/campagnes">
            <Button variant="secondary" size="sm" leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }>Retour</Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark">
                {campagne.name}
              </h1>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              <Badge variant={seg.variant}>{seg.label}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-admin-muted-dark">
              Créée le {new Date(campagne.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {campagne.sent_at && (
                <> · Envoyée le {new Date(campagne.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowImport(true)}
            disabled={campagne.status === 'sent'}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            }
          >
            Importer contacts
          </Button>
          <Button
            variant="success"
            size="sm"
            loading={sending}
            disabled={!canSend || sending}
            onClick={handleSend}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            }
          >
            {campagne.status === 'sent' ? 'Déjà envoyée' : `Envoyer (${campagne.total_contacts})`}
          </Button>
        </div>
      </div>

      {/* Toasts */}
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
      {sending && sendProgress && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-300 border-t-blue-600 flex-shrink-0" />
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{sendProgress}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total contacts"   value={campagne.total_contacts} />
        <StatCard label="Envoyés"          value={sentCount} />
        <StatCard label="En attente"       value={pendingCount} />
        <StatCard label="Échecs"           value={failedCount} />
      </div>

      {/* Template preview + contact list side by side on wide screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Template preview */}
        <Card
          title="Aperçu du template"
          padding="none"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        >
          <div className="p-1 bg-gray-100 dark:bg-admin-surface-dark-2">
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[480px] bg-white rounded"
                title="Aperçu template campagne"
                sandbox=""
              />
            ) : (
              <div className="flex items-center justify-center h-[480px] text-gray-400 dark:text-admin-muted-dark text-sm">
                Aucun template défini
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 dark:border-admin-border-dark">
            <p className="text-xs text-gray-500 dark:text-admin-muted-dark">
              <span className="font-medium">Objet :</span> {campagne.subject}
            </p>
          </div>
        </Card>

        {/* Contacts list */}
        <Card
          title={`Contacts (${contacts.length})`}
          padding="none"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        >
          <div className="overflow-y-auto max-h-[540px]">
            {contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-admin-muted-dark gap-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm">Aucun contact importé</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImport(true)}
                  disabled={campagne.status === 'sent'}
                >
                  Importer des contacts
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-admin-border-dark bg-gray-50 dark:bg-admin-surface-dark-2">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Contact</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden sm:table-cell">Structure</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-admin-border-dark">
                  {contacts.map((contact) => {
                    const cs = contactStatusConfig[contact.status];
                    return (
                      <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2">
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-medium text-gray-900 dark:text-admin-text-dark">
                            {[contact.prenom, contact.nom].filter(Boolean).join(' ') || '—'}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-admin-muted-dark">{contact.email}</p>
                        </td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <span className="text-xs text-gray-500 dark:text-admin-muted-dark">
                            {contact.raison_sociale || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          {contact.metier ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                              {contact.metier}
                            </span>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge variant={cs.variant}>{cs.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Import modal */}
      {showImport && (
        <ImportModal
          campagneId={id}
          onClose={() => setShowImport(false)}
          onImported={handleImported}
        />
      )}
    </div>
  );
}
