/**
 * Masque les coordonnées de contact (liens, emails, téléphones) dans un texte
 * destiné à l'affichage public — pour éviter la désintermédiation
 * (pros qui captent le client en direct hors plateforme).
 *
 * IMPORTANT : ne modifie JAMAIS la donnée stockée. À appliquer uniquement
 * au moment du rendu. Le pro garde son texte intact côté édition.
 */

// TLD courantes — restreint le masquage des domaines "nus" pour limiter les faux positifs.
const TLD =
  '(?:fr|com|net|org|io|co|be|ch|eu|info|biz|me|app|site|online|pro|clinic|health|care|dev|xyz|paris)';

export function maskContactInfo(text: string | null | undefined): string {
  if (!text) return text ?? '';
  let out = text;

  // 1. URLs explicites (http(s):// ou www.)
  out = out.replace(/\b(?:https?:\/\/|www\.)[^\s<>()]+/gi, '[lien masqué]');

  // 2. Emails
  out = out.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi,
    '[email masqué]',
  );

  // 3. Réseaux sociaux écrits en @pseudo (instagram/tiktok…)
  out = out.replace(
    /(?:^|\s)@[A-Za-z0-9._]{3,}/g,
    (m) => (m.startsWith(' ') ? ' ' : '') + '[réseau masqué]',
  );

  // 4. Domaines "nus" type monsite.fr / cabinet-xyz.com/contact
  out = out.replace(
    new RegExp(
      `\\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9-]+)*\\.${TLD}\\b(?:\\/[^\\s]*)?`,
      'gi',
    ),
    '[lien masqué]',
  );

  // 5. Contournements "point" : monsite point fr / monsite (point) com
  out = out.replace(
    new RegExp(`\\b[a-z0-9-]{2,}\\s*[\\(\\[]?\\s*point\\s*[\\)\\]]?\\s*${TLD}\\b`, 'gi'),
    '[lien masqué]',
  );

  // 6. Téléphones français (+33 / 0033 / 0X suivi de 4 groupes de 2 chiffres)
  out = out.replace(
    /(?:(?:\+|00)33[\s.\-]?|0)[1-9](?:[\s.\-]?\d{2}){4}\b/g,
    '[téléphone masqué]',
  );

  return out;
}

/** Indique si un texte contient des coordonnées (pour la modération admin). */
export function containsContactInfo(text: string | null | undefined): boolean {
  if (!text) return false;
  return maskContactInfo(text) !== text;
}
