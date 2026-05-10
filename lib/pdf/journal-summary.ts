/**
 * Synthèse 30 jours du journal de bord — export PDF (B1).
 *
 * Document à présenter au pro lors d'un RDV.
 * - Page 1 : entête + synthèse globale (sommeil, repas, émotion dominante,
 *   bien-être, comportements les plus fréquents).
 * - Page 2+ : timeline jour par jour (1 ligne par log).
 *
 * Aucune photo n'est intégrée pour éviter d'embarquer du contenu d'image
 * sensible au format binaire (le pro consulte les photos en ligne via
 * l'application si la collaboration est active).
 */
import PDFDocument from 'pdfkit';
import {
  EMOTION_LABELS,
  BEHAVIOR_TAG_LABELS,
  MEAL_TAG_LABELS,
  CONTEXT_TAG_LABELS,
  aggregateLogs,
  sleepDurationMinutes,
  wellbeingLabel,
  type ChildDailyLogRow,
  type Emotion,
  type BehaviorTag,
} from '@/lib/family/journal';

export interface JournalSummaryData {
  childFirstName: string;
  childLastName?: string | null;
  childBirthDate?: string | null;
  parentFullName?: string | null;
  generationDate: Date;
  rangeFrom: Date;
  rangeTo: Date;
  /** Logs triés du plus récent au plus ancien. */
  logs: ReadonlyArray<ChildDailyLogRow>;
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
};

const PAGE = {
  width: 595.28,
  height: 841.89,
  marginX: 50,
  marginTop: 50,
  marginBottom: 60,
};

const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2;

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

function formatDateLong(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(d);
}

