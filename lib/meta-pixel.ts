// Helpers d'utilisation du Pixel Meta côté client.
//
// Toutes les fonctions sont sans-op si :
//   - on est côté serveur (SSR),
//   - le pixel n'a pas encore été chargé (`window.fbq` indisponible),
//   - l'utilisateur n'a pas donné son consentement marketing.
//
// Cela permet d'appeler `trackEvent` librement dans le code applicatif sans
// se soucier de l'état du consentement à chaque emplacement.

import { hasMarketingConsent } from './cookie-consent';

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';

function fbqAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!fbqAvailable()) return;
  if (!hasMarketingConsent()) return;

  if (params) {
    window.fbq('track', eventName, params);
  } else {
    window.fbq('track', eventName);
  }
}

export function trackCustom(eventName: string, params?: Record<string, unknown>): void {
  if (!fbqAvailable()) return;
  if (!hasMarketingConsent()) return;

  if (params) {
    window.fbq('trackCustom', eventName, params);
  } else {
    window.fbq('trackCustom', eventName);
  }
}

// Mode consent v2 de Meta : permet de signaler explicitement au pixel si
// l'utilisateur a accordé ou retiré son consentement, en plus du fait qu'on
// l'aurait initialisé ou non. Cela respecte les bonnes pratiques de Meta pour
// les régions soumises au RGPD.
export function grantConsent(): void {
  if (!fbqAvailable()) return;
  window.fbq('consent', 'grant');
}

export function revokeConsent(): void {
  if (!fbqAvailable()) return;
  window.fbq('consent', 'revoke');
}
