// Source de vérité unique pour le consentement cookies de l'utilisateur.
//
// Le consentement est stocké dans localStorage sous la clé `cookie-consent`
// (clé historique du projet, gardée pour ne pas invalider les choix existants)
// au format JSON, avec trois catégories :
//   - essential : toujours `true` (cookies techniques nécessaires au service)
//   - analytics : opt-in (Sentry, mesures de performance)
//   - marketing : opt-in (Pixel Meta, audiences publicitaires)
//
// Tout module qui dépend du consentement (ex. MetaPixel) écoute l'événement
// `cookie-consent-changed` émis sur `window` à chaque mise à jour.

export type CookieConsent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

export const COOKIE_CONSENT_KEY = 'cookie-consent';
export const COOKIE_CONSENT_EVENT = 'cookie-consent-changed';
export const COOKIE_PREFERENCES_OPEN_EVENT = 'cookie-preferences-open';

// Réouvre la modale de préférences cookies depuis n'importe où dans l'app
// (ex. lien "Gérer mes cookies" du footer). Implémenté via un event window
// pour éviter de wrapper l'app dans un Provider supplémentaire.
export function openCookiePreferences(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_OPEN_EVENT));
}

export const ALL_ACCEPTED: CookieConsent = {
  essential: true,
  analytics: true,
  marketing: true,
  timestamp: '',
};

export const ALL_REFUSED: CookieConsent = {
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: '',
};

export function readConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!raw) return null;

  // Compatibilité ascendante : l'ancien bandeau stockait des chaînes brutes
  // ('accepted' / 'dismissed'). On les traduit pour ne pas re-prompter les
  // utilisateurs déjà venus, mais sans présumer d'un consentement marketing
  // qu'ils n'ont jamais explicitement donné.
  if (raw === 'accepted') {
    return { essential: true, analytics: true, marketing: false, timestamp: '' };
  }
  if (raw === 'dismissed') {
    return { essential: true, analytics: false, marketing: false, timestamp: '' };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      timestamp: typeof parsed.timestamp === 'string' ? parsed.timestamp : '',
    };
  } catch {
    return null;
  }
}

export function writeConsent(consent: Omit<CookieConsent, 'essential' | 'timestamp'>): CookieConsent {
  const full: CookieConsent = {
    essential: true,
    analytics: consent.analytics,
    marketing: consent.marketing,
    timestamp: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(full));
    window.dispatchEvent(new CustomEvent<CookieConsent>(COOKIE_CONSENT_EVENT, { detail: full }));
  }
  return full;
}

export function hasMarketingConsent(): boolean {
  return readConsent()?.marketing === true;
}

export function hasAnalyticsConsent(): boolean {
  return readConsent()?.analytics === true;
}
