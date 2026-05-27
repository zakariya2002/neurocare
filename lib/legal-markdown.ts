import fs from 'fs';
import path from 'path';
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
 * Charge un fichier .md depuis legal-content/, le parse en HTML, et ajoute des
 * IDs sur les <h2> pour permettre la table des matières.
 */
export function loadLegalMarkdown(filename: string): ParsedLegal {
  const filepath = path.join(process.cwd(), 'legal-content', filename);
  const md = fs.readFileSync(filepath, 'utf8');

  const rawHtml = marked.parse(md, { gfm: true, breaks: false, async: false }) as string;

  const toc: { id: string; label: string }[] = [];
  const seen = new Set<string>();

  // Ajout des id="..." sur les <h2> + collecte de la TOC.
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