function formatDurationMin(mins: number | null): string {
  if (mins === null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m.toString().padStart(2, '0')}`;
}

function drawHeader(doc: PDFKit.PDFDocument, data: JournalSummaryData) {
  doc.rect(0, 0, PAGE.width, 90).fill(COLORS.primary);
  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('NeuroCare', PAGE.marginX, 30);
  doc
    .font('Helvetica')
    .fontSize(11)
    .text('Synthèse du journal de bord', PAGE.marginX, 55);
  doc
    .fontSize(9)
    .text(`Généré le ${formatDate(data.generationDate)}`, PAGE.marginX, 70);
  doc.fillColor(COLORS.dark);
}

function drawFooter(doc: PDFKit.PDFDocument, pageNumber: number, totalPages: number) {
  const y = PAGE.height - 35;
  doc
    .fontSize(8)
    .fillColor(COLORS.lightGray)
    .font('Helvetica')
    .text(
      'Document généré à titre informatif depuis NeuroCare. Données déclarées par la famille.',
      PAGE.marginX,
      y,
      { width: CONTENT_WIDTH }
    );
  doc.text(
    `Page ${pageNumber} / ${totalPages}`,
    PAGE.marginX,
    y + 12,
    { width: CONTENT_WIDTH, align: 'right' }
  );
  doc.fillColor(COLORS.dark);
}

function topEntries<K extends string>(
  record: Record<K, number>,
  limit: number,
  labels: Record<K, string>
): Array<{ key: K; label: string; count: number }> {
  return (Object.entries(record) as Array<[K, number]>)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count, label: labels[key] ?? String(key) }));
}

export async function generateJournalSummaryPDF(
  data: JournalSummaryData
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

      // ─── Page 1 — synthèse ──────────────────────────────────────────────
      drawHeader(doc, data);

      let y = 110;

      doc
        .fontSize(20)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text(
          `Synthèse — ${data.childFirstName}${data.childLastName ? ` ${data.childLastName}` : ''}`,
          PAGE.marginX,
          y
        );
      y += 26;

      doc
        .fontSize(10)
        .fillColor(COLORS.gray)
        .font('Helvetica')
        .text(
          `Période : du ${formatDate(data.rangeFrom)} au ${formatDate(data.rangeTo)}.`,
          PAGE.marginX,
          y,
          { width: CONTENT_WIDTH }
        );
      y += 16;
      if (data.parentFullName) {
        doc.text(`Parent : ${data.parentFullName}`, PAGE.marginX, y);
        y += 14;
      }
      doc.text(
        'Document récapitulatif déclaratif. Aucune donnée médicale ne se substitue à un avis professionnel.',
        PAGE.marginX,
        y,
        { width: CONTENT_WIDTH }
      );
      y += 26;

      // ─── Encadré stats globales ────────────────────────────────────────
      const agg = aggregateLogs(data.logs);
      const boxHeight = 130;
      doc
        .roundedRect(PAGE.marginX, y, CONTENT_WIDTH, boxHeight, 6)
        .fillAndStroke(COLORS.highlightBg, COLORS.highlightBorder);

      const innerX = PAGE.marginX + 20;
      let innerY = y + 16;
      doc
        .fontSize(9)
        .fillColor(COLORS.gray)
        .font('Helvetica-Bold')
        .text('SYNTHÈSE GLOBALE', innerX, innerY);
      innerY += 18;

      const stats: Array<[string, string]> = [
        ['Jours saisis', `${agg.daysWithLog}`],
        [
          'Sommeil moyen',
          formatDurationMin(agg.averageSleepDurationMinutes),
        ],
        [
          'Qualité sommeil moyenne',
          agg.averageSleepQuality !== null ? `${agg.averageSleepQuality} / 5` : '—',
        ],
        [
          'Réveils nocturnes (moyenne)',
          agg.nightWakingsAverage !== null ? `${agg.nightWakingsAverage}` : '—',
        ],
        [
          'Score repas moyen',
          agg.averageMealsScore !== null ? `${agg.averageMealsScore} / 5` : '—',
        ],
        [
          'Bien-être moyen',
          agg.averageWellbeing !== null ? `${agg.averageWellbeing} / 5` : '—',
        ],
      ];

      doc.fontSize(10).font('Helvetica').fillColor(COLORS.dark);
      const colWidth = (CONTENT_WIDTH - 40) / 2;
      stats.forEach((entry, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = innerX + col * colWidth;
        const ry = innerY + row * 18;
        doc.font('Helvetica').fillColor(COLORS.gray).text(entry[0], x, ry, { width: colWidth - 10 });
        doc.font('Helvetica-Bold').fillColor(COLORS.dark).text(entry[1], x + 160, ry, { width: colWidth - 170 });
      });
      y += boxHeight + 18;

      // ─── Émotions dominantes ───────────────────────────────────────────
      doc
        .fontSize(11)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text('Émotions dominantes', PAGE.marginX, y);
      y += 16;
      const topEmotions = topEntries<Emotion>(
        agg.emotionDistribution,
        5,
        EMOTION_LABELS
      );
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.dark);
      if (topEmotions.length === 0) {
        doc.fillColor(COLORS.gray).text('Aucune émotion enregistrée sur la période.', PAGE.marginX, y);
        y += 14;
      } else {
        for (const e of topEmotions) {
          doc
            .fillColor(COLORS.dark)
            .text(`• ${e.label} : ${e.count} jour${e.count > 1 ? 's' : ''}`, PAGE.marginX, y);
          y += 14;
        }
      }
      y += 8;

      // ─── Comportements les plus fréquents ──────────────────────────────
      doc
        .fontSize(11)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text('Comportements les plus fréquents', PAGE.marginX, y);
      y += 16;
      const topBehaviors = topEntries<BehaviorTag>(
        agg.behaviorFrequency,
        6,
        BEHAVIOR_TAG_LABELS
      );
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.dark);
      if (topBehaviors.length === 0) {
        doc.fillColor(COLORS.gray).text('Aucun comportement renseigné sur la période.', PAGE.marginX, y);
        y += 14;
      } else {
        for (const b of topBehaviors) {
          doc
            .fillColor(COLORS.dark)
            .text(`• ${b.label} : ${b.count} jour${b.count > 1 ? 's' : ''}`, PAGE.marginX, y);
          y += 14;
        }
      }

      // ─── Page suivante : timeline ──────────────────────────────────────
      doc.addPage();
      drawHeader(doc, data);
      y = 110;

      doc
        .fontSize(16)
        .fillColor(COLORS.dark)
        .font('Helvetica-Bold')
        .text('Détail jour par jour', PAGE.marginX, y);
      y += 22;
      doc
        .fontSize(9)
        .fillColor(COLORS.gray)
        .font('Helvetica')
        .text(
          'Sommeil = durée et qualité ; comp. = principaux comportements ; ctxt = déclencheurs.',
          PAGE.marginX,
          y
        );
      y += 18;

      // En-têtes de colonnes
      const cols = [
        { label: 'Date', x: PAGE.marginX, w: 70 },
        { label: 'Sommeil', x: PAGE.marginX + 70, w: 80 },
        { label: 'Bien-être', x: PAGE.marginX + 150, w: 70 },
        { label: 'Émotion', x: PAGE.marginX + 220, w: 70 },
        { label: 'Comportements', x: PAGE.marginX + 290, w: 130 },
        { label: 'Contexte', x: PAGE.marginX + 420, w: 75 },
      ];
      doc.fontSize(8).fillColor(COLORS.gray).font('Helvetica-Bold');
      for (const c of cols) doc.text(c.label, c.x, y, { width: c.w });
      y += 14;
      doc
        .moveTo(PAGE.marginX, y)
        .lineTo(PAGE.marginX + CONTENT_WIDTH, y)
        .strokeColor(COLORS.softBorder)
        .stroke();
      y += 6;

      // Lignes
      const sortedAsc = [...data.logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.dark);
      for (const log of sortedAsc) {
        if (y > PAGE.height - PAGE.marginBottom - 30) {
          doc.addPage();
          drawHeader(doc, data);
          y = 110;
        }

        const dur = sleepDurationMinutes(log.sleep_bedtime, log.sleep_waketime);
        const sleepStr = `${formatDurationMin(dur)}${log.sleep_quality ? ` · ${log.sleep_quality}/5` : ''}`;
        const wbStr = log.wellbeing_score
          ? `${log.wellbeing_score}/5`
          : '—';
        const emo = log.emotion_main
          ? `${EMOTION_LABELS[log.emotion_main]}${log.emotion_intensity ? ` ${log.emotion_intensity}/5` : ''}`
          : '—';
        const beh = log.behavior_tags
          .map((t) => BEHAVIOR_TAG_LABELS[t])
          .filter(Boolean)
          .join(', ') || '—';
        const ctx = log.context_tags
          .map((t) => CONTEXT_TAG_LABELS[t])
          .filter(Boolean)
          .join(', ') || '—';

        const dateLabel = formatDateLong(new Date(`${log.log_date}T00:00:00`));

        const lineStartY = y;
        doc.fillColor(COLORS.dark).font('Helvetica');
        doc.text(dateLabel, cols[0].x, y, { width: cols[0].w });
        doc.text(sleepStr, cols[1].x, y, { width: cols[1].w });
        doc.text(`${wbStr} · ${wellbeingLabel(log.wellbeing_score)}`, cols[2].x, y, { width: cols[2].w });
        doc.text(emo, cols[3].x, y, { width: cols[3].w });
        doc.text(beh, cols[4].x, y, { width: cols[4].w });
        doc.text(ctx, cols[5].x, y, { width: cols[5].w });

        // Calcul de la ligne la plus haute (Tailwind-like)
        const maxLines = Math.max(
          doc.heightOfString(beh, { width: cols[4].w }),
          doc.heightOfString(ctx, { width: cols[5].w }),
          doc.heightOfString(dateLabel, { width: cols[0].w })
        );
        y = lineStartY + Math.max(14, maxLines + 4);

        if (log.free_note) {
          doc
            .fontSize(7)
            .fillColor(COLORS.gray)
            .text(`Note : ${log.free_note}`, PAGE.marginX + 70, y, {
              width: CONTENT_WIDTH - 70,
            });
          y += doc.heightOfString(log.free_note, { width: CONTENT_WIDTH - 70 }) + 4;
          doc.fontSize(8).fillColor(COLORS.dark);
        }

        doc
          .moveTo(PAGE.marginX, y)
          .lineTo(PAGE.marginX + CONTENT_WIDTH, y)
          .strokeColor(COLORS.softBg)
          .stroke();
        y += 4;
      }

      if (sortedAsc.length === 0) {
        doc.fontSize(10).fillColor(COLORS.gray).text(
          'Aucune saisie sur la période.',
          PAGE.marginX,
          y
        );
      }

      // Footer + pagination
      const pageRange = doc.bufferedPageRange();
      for (let i = 0; i < pageRange.count; i++) {
        doc.switchToPage(i);
        drawFooter(doc, i + 1, pageRange.count);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
