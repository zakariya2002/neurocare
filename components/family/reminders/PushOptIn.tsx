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
    <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl shadow-sm p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: '#e6f4f4' }}
          aria-hidden="true"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Notifications du navigateur
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Recevez les rappels en plus de l’email, directement sur cet appareil. L’email reste
            envoyé dans tous les cas.
          </p>
          {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {status === 'busy' && (
              <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Chargement…
              </span>
            )}
            {status === 'idle' && (
              <button
                onClick={handleEnable}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl text-white transition hover:opacity-90 shadow-sm"
                style={{ backgroundColor: '#027e7e' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Activer les notifications
              </button>
            )}
            {status === 'subscribed' && (
              <>
                <span
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#d1fae5', color: '#047857' }}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 5.29a1 1 0 00-1.408-1.42L8 11.166 4.704 7.87a1 1 0 10-1.408 1.42l4 4a1 1 0 001.408 0l8-8z" clipRule="evenodd" />
                  </svg>
                  Notifications activées
                </span>
                <button
                  onClick={handleDisable}
                  className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-xl text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition"
                >
                  Désactiver
                </button>
              </>
            )}
            {status === 'denied' && (
              <span className="text-xs sm:text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
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
