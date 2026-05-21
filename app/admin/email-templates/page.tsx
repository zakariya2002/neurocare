'use client';

import { useEffect, useState } from 'react';

type TemplateKey =
  | 'thank-you-pro'
  | 'thank-you-family'
  | 'welcome-pro'
  | 'welcome-family'
  | 'password-reset';

interface TemplateEntry {
  key: TemplateKey;
  label: string;
  description: string;
  trigger: string;
}

const TEMPLATES: TemplateEntry[] = [
  {
    key: 'thank-you-pro',
    label: 'Remerciement — Professionnel',
    description: 'Mission NeuroCare, feature annonces, campagne à venir.',
    trigger: 'Envoyé automatiquement après l’email de bienvenue lors de l’inscription d’un pro.',
  },
  {
    key: 'thank-you-family',
    label: 'Remerciement — Famille',
    description: 'Mission NeuroCare + invitation à publier une annonce.',
    trigger: 'Envoyé automatiquement après l’email de bienvenue lors de l’inscription d’une famille.',
  },
  {
    key: 'welcome-pro',
    label: 'Bienvenue — Professionnel',
    description: 'Email d’activation avec lien de confirmation et prochaines étapes.',
    trigger: 'Envoyé à l’inscription d’un pro (avec lien de confirmation email).',
  },
  {
    key: 'welcome-family',
    label: 'Bienvenue — Famille',
    description: 'Email d’activation avec lien de confirmation.',
    trigger: 'Envoyé à l’inscription d’une famille (avec lien de confirmation email).',
  },
  {
    key: 'password-reset',
    label: 'Réinitialisation mot de passe',
    description: 'Lien de reset envoyé sur demande.',
    trigger: 'Envoyé quand un utilisateur clique sur « Mot de passe oublié ».',
  },
];

export default function EmailTemplatesAdminPage() {
  const [selected, setSelected] = useState<TemplateKey>('thank-you-pro');
  const [firstName, setFirstName] = useState('Marie');
  const [html, setHtml] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/email-templates/preview?template=${selected}&firstName=${encodeURIComponent(firstName || 'Prénom')}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setHtml(data.html || null);
        setSubject(data.subject || '');
      })
      .catch(() => {
        if (cancelled) return;
        setHtml(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, firstName]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark">
          Templates emails
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
          Aperçu des emails envoyés automatiquement par la plateforme.
        </p>
      </div>

      {/* Layout 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Liste des templates */}
        <div className="space-y-2">
          <div className="bg-white dark:bg-admin-surface-dark rounded-xl border border-gray-200 dark:border-admin-border-dark p-3">
            <label
              htmlFor="firstName"
              className="block text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase tracking-wide mb-2"
            >
              Prénom dans l’aperçu
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-admin-border-dark bg-gray-50 dark:bg-admin-surface-dark-2 text-gray-900 dark:text-admin-text-dark focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              placeholder="Marie"
            />
          </div>

          {TEMPLATES.map((t) => {
            const active = selected === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelected(t.key)}
                className={`w-full text-left rounded-xl border p-3 transition-colors ${
                  active
                    ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-300 dark:border-primary-700'
                    : 'bg-white dark:bg-admin-surface-dark border-gray-200 dark:border-admin-border-dark hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2'
                }`}
              >
                <p className={`font-semibold text-sm ${active ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-admin-text-dark'}`}>
                  {t.label}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-admin-muted-dark leading-snug">
                  {t.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Aperçu */}
        <div className="bg-white dark:bg-admin-surface-dark rounded-xl border border-gray-200 dark:border-admin-border-dark overflow-hidden flex flex-col">
          {/* Subject + déclencheur */}
          <div className="px-5 py-3 border-b border-gray-200 dark:border-admin-border-dark bg-gray-50 dark:bg-admin-surface-dark-2 space-y-1">
            <p className="text-xs text-gray-500 dark:text-admin-muted-dark">
              <span className="font-semibold">Objet : </span>
              <span className="text-gray-800 dark:text-admin-text-dark">{subject || '—'}</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-admin-muted-dark">
              {TEMPLATES.find((t) => t.key === selected)?.trigger}
            </p>
          </div>

          {/* Iframe preview */}
          <div className="flex-1 min-h-[600px] bg-gray-100 dark:bg-admin-surface-dark-2 p-2">
            {loading ? (
              <div className="flex items-center justify-center h-[600px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600" />
              </div>
            ) : html ? (
              <iframe
                key={selected + firstName}
                srcDoc={html}
                className="w-full h-[700px] bg-white rounded"
                title={`Aperçu ${selected}`}
                sandbox=""
              />
            ) : (
              <p className="text-center py-10 text-gray-500">Impossible de charger l’aperçu</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
