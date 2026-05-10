/**
 * Générateur PDF des courriers administratifs (A3 — courriersAdmin).
 *
 * Format A4, conventions françaises (cf. service-public.fr) :
 * - Coordonnées de l'expéditeur en haut à gauche.
 * - Coordonnées du destinataire en haut à droite (sous l'expéditeur).
 * - Lieu et date sous les coordonnées du destinataire.
 * - Objet en gras, parfois précédé de la mention « Lettre recommandée ».
 * - Formule d'appel ("Madame, Monsieur,").
 * - Corps du courrier en paragraphes justifiés.
 * - Formule de politesse.
 * - Bloc signature en bas à droite.
 *
 * Police : Helvetica (intégrée à pdfkit, pas besoin de fichier .ttf).
 * Tailles : 11pt pour le corps, 14pt pour le titre (objet).
 */

import PDFDocument from 'pdfkit';
import { getModele, type CourrierModeleId } from './templates';
import {
  buildCourrierBody,
  type CourrierBodyContext,
} from './bodies';

export interface CourrierPdfInput {
  modeleId: CourrierModeleId;
  /** Coordonnées de l'expéditeur (parent) */
  sender: {
    fullName: string;
    addressLines: string[]; // Lignes d'adresse postale (au moins 1)
    email?: string;
    phone?: string;
  };
  /** Coordonnées de l'enfant concerné */
  child: {
    fullName: string;
    birthDate?: string; // ISO yyyy-mm-dd
  };
  /** Bloc destinataire (multi-lignes) */
  recipient: {
    addressBlock: string; // Bloc texte saisi par l'utilisateur
  };
  /** Objet du courrier */
  object: string;
  /** Lieu (ex: ville du parent) */
  place: string;
  /** Date de rédaction (ISO yyyy-mm-dd ou Date) */
  date: Date;
  /** Champs spécifiques au modèle */
  fields: Record<string, string>;
}

const PAGE_WIDTH = 595.28; // A4 en points
const MARGIN = 60;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const RIGHT_BLOCK_WIDTH = 230;
const RIGHT_BLOCK_X = PAGE_WIDTH - MARGIN - RIGHT_BLOCK_WIDTH;

const COLOR_TEXT = '#111827';
const COLOR_MUTED = '#374151';

function formatDateFr(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatDateShort(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function getBirthDateFormatted(iso: string | undefined): string {
  return formatDateShort(iso);
}

export async function generateCourrierPDF(
  input: CourrierPdfInput
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const modele = getModele(input.modeleId);
      if (!modele) {
        reject(new Error(`Modèle inconnu : ${input.modeleId}`));
        return;
      }

      const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ----- Bloc expéditeur (haut gauche) -----
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(COLOR_TEXT)
        .text(input.sender.fullName, MARGIN, MARGIN, { width: 240 });

      doc.font('Helvetica').fillColor(COLOR_MUTED).fontSize(10);
      const senderLines: string[] = [];
      input.sender.addressLines.filter(Boolean).forEach((line) => {
        senderLines.push(line);
      });
      if (input.sender.phone) senderLines.push(`Tél. : ${input.sender.phone}`);
      if (input.sender.email) senderLines.push(input.sender.email);
      senderLines.forEach((line) => {
        doc.text(line, { width: 240 });
      });

      // ----- Bloc destinataire (haut droite) -----
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(COLOR_TEXT)
        .text(input.recipient.addressBlock, RIGHT_BLOCK_X, MARGIN, {
          width: RIGHT_BLOCK_WIDTH,
        });

      // ----- Lieu et date (sous le bloc destinataire, aligné à droite) -----
      const dateY = doc.y + 14;
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(COLOR_TEXT)
        .text(
          `${input.place}, le ${formatDateFr(input.date)}`,
          RIGHT_BLOCK_X,
          dateY,
          { width: RIGHT_BLOCK_WIDTH, align: 'right' }
        );

      // ----- Objet (gras, taille 14, aligné à gauche) -----
      let bodyY = Math.max(doc.y, MARGIN + 200) + 30;
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(COLOR_TEXT)
        .text('Objet : ', MARGIN, bodyY, { continued: true })
        .font('Helvetica')
        .text(input.object);

      bodyY = doc.y + 8;

      // Référence dossier (si fournie via fields.mdph_number ou pco_number)
      const reference =
        input.fields.mdph_number?.trim() ||
        input.fields.pco_number?.trim() ||
        '';
      if (reference) {
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .text('Référence : ', MARGIN, bodyY, { continued: true })
          .font('Helvetica')
          .text(reference);
        bodyY = doc.y + 8;
      }

      // ----- Formule d'appel -----
      bodyY += 12;
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(COLOR_TEXT)
        .text('Madame, Monsieur,', MARGIN, bodyY, { width: CONTENT_WIDTH });

      bodyY = doc.y + 14;

      // ----- Corps du courrier -----
      const ctx: CourrierBodyContext = {
        sender: input.sender,
        child: input.child,
        fields: input.fields,
        date: input.date,
      };
      const paragraphs = buildCourrierBody(input.modeleId, ctx);

      doc.font('Helvetica').fontSize(11).fillColor(COLOR_TEXT);
      paragraphs.forEach((p, idx) => {
        doc.text(p, MARGIN, idx === 0 ? bodyY : doc.y + 8, {
          width: CONTENT_WIDTH,
          align: 'justify',
          lineGap: 2,
        });
      });

      // ----- Formule de politesse -----
      const politessY = doc.y + 16;
      doc
        .font('Helvetica')
        .fontSize(11)
        .text(
          "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
          MARGIN,
          politessY,
          { width: CONTENT_WIDTH, align: 'justify', lineGap: 2 }
        );

      // ----- Bloc signature (bas droite) -----
      const signatureY = doc.y + 50;
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(COLOR_TEXT)
        .text(input.sender.fullName, RIGHT_BLOCK_X, signatureY, {
          width: RIGHT_BLOCK_WIDTH,
          align: 'right',
        });

      // Espace pour la signature manuscrite
      doc
        .font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor('#9ca3af')
        .text('(signature)', RIGHT_BLOCK_X, doc.y + 22, {
          width: RIGHT_BLOCK_WIDTH,
          align: 'right',
        });

      // ----- Pied de page -----
      const pageHeight = doc.page.height;
      doc
        .font('Helvetica-Oblique')
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(
          'Document généré via Neuro Care — neuro-care.fr',
          MARGIN,
          pageHeight - 40,
          { width: CONTENT_WIDTH, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
