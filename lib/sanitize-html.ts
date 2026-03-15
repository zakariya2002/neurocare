import DOMPurify from 'dompurify';

/**
 * Sanitize du HTML pour prévenir les attaques XSS.
 * À utiliser partout où dangerouslySetInnerHTML est nécessaire.
 *
 * Usage:
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Côté serveur : retirer les balises script manuellement
    // DOMPurify nécessite un DOM, donc on fait un nettoyage basique côté serveur
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript\s*:/gi, '');
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title',
      'class', 'id', 'style',
      'width', 'height',
    ],
    ALLOW_DATA_ATTR: false,
  });
}
