'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import EducatorNavbar from '@/components/EducatorNavbar';

interface SettingsState {
  connected: boolean;
  google_email?: string | null;
  sync_enabled?: boolean;
  sync_appointments_to_calendar?: boolean;
  block_from_calendar?: boolean;
  last_sync_at?: string | null;
  last_error?: string | null;
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

export default function IntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
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

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      const { data: profileData } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      setProfile(profileData);

      try {
        const res = await fetch('/api/auth/google/settings');
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

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
              <img src="/images/icons/integrations.svg" alt="" className="w-full h-full" />
            </div>
            <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">Mes intégrations</h1>
            <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm mt-1">Connectez vos outils externes (Google Calendar, etc.)</p>
          </div>
        </div>

        {banner && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${banner.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {banner.message}
          </div>
        )}

        <div className="space-y-4 sm:space-y-5">
          {/* Google Calendar card */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border border-gray-100">
                {/* Logo Google officiel */}
                <svg className="w-7 h-7" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Google Calendar</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Synchronisez vos RDV NeuroCare avec votre Google Calendar.
                </p>
              </div>
              {!loading && state?.connected && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[11px] font-semibold flex-shrink-0">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Connecté
                </span>
              )}
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
                  Connecter mon compte Google
                </a>
                <p className="text-xs text-gray-400 mt-3 max-w-prose">
                  Lors de la première connexion, Google peut afficher un avertissement « Application non vérifiée » — c&apos;est normal pendant la phase de validation. Cliquez sur « Paramètres avancés » → « Continuer ».
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="min-w-0">
                    <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Compte connecté</p>
                    <p className="text-sm text-green-900 font-medium truncate">{state.google_email}</p>
                    {state.last_sync_at && (
                      <p className="text-xs text-green-700 mt-0.5">
                        Dernière synchro : {formatRelative(state.last_sync_at)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleDisconnect}
                    disabled={saving === 'disconnect'}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 border border-red-200 bg-white disabled:opacity-50 hover:bg-red-50 transition-colors"
                  >
                    {saving === 'disconnect' ? 'Déconnexion…' : 'Déconnecter'}
                  </button>
                </div>

                {state.last_error && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Dernière erreur</p>
                    <p className="text-sm text-red-800 mt-0.5">{state.last_error}</p>
                  </div>
                )}

                <div className="space-y-4 pt-2">
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
              </div>
            )}
          </section>

          {/* Bientôt disponible — placeholders */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Bientôt disponible</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { name: 'Outlook Calendar', desc: 'Synchronisation avec Microsoft 365' },
                { name: 'Apple iCal', desc: 'Synchronisation avec Calendrier macOS / iOS' },
              ].map((it) => (
                <div key={it.name} className="bg-white/60 rounded-2xl border border-dashed border-gray-200 p-4 sm:p-5 opacity-70">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-700">{it.name}</p>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold uppercase tracking-wide">Bientôt</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{it.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
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
        aria-label={label}
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
