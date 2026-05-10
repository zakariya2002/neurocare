/**
 * Justificatif annuel CAF / impôts / CESU (A4 — justificatifsAnnuels).
 *
 * Génération d'un PDF A4 multi-pages agrégeant l'ensemble des reçus
 * d'une famille pour une année calendaire donnée.
 *
 * Inspiré du style existant (`lib/invoice-generator.ts`) — palette teal
 * NeuroCare, header répété, footer numéroté, tableau chronologique.
 *
 * Le document n'affirme pas l'éligibilité fiscale ou sociale ; il agrège
 * les paiements pour permettre à l'utilisateur de constituer ses dossiers.
 */
import PDFDocument from 'pdfkit';

export interface JustificatifAnnuelLine {
  appointmentDate: Date;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  educatorFullName: string;
  educatorProfessionLabel?: string;
  educatorSiret?: string;
  educatorSapNumber?: string;
  educatorRppsNumber?: string;
  educatorAdeliNumber?: string;
  childFullName: string;
  amountTotalCents: number;
  invoiceNumber?: string;
}

export interface JustificatifAnnuelChildBreakdown {
  childFullName: string;
  totalCents: number;
  appointmentsCount: number;
}

export interface JustificatifAnnuelData {
  reference: string;
  year: number;
  generationDate: Date;

  parentFullName: string;
  parentAddress?: string;
  parentEmail?: string;
  parentTaxId?: string;

  totalCents: number;
  totalEligibleHalfCents: number;
  appointmentsCount: number;

  childrenBreakdown: ReadonlyArray<JustificatifAnnuelChildBreakdown>;
  lines: ReadonlyArray<JustificatifAnnuelLine>;
}

const COLORS = {
  primary: '#027e7e',
  dark: '#1f2937',
  gray: '#6b7280',
  lightGray: '#9ca3af',
  border: '#d1d5db',
  softBorder: '#e5e7eb',
  softBg: '#f9fafb',
  highlightBg: '#e6f4f4',
  highlightBorder: '#c9eaea',
  warningBg: '#fef9c3',
  warningBorder: '#facc15',
  warningText: '#854d0e',
};

const PAGE = {
  width: 595.28,
  height: 841.89,
  marginX: 50,
  marginTop: 50,
  marginBottom: 60,
};

const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2;

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatAmount(amountInCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountInCents / 100);
}

