import { marked } from 'marked';

export interface ParsedLegal {
  html: string;
  toc: { id: string; label: string }[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

/**
 * Parse une string Markdown en HTML, ajoute des IDs sur les <h2> et collecte
 * la table des matières. Le markdown est importé statiquement (webpack
 * asset/source) pour garantir le bundling sur Vercel.
 */
export function parseLegalMarkdown(md: string): ParsedLegal {
  const rawHtml = marked.parse(md, { gfm: true, breaks: false, async: false }) as string;

  const toc: { id: string; label: string }[] = [];
  const seen = new Set<string>();

  const html = rawHtml.replace(/<h2>([^<]+)<\/h2>/g, (_match, raw) => {
    const text = String(raw).replace(/&amp;/g, '&').replace(/&#39;/g, "'");
    let id = slugify(text);
    let suffix = 2;
    while (seen.has(id)) {
      id = `${slugify(text)}-${suffix++}`;
    }
    seen.add(id);
    toc.push({ id, label: text });
    return `<h2 id="${id}">${raw}</h2>`;
  });

  return { html, toc };
}
