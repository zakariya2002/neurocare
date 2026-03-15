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
    // Côté serveur : DOMPurify nécessite un DOM, donc on fait un nettoyage robuste manuellement.
    // This covers: script tags, all on* event handlers (with or without quotes),
    // javascript:/vbscript:/data: URIs, SVG/math elements, style-based XSS, and meta refresh.
    return dirty
      // Remove script, style, iframe, object, embed, form, math, and SVG elements entirely
      .replace(/<(script|style|iframe|object|embed|form|math|svg)\b[^]*?<\/\1\s*>/gi, '')
      // Remove self-closing or unclosed dangerous tags
      .replace(/<(script|iframe|object|embed|form|math|svg)\b[^>]*\/?>/gi, '')
      // Remove all on* event handlers (with quotes, without quotes, or with backticks)
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s>]+)/gi, '')
      // Remove javascript:, vbscript:, and data: URIs in href/src/action attributes
      .replace(/(href|src|action|xlink:href|formaction)\s*=\s*(?:"[^"]*(?:javascript|vbscript|data)\s*:[^"]*"|'[^']*(?:javascript|vbscript|data)\s*:[^']*')/gi, '')
      // Remove javascript:/vbscript: anywhere (catches url() in styles, etc.)
      .replace(/(?:javascript|vbscript)\s*:/gi, '')
      // Remove style attributes containing expression(), url(), or -moz-binding
      .replace(/style\s*=\s*(?:"[^"]*(?:expression|url|\\|@import|-moz-binding)[^"]*"|'[^']*(?:expression|url|\\|@import|-moz-binding)[^']*')/gi, '')
      // Remove meta refresh tags
      .replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '')
      // Remove base tags (can redirect all relative URLs)
      .replace(/<base\b[^>]*>/gi, '');
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
