/* NeuroCare — Service Worker pour les notifications Web Push (A2 Rappels MDPH).
 *
 * Ce SW est volontairement minimal : il gère uniquement l'événement push et
 * le clic sur la notification. Les autres SW de l'application (ex : PWA)
 * peuvent coexister, ce fichier ne touche pas au cycle de vie cache.
 */

/* eslint-disable no-restricted-globals */
self.addEventListener('install', (event) => {
  // Activation immédiate du nouveau SW (utile si l'utilisateur réabonne)
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'NeuroCare', body: 'Vous avez une nouvelle notification.', url: '/dashboard/family/rappels' };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      // Fallback : texte brut
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: '/images/logo-neurocare.png',
    badge: '/images/logo-neurocare.png',
    tag: payload.tag || 'neurocare-reminder',
    renotify: true,
    data: {
      url: payload.url || '/dashboard/family/rappels',
    },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'NeuroCare', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard/family/rappels';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const url = new URL(client.url);
          if (url.pathname === targetUrl && 'focus' in client) {
            return client.focus();
          }
        } catch (_) {
          // ignore parse errors
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
