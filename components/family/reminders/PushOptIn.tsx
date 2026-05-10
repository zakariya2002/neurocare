'use client';

import { useEffect, useState } from 'react';

type Status =
  | 'unsupported'        // navigateur sans support Push API
  | 'denied'             // permission refusée par l'utilisateur
  | 'not-configured'     // VAPID public key absente côté client
  | 'idle'               // support OK, pas encore abonné
  | 'subscribed'         // abonné
  | 'busy';              // chargement / appel API en cours

const SW_PATH = '/sw-push.js';

export default function PushOptIn() {
  const [status, setStatus] = useState<Status>('busy');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detect();
  }, []);

  async function detect() {
    if (typeof window === 'undefined') return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('unsupported');
      return;
    }
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setStatus('not-configured');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      const existing = reg ? await reg.pushManager.getSubscription() : null;
      setStatus(existing ? 'subscribed' : 'idle');
    } catch {
      setStatus('idle');
    }
  }

  async function handleEnable() {
    setError(null);
    setStatus('busy');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle');
        return;
      }

      const registration = await navigator.serviceWorker.register(SW_PATH);
      await navigator.serviceWorker.ready;

      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        setStatus('not-configured');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as unknown as BufferSource,
      });

      const json = subscription.toJSON();
      const res = await fetch('/api/family/push-subscriptions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          user_agent: navigator.userAgent,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Erreur enregistrement');
      }
      setStatus('subscribed');
    } catch (e: any) {
      setError(e?.message || 'Activation impossible');
      setStatus('idle');
    }
  }

  async function handleDisable() {
    setError(null);
    setStatus('busy');
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch(`/api/family/push-subscriptions?endpoint=${encodeURIComponent(sub.endpoint)}`, {
          method: 'DELETE',
        });
        await sub.unsubscribe();
      }
      setStatus('idle');
    } catch (e: any) {
      setError(e?.message || 'Désactivation impossible');
      setStatus('subscribed');
    }
  }

  if (status === 'unsupported' || status === 'not-configured') {
    // Discret : on n'affiche rien si le navigateur ne supporte pas
    // ou si la VAPID n'est pas configurée. L'email continue de fonctionner.
    return null;
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f4f4' }}>
          <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900">Notifications du navigateur</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            Recevez les rappels en plus de l’email, directement sur cet appareil. L’email reste
            envoyé dans tous les cas.
          </p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            {status === 'busy' && (
              <span className="text-xs text-gray-500">Chargement…</span>
            )}
            {status === 'idle' && (
              <button
                onClick={handleEnable}
                className="text-xs font-semibold px-3 py-1.5 rounded-md text-white transition hover:opacity-90"
                style={{ backgroundColor: '#027e7e' }}
              >
                Activer les notifications
              </button>
            )}
            {status === 'subscribed' && (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.704 5.29a1 1 0 00-1.408-1.42L8 11.166 4.704 7.87a1 1 0 10-1.408 1.42l4 4a1 1 0 001.408 0l8-8z" clipRule="evenodd" /></svg>
                  Notifications activées
                </span>
                <button
                  onClick={handleDisable}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
                >
                  Désactiver
                </button>
              </>
            )}
            {status === 'denied' && (
              <span className="text-xs text-amber-700">
                Notifications bloquées dans votre navigateur. Autorisez-les dans les réglages du
                site pour les réactiver.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
