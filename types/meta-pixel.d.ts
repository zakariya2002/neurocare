// Typage global pour le Pixel Meta (Facebook Pixel).
// Le snippet officiel injecte une fonction globale `fbq` ainsi qu'une référence
// `_fbq`. On les déclare ici pour bénéficier de la complétion TS partout dans
// l'app sans `// @ts-ignore`.

export {};

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}
