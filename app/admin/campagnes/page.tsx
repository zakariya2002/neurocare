'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, StatCard } from '@/components/admin/ui';
import { Input } from '@/components/admin/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type CampagneStatus = 'draft' | 'sending' | 'sent';
type CampagneSegment = 'finess' | 'anfe' | 'sirene';

interface Campagne {
  id: string;
  name: string;
  segment: CampagneSegment;
  subject: string;
  status: CampagneStatus;
  total_contacts: number;
  sent_count: number;
  created_at: string;
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
  sending: { label: 'Envoi…',    variant: 'warning' },
  sent:    { label: 'Envoyée',   variant: 'success' },
};

// ─── Create modal ─────────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreate: (c: Campagne) => void;
}

function parseCsv(text: string): { email: string; nom: string; prenom: string; raison_sociale: string }[] {
  const lines = text.split('\n').map(l => l.replace(/^﻿/, '').trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(';').map(h => h.toLowerCase().trim());
  const idx = {
    nom:     headers.findIndex(h => h === 'nom'),
    prenom:  headers.findIndex(h => h.includes('pr')),
    email:   headers.findIndex(h => h === 'email'),
    societe: headers.findIndex(h => h === 'entreprise' || h === 'raison_sociale'),
  };
  return lines.slice(1).flatMap(line => {
    const cols = line.split(';');
    const email = cols[idx.email]?.trim();
    if (!email || !email.includes('@')) return [];
    return [{
      email,
      nom:            cols[idx.nom]?.trim()     || '',
      prenom:         cols[idx.prenom]?.trim()  || '',
      raison_sociale: cols[idx.societe]?.trim() || '',
    }];
  });
}

function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const [name, setName]         = useState('');
  const [segment, setSegment]   = useState<CampagneSegment>('finess');
  const [subject, setSubject]   = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [csvFile, setCsvFile]   = useState<File | null>(null);
  const [csvCount, setCsvCount] = useState<number | null>(null);
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCsvFile(file);
    setCsvCount(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const contacts = parseCsv(ev.target?.result as string);
      setCsvCount(contacts.length);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !htmlBody.trim()) {
      setError('Tous les champs sont requis');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Create campaign
      setStatus('Création de la campagne…');
      const res = await fetch('/api/admin/campagnes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), segment, subject: subject.trim(), html_body: htmlBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création');
      const campagne = data.campagne as Campagne;

      // 2. Import CSV if provided
      if (csvFile) {
        setStatus('Import des contacts CSV…');
        const text = await csvFile.text();
        const contacts = parseCsv(text);
        if (contacts.length > 0) {
          const imp = await fetch(`/api/admin/campagnes/${campagne.id}/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacts }),
          });
          if (!imp.ok) {
            const impData = await imp.json();
            throw new Error(impData.error || 'Erreur import CSV');
          }
        }
      }

      onCreate(campagne);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
      setStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-admin-surface-dark border border-gray-200 dark:border-admin-border-dark rounded-xl shadow-sm max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-admin-border-dark flex-shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark">
            Nouvelle campagne
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 min-h-0 p-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <Input
            label="Nom de la campagne"
            placeholder="Ex: Outreach ANFE Mai 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-admin-text-dark mb-1">
              Segment
            </label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value as CampagneSegment)}
              className="w-full pl-3 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-admin-surface-dark text-gray-900 dark:text-admin-text-dark border-gray-300 dark:border-admin-border-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="finess">FINESS — Structures médico-sociales</option>
              <option value="anfe">ANFE — Ergothérapeutes</option>
              <option value="sirene">Sirène — Paramédicaux libéraux</option>
            </select>
          </div>

          <Input
            label="Objet de l'email"
            placeholder="Ex: Découvrez NeuroCare pour votre structure"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-admin-text-dark mb-1">
              Corps HTML
            </label>
            <textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={10}
              placeholder="<html>...</html>"
              className="w-full pl-3 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-admin-surface-dark text-gray-900 dark:text-admin-text-dark placeholder-gray-400 dark:placeholder-admin-muted-dark border-gray-300 dark:border-admin-border-dark focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-admin-muted-dark">
              Utilisez <code className="bg-gray-100 dark:bg-admin-surface-dark-2 px-1 rounded">{'{{unsubscribe_url}}'}</code> pour insérer le lien de désinscription.
            </p>
          </div>

          {/* CSV upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-admin-text-dark mb-1">
              Importer les contacts <span className="text-gray-400 font-normal">(CSV optionnel)</span>
            </label>
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-admin-border-dark cursor-pointer hover:border-primary-400 transition-colors">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-admin-muted-dark">
                {csvFile
                  ? <><strong className="text-gray-800 dark:text-admin-text-dark">{csvFile.name}</strong>{csvCount !== null && <span className="ml-2 text-primary-600">— {csvCount} contacts valides</span>}</>
                  : 'Choisir un fichier CSV (séparateur ;)'}
              </span>
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleCsvChange} />
            </label>
            <p className="mt-1 text-xs text-gray-400">Colonnes attendues : Nom ; Prénom ; Email ; Entreprise</p>
          </div>

          {status && (
            <div className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-400">
              <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              {status}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 dark:border-admin-border-dark flex-shrink-0">
          <Button variant="secondary" onClick={onClose} type="button">Annuler</Button>
          <Button
            variant="primary"
            loading={loading}
            onClick={(e) => {
              e.preventDefault();
              const form = e.currentTarget.closest('div')?.parentElement?.querySelector('form') as HTMLFormElement | null;
              form?.requestSubmit();
            }}
          >
            {csvFile ? 'Créer & importer' : 'Créer la campagne'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCampagnes() {
  const router = useRouter();
  const [loading, setLoading]           = useState(true);
  const [campagnes, setCampagnes]       = useState<Campagne[]>([]);
  const [showCreate, setShowCreate]     = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage]     = useState<string | null>(null);

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

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/campagnes');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur chargement');
      setCampagnes(data.campagnes);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    }
  }, []);

  const checkAccess = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push('/auth/login'); return; }
    await loadData();
    setLoading(false);
  }, [router, loadData]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const handleCreated = (campagne: Campagne) => {
    setShowCreate(false);
    setCampagnes((prev) => [campagne, ...prev]);
    showSuccess(`Campagne « ${campagne.name} » créée`);
  };

  // Derived stats
  const totalContacts = campagnes.reduce((s, c) => s + c.total_contacts, 0);
  const totalSent     = campagnes.filter((c) => c.status === 'sent').length;
  const totalDraft    = campagnes.filter((c) => c.status === 'draft').length;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark">
            Campagnes email
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
            Gérez les campagnes de cold outreach vers les structures et professionnels de santé
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreate(true)}
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Nouvelle campagne
        </Button>
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total campagnes"
          value={campagnes.length}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          }
        />
        <StatCard
          label="Envoyées"
          value={totalSent}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="Brouillons"
          value={totalDraft}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <StatCard
          label="Contacts totaux"
          value={totalContacts.toLocaleString('fr-FR')}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-admin-border-dark">
          <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark">
            Toutes les campagnes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-admin-border-dark bg-gray-50 dark:bg-admin-surface-dark-2">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Campagne</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden sm:table-cell">Segment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden md:table-cell">Statut</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden lg:table-cell">Contacts</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden lg:table-cell">Date envoi</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-admin-border-dark">
              {campagnes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 dark:text-admin-muted-dark">
                    Aucune campagne — créez-en une pour commencer
                  </td>
                </tr>
              ) : (
                campagnes.map((c) => {
                  const seg    = segmentLabels[c.segment];
                  const status = statusConfig[c.status];
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2 transition-colors">
                      {/* Name + subject */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-admin-text-dark">{c.name}</p>
                        <p className="text-xs text-gray-400 dark:text-admin-muted-dark truncate max-w-xs">{c.subject}</p>
                      </td>

                      {/* Segment */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={seg.variant}>{seg.label}</Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>

                      {/* Contact count */}
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {c.total_contacts > 0 ? (
                          <span className="text-sm text-gray-600 dark:text-admin-muted-dark">
                            {c.sent_count}/{c.total_contacts}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-admin-muted-dark italic">—</span>
                        )}
                      </td>

                      {/* Sent date */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {c.sent_at ? (
                          <span className="text-sm text-gray-500 dark:text-admin-muted-dark">
                            {new Date(c.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-admin-muted-dark italic">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/campagnes/${c.id}`}>
                          <Button variant="secondary" size="sm">
                            Voir
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create modal */}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreated} />
      )}
    </div>
  );
}
