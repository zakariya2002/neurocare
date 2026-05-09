'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface SettingsState {
  connected: boolean;
  google_email?: string | null;
  sync_enabled?: boolean;
  sync_appointments_to_calendar?: boolean;
  block_from_calendar?: boolean;
  last_sync_at?: string | null;
  last_error?: string | null;
}

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const connected = searchParams?.get('connected');
    const error = searchParams?.get('error');
    if (connected) setBanner({ type: 'success', message: 'Google Calendar connecté avec succès.' });
    if (error) setBanner({ type: 'error', message: `Erreur lors de la connexion : ${error}` });
  }, [searchParams]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google/settings');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateToggle = async (key: 'sync_enabled' | 'sync_appointments_to_calendar' | 'block_from_calendar', value: boolean) => {
    setSaving(key);
    try {
      const res = await fetch('/api/auth/google/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        setState((s) => (s ? { ...s, [key]: value } : s));
      } else {
        setBanner({ type: 'error', message: 'Erreur lors de la mise à jour.' });
      }
    } finally {
      setSaving(null);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Voulez-vous vraiment déconnecter votre compte Google ? Vos RDV ne seront plus synchronisés.')) return;
    setSaving('disconnect');
    try {
      const res = await fetch('/api/auth/google/disconnect', { method: 'POST' });
      if (res.ok) {
        setState({ connected: false });
        setBanner({ type: 'success', message: 'Compte Google déconnecté.' });
      } else {
        setBanner({ type: 'error', message: 'Erreur lors de la déconnexion.' });
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf9f4]">
      {/* Header */}
      <div className="px-4 py-5 text-white" style={{ backgroundColor: '#41005c' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/educator" className="text-white/80 hover:text-white" aria-label="Retour">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-bold">Intégrations</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {banner && (
          <div className={`px-4 py-3 rounded-xl text-sm ${banner.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {banner.message}
          </div>
        )}

        {/* Google Calendar card */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f3e8ff' }}>
              <svg className="w-6 h-6" style={{ color: '#41005c' }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Google Calendar</h2>
              <p className="text-sm text-gray-500 mt-1">Synchronisez vos RDV NeuroCare avec votre Google Calendar.</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 h-20 bg-gray-100 rounded animate-pulse" />
          ) : !state?.connected ? (
            <div className="mt-6">
              <a
                href="/api/auth/google"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#41005c' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                Connecter mon Google Calendar
              </a>
              <p className="text-xs text-gray-400 mt-3">
                Lors de la première connexion, Google peut afficher un avertissement « Application non vérifiée » — c&apos;est normal pendant la phase de validation Google. Cliquez sur « Paramètres avancés » → « Continuer ».
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                <div>
                  <p className="text-sm font-semibold text-green-900">Connecté</p>
                  <p className="text-sm text-green-800">{state.google_email}</p>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={saving === 'disconnect'}
                  className="text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-50"
                >
                  Déconnecter
                </button>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <ToggleRow
                  label="Pousser mes RDV vers Google Calendar"
                  description="Chaque RDV accepté apparaîtra automatiquement dans votre agenda Google."
                  checked={!!state.sync_appointments_to_calendar}
                  disabled={saving === 'sync_appointments_to_calendar'}
                  onChange={(v) => updateToggle('sync_appointments_to_calendar', v)}
                />
                <ToggleRow
                  label="Bloquer ma disponibilité selon Google Calendar"
                  description="Les events bloqués (busy) sur votre Google Calendar empêcheront la prise de RDV NeuroCare."
                  checked={!!state.block_from_calendar}
                  disabled={saving === 'block_from_calendar'}
                  onChange={(v) => updateToggle('block_from_calendar', v)}
                />
                <ToggleRow
                  label="Synchronisation activée"
                  description="Désactivez temporairement toute synchronisation sans déconnecter votre compte."
                  checked={!!state.sync_enabled}
                  disabled={saving === 'sync_enabled'}
                  onChange={(v) => updateToggle('sync_enabled', v)}
                />
              </div>

              {(state.last_sync_at || state.last_error) && (
                <div className="text-xs text-gray-500 space-y-1 pt-3 border-t border-gray-100">
                  {state.last_sync_at && (
                    <p>Dernière synchronisation : <span className="font-medium text-gray-700">{new Date(state.last_sync_at).toLocaleString('fr-FR')}</span></p>
                  )}
                  {state.last_error && (
                    <p className="text-red-600">Dernière erreur : {state.last_error}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ToggleRow({ label, description, checked, disabled, onChange }: { label: string; description: string; checked: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${checked ? 'bg-[#41005c]' : 'bg-gray-300'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}