function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m.toString().padStart(2, '0')}`;
}

function truncate(str: string | undefined | null, max: number): string {
  const s = (str ?? '').trim();
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)) + '…';
}

/**
 * Génère le PDF du justificatif annuel.
 */
export async function generateJustificatifAnnuelPDF(
  data: JustificatifAnnuelData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ---------------- PAGE 1 — Synthèse ----------------
      drawHeader(doc, data, /* compact */ false);

      let y = 165;

      // Titre
      doc
        .fontSize(20)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text(`Justificatif annuel ${data.year}`, PAGE.marginX, y);

      y += 28;
      doc
        .fontSize(10)
        .fillColor(COLORS.gray)
        .font('Helvetica')
        .text(
          `Document de synthèse des sommes versées via la plateforme NeuroCare entre le 1er janvier ${data.year} et le 31 décembre ${data.year}.`,
          PAGE.marginX,
          y,
          { width: CONTENT_WIDTH }
        );

      y += 32;

      // Bloc bénéficiaire / parent
      doc
        .fontSize(9)
        .fillColor(COLORS.gray)
        .font('Helvetica-Bold')
        .text('PERSONNE À L\'ORIGINE DU PAIEMENT', PAGE.marginX, y);

      y += 16;
      doc
        .fontSize(11)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text(data.parentFullName, PAGE.marginX, y);

      y += 15;
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.dark);
      if (data.parentAddress) {
        doc.text(data.parentAddress, PAGE.marginX, y, { width: CONTENT_WIDTH });
        y += 14;
      }
      if (data.parentEmail) {
        doc.text(`Email : ${data.parentEmail}`, PAGE.marginX, y);
        y += 14;
      }
      if (data.parentTaxId) {
        doc.text(`Numéro fiscal : ${data.parentTaxId}`, PAGE.marginX, y);
        y += 14;
      }

      y += 10;

      // Encadré totaux
      const totalsBoxHeight = 110;
      doc
        .roundedRect(PAGE.marginX, y, CONTENT_WIDTH, totalsBoxHeight, 6)
        .fillAndStroke(COLORS.highlightBg, COLORS.highlightBorder);

      const innerX = PAGE.marginX + 20;
      let innerY = y + 16;

      doc
        .fontSize(9)
        .fillColor(COLORS.gray)
        .font('Helvetica-Bold')
        .text(`SYNTHÈSE ${data.year}`, innerX, innerY);

      innerY += 16;

      // Total dépensé (gauche)
      doc
        .fontSize(9)
        .fillColor(COLORS.gray)
        .font('Helvetica')
        .text('Total dépensé (TTC)', innerX, innerY);
      doc
        .fontSize(20)
        .fillColor(COLORS.primary)
        .font('Helvetica-Bold')
        .text(formatAmount(data.totalCents), innerX, innerY + 12);

      // Nombre de RDV (centre)
      const colWidth = (CONTENT_WIDTH - 40) / 3;
      const col2X = innerX + colWidth;
      doc
        .fontSize(9)
        .fillColor(COLORS.gray)
        .font('Helvetica')
        .text('Séances réalisées', col2X, innerY);
      doc
        .fontSize(20)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text(String(data.appointmentsCount), col2X, innerY + 12);

      // Nombre d'enfants (droite)
      const col3X = innerX + colWidth * 2;
      doc
        .fontSize(9)
        .fillColor(COLORS.gray)
        .font('Helvetica')
        .text('Enfants concernés', col3X, innerY);
      doc
        .fontSize(20)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text(String(data.childrenBreakdown.length), col3X, innerY + 12);

      // Sous-bloc 50%
      innerY = y + totalsBoxHeight - 22;
      doc
        .fontSize(9)
        .fillColor(COLORS.dark)
        .font('Helvetica')
        .text(
          `Soit ${formatAmount(data.totalEligibleHalfCents)} correspondant à 50 % du total versé.`,
          innerX,
          innerY,
          { width: CONTENT_WIDTH - 40 }
        );

      y += totalsBoxHeight + 18;

      // Ventilation par enfant
      doc
        .fontSize(11)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text('Ventilation par enfant', PAGE.marginX, y);

      y += 18;

      if (data.childrenBreakdown.length === 0) {
        doc
          .fontSize(9)
          .fillColor(COLORS.gray)
          .font('Helvetica-Oblique')
          .text('Aucun enfant rattaché aux séances de cette année.', PAGE.marginX, y);
        y += 14;
      } else {
        // En-tête tableau
        doc
          .fontSize(8)
          .fillColor(COLORS.gray)
          .font('Helvetica-Bold')
          .text('ENFANT', PAGE.marginX, y)
          .text('SÉANCES', PAGE.marginX + 320, y, { width: 70, align: 'right' })
          .text('TOTAL TTC', PAGE.marginX + 400, y, { width: 95, align: 'right' });
        y += 12;
        doc
          .strokeColor(COLORS.softBorder)
          .lineWidth(0.5)
          .moveTo(PAGE.marginX, y)
          .lineTo(PAGE.marginX + CONTENT_WIDTH, y)
          .stroke();
        y += 8;

        for (const c of data.childrenBreakdown) {
          if (y > PAGE.height - PAGE.marginBottom - 240) {
            // exceptionnel — la synthèse devrait tenir
            doc.addPage();
            drawHeader(doc, data, true);
            y = 150;
          }
          doc
            .fontSize(10)
            .fillColor(COLORS.dark)
            .font('Helvetica')
            .text(truncate(c.childFullName, 50), PAGE.marginX, y, { width: 310 })
            .text(String(c.appointmentsCount), PAGE.marginX + 320, y, {
              width: 70,
              align: 'right',
            })
            .font('Helvetica-Bold')
            .text(formatAmount(c.totalCents), PAGE.marginX + 400, y, {
              width: 95,
              align: 'right',
            });
          y += 18;
        }
      }

      y += 12;

      // Mentions légales / usage
      const mentionsHeight = 130;
      const remaining = PAGE.height - PAGE.marginBottom - y;
      if (remaining < mentionsHeight + 30) {
        // pas la place — on ajoute la page de mentions juste après
        doc.addPage();
        drawHeader(doc, data, true);
        y = 150;
      }

      doc
        .roundedRect(PAGE.marginX, y, CONTENT_WIDTH, mentionsHeight, 6)
        .fillAndStroke(COLORS.softBg, COLORS.border);

      let mY = y + 14;
      doc
        .fontSize(10)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text('Comment utiliser ce document', PAGE.marginX + 16, mY);

      mY += 16;
      doc
        .fontSize(8.5)
        .fillColor(COLORS.dark)
        .font('Helvetica')
        .text(
          'Ce document agrège les paiements effectués via NeuroCare au cours de l\'année civile indiquée. Il peut être joint, à titre de pièce justificative, à :',
          PAGE.marginX + 16,
          mY,
          { width: CONTENT_WIDTH - 32 }
        );

      mY += 26;
      const bullets = [
        'Votre déclaration de revenus, dans le cadre du crédit d\'impôt « services à la personne » (article 199 sexdecies du Code général des impôts) — sous réserve du respect des conditions d\'éligibilité que vous appréciez avec votre conseiller fiscal ou via impots.gouv.fr.',
        'Votre dossier auprès de la CAF (AEEH) ou de la MDPH (PCH, complément AEEH).',
        'Votre dossier CESU préfinancé ou votre mutuelle complémentaire santé.',
      ];
      for (const b of bullets) {
        doc.fontSize(8.5).font('Helvetica');
        doc
          .fillColor(COLORS.gray)
          .text('•', PAGE.marginX + 16, mY)
          .fillColor(COLORS.dark)
          .text(b, PAGE.marginX + 28, mY, { width: CONTENT_WIDTH - 44 });
        const h = doc.heightOfString(b, { width: CONTENT_WIDTH - 44 });
        mY += h + 4;
      }

      // ---------------- PAGE 2+ — Détail chronologique ----------------
      doc.addPage();
      drawHeader(doc, data, /* compact */ true);
      drawDetailTable(doc, data);

      // ---------------- Footer paginé ----------------
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        drawFooter(doc, data, i + 1, range.count);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  data: JustificatifAnnuelData,
  compact: boolean
) {
  const y0 = PAGE.marginTop;

  // Bandeau gauche : titre
  doc
    .fontSize(compact ? 14 : 20)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text('JUSTIFICATIF ANNUEL', PAGE.marginX, y0);

  doc
    .fontSize(compact ? 9 : 10)
    .fillColor(COLORS.gray)
    .font('Helvetica')
    .text(
      `Année ${data.year} — Référence ${data.reference}`,
      PAGE.marginX,
      y0 + (compact ? 18 : 28)
    )
    .text(
      `Émis le ${formatDate(data.generationDate)}`,
      PAGE.marginX,
      y0 + (compact ? 30 : 42)
    );

  // Bandeau droit : NeuroCare
  doc
    .fontSize(9)
    .fillColor(COLORS.gray)
    .font('Helvetica')
    .text('Émis via', 350, y0, { width: PAGE.width - 350 - PAGE.marginX, align: 'right' });
  doc
    .fontSize(15)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text('NeuroCare', 350, y0 + 12, {
      width: PAGE.width - 350 - PAGE.marginX,
      align: 'right',
    });
  doc
    .fontSize(8)
    .fillColor(COLORS.gray)
    .font('Helvetica')
    .text('neuro-care.fr', 350, y0 + 30, {
      width: PAGE.width - 350 - PAGE.marginX,
      align: 'right',
    });

  // Ligne de séparation
  const lineY = compact ? y0 + 48 : y0 + 80;
  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.8)
    .moveTo(PAGE.marginX, lineY)
    .lineTo(PAGE.width - PAGE.marginX, lineY)
    .stroke();
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  data: JustificatifAnnuelData,
  pageNumber: number,
  totalPages: number
) {
  const y = PAGE.height - 40;
  doc
    .strokeColor(COLORS.softBorder)
    .lineWidth(0.5)
    .moveTo(PAGE.marginX, y - 8)
    .lineTo(PAGE.width - PAGE.marginX, y - 8)
    .stroke();

  doc
    .fontSize(7.5)
    .fillColor(COLORS.lightGray)
    .font('Helvetica')
    .text(
      `Réf. ${data.reference} — Année ${data.year}`,
      PAGE.marginX,
      y,
      { width: 250 }
    );

  doc
    .fontSize(7.5)
    .fillColor(COLORS.lightGray)
    .font('Helvetica')
    .text(
      `Page ${pageNumber} / ${totalPages}`,
      PAGE.width - PAGE.marginX - 100,
      y,
      { width: 100, align: 'right' }
    );

  doc
    .fontSize(7)
    .fillColor(COLORS.lightGray)
    .font('Helvetica-Oblique')
    .text(
      'Document généré automatiquement par la plateforme NeuroCare — neuro-care.fr',
      PAGE.marginX,
      y + 10,
      { width: CONTENT_WIDTH, align: 'center' }
    );
}

interface ColumnDef {
  header: string;
  x: number;
  width: number;
  align?: 'left' | 'right' | 'center';
}

function drawDetailTable(
  doc: PDFKit.PDFDocument,
  data: JustificatifAnnuelData
) {
  let y = 110;

  doc
    .fontSize(13)
    .fillColor(COLORS.dark)
    .font('Helvetica-Bold')
    .text('Détail chronologique des séances', PAGE.marginX, y);

  y += 22;

  // Colonnes : Date | Professionnel | Enfant | Type / Durée | Montant
  const columns: ColumnDef[] = [
    { header: 'DATE', x: PAGE.marginX, width: 60 },
    { header: 'PROFESSIONNEL', x: PAGE.marginX + 62, width: 170 },
    { header: 'ENFANT', x: PAGE.marginX + 234, width: 110 },
    { header: 'PRESTATION / DURÉE', x: PAGE.marginX + 346, width: 95 },
    {
      header: 'MONTANT',
      x: PAGE.marginX + 443,
      width: 52,
      align: 'right',
    },
  ];

  drawTableHeader(doc, columns, y);
  y += 18;

  let runningTotal = 0;

  for (let i = 0; i < data.lines.length; i++) {
    const line = data.lines[i];
    const rowHeight = computeRowHeight(doc, line, columns);

    // Saut de page si nécessaire
    if (y + rowHeight > PAGE.height - PAGE.marginBottom - 40) {
      doc.addPage();
      drawHeader(doc, data, /* compact */ true);
      y = 110;
      doc
        .fontSize(13)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text('Détail chronologique (suite)', PAGE.marginX, y);
      y += 22;
      drawTableHeader(doc, columns, y);
      y += 18;
    }

    drawTableRow(doc, line, columns, y, i % 2 === 1);
    y += rowHeight;
    runningTotal += line.amountTotalCents;
  }

  // Ligne total
  if (y > PAGE.height - PAGE.marginBottom - 60) {
    doc.addPage();
    drawHeader(doc, data, true);
    y = 110;
  }

  y += 8;
  doc
    .strokeColor(COLORS.primary)
    .lineWidth(1.2)
    .moveTo(PAGE.marginX, y)
    .lineTo(PAGE.width - PAGE.marginX, y)
    .stroke();
  y += 10;

  doc
    .fontSize(11)
    .fillColor(COLORS.dark)
    .font('Helvetica-Bold')
    .text(
      `Total ${data.year} (${data.appointmentsCount} séance${
        data.appointmentsCount > 1 ? 's' : ''
      })`,
      PAGE.marginX,
      y,
      { width: 380 }
    )
    .fillColor(COLORS.primary)
    .text(formatAmount(runningTotal), PAGE.marginX + 380, y, {
      width: CONTENT_WIDTH - 380,
      align: 'right',
    });
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  columns: ColumnDef[],
  y: number
) {
  doc.fontSize(8).fillColor(COLORS.gray).font('Helvetica-Bold');
  for (const c of columns) {
    doc.text(c.header, c.x, y, {
      width: c.width,
      align: c.align ?? 'left',
    });
  }
  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.6)
    .moveTo(PAGE.marginX, y + 12)
    .lineTo(PAGE.width - PAGE.marginX, y + 12)
    .stroke();
}

function buildProfessionalText(line: JustificatifAnnuelLine): string {
  const parts: string[] = [line.educatorFullName];
  if (line.educatorProfessionLabel) {
    parts.push(line.educatorProfessionLabel);
  }
  const ids: string[] = [];
  if (line.educatorSiret) ids.push(`SIRET ${line.educatorSiret}`);
  if (line.educatorRppsNumber) ids.push(`RPPS ${line.educatorRppsNumber}`);
  if (line.educatorAdeliNumber) ids.push(`ADELI ${line.educatorAdeliNumber}`);
  if (line.educatorSapNumber) ids.push(`SAP ${line.educatorSapNumber}`);
  if (ids.length > 0) parts.push(ids.join(' · '));
  return parts.join('\n');
}

function buildPrestationText(line: JustificatifAnnuelLine): string {
  const lines: string[] = [];
  if (line.educatorProfessionLabel) {
    lines.push(line.educatorProfessionLabel);
  } else {
    lines.push('Séance');
  }
  lines.push(formatDuration(line.durationMinutes));
  return lines.join('\n');
}

function computeRowHeight(
  doc: PDFKit.PDFDocument,
  line: JustificatifAnnuelLine,
  columns: ColumnDef[]
): number {
  const proText = buildProfessionalText(line);
  const childText = truncate(line.childFullName, 60);
  const prestaText = buildPrestationText(line);

  const proCol = columns.find((c) => c.header === 'PROFESSIONNEL')!;
  const childCol = columns.find((c) => c.header === 'ENFANT')!;
  const prestaCol = columns.find((c) => c.header === 'PRESTATION / DURÉE')!;

  doc.fontSize(8.5).font('Helvetica');
  const hPro = doc.heightOfString(proText, { width: proCol.width });
  const hChild = doc.heightOfString(childText, { width: childCol.width });
  const hPresta = doc.heightOfString(prestaText, { width: prestaCol.width });

  return Math.max(22, hPro, hChild, hPresta) + 8;
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  line: JustificatifAnnuelLine,
  columns: ColumnDef[],
  y: number,
  zebra: boolean
) {
  const rowHeight = computeRowHeight(doc, line, columns);

  if (zebra) {
    doc
      .rect(PAGE.marginX, y - 3, CONTENT_WIDTH, rowHeight)
      .fill(COLORS.softBg);
  }

  doc.fontSize(8.5).fillColor(COLORS.dark).font('Helvetica');

  // DATE
  doc.text(formatDate(line.appointmentDate), columns[0].x, y, {
    width: columns[0].width,
  });

  // PROFESSIONNEL
  doc.text(buildProfessionalText(line), columns[1].x, y, {
    width: columns[1].width,
  });

  // ENFANT
  doc.text(truncate(line.childFullName, 60), columns[2].x, y, {
    width: columns[2].width,
  });

  // PRESTATION / DURÉE
  doc.text(buildPrestationText(line), columns[3].x, y, {
    width: columns[3].width,
  });

  // MONTANT
  doc
    .font('Helvetica-Bold')
    .fillColor(COLORS.dark)
    .text(formatAmount(line.amountTotalCents), columns[4].x, y, {
      width: columns[4].width,
      align: 'right',
    });
}
