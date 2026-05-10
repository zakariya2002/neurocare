'use client';

import { useMemo } from 'react';
import {
  EMOTIONS,
  EMOTION_COLORS,
  EMOTION_LABELS,
  BEHAVIOR_TAGS,
  BEHAVIOR_TAG_LABELS,
  aggregateLogs,
  isoDate,
  type ChildDailyLogRow,
} from '@/lib/family/journal';

interface Props {
  logs: ReadonlyArray<ChildDailyLogRow>;
  rangeLabel: string;
}

function formatMinutes(min: number | null): string {
  if (min === null) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m.toString().padStart(2, '0')}`;
}

/**
 * Construit la série des 30 derniers jours (score wellbeing par jour, ou null
 * si pas de saisie). Utilisée pour le mini-graphique en ligne.
 */
function build30DaySeries(logs: ReadonlyArray<ChildDailyLogRow>) {
  const map = new Map<string, number | null>();
  for (const l of logs) {
    map.set(l.log_date, l.wellbeing_score);
  }
  const out: Array<{ date: string; score: number | null }> = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = isoDate(d);
    out.push({ date: iso, score: map.get(iso) ?? null });
  }
  return out;
}

const LINE_W = 600;
const LINE_H = 120;
const LINE_PAD = { top: 10, right: 10, bottom: 22, left: 28 };

export default function JournalAggregateView({ logs, rangeLabel }: Props) {
  const agg = useMemo(() => aggregateLogs(logs), [logs]);
  const series = useMemo(() => build30DaySeries(logs), [logs]);

  const totalEmotions = useMemo(
    () => Object.values(agg.emotionDistribution).reduce((a, b) => a + b, 0),
    [agg.emotionDistribution]
  );

  const maxBehavior = useMemo(
    () => Math.max(0, ...Object.values(agg.behaviorFrequency)),
    [agg.behaviorFrequency]
  );

  const innerW = LINE_W - LINE_PAD.left - LINE_PAD.right;
  const innerH = LINE_H - LINE_PAD.top - LINE_PAD.bottom;
  const xStep = series.length > 1 ? innerW / (series.length - 1) : innerW;
  const yFor = (s: number | null) => {
    if (s === null) return null;
    // 1 -> bas, 5 -> haut
    return LINE_PAD.top + innerH - ((s - 1) / 4) * innerH;
  };

  // Path "linéaire avec coupures" — quand un jour est null, on coupe la ligne
  const pathSegments: string[] = [];
  let current: string[] = [];
  series.forEach((p, i) => {
    const y = yFor(p.score);
    const x = LINE_PAD.left + i * xStep;
    if (y === null) {
      if (current.length > 1) pathSegments.push(current.join(' '));
      current = [];
    } else {
      current.push(`${current.length === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
  });
  if (current.length > 1) pathSegments.push(current.join(' '));

  const stats: Array<[string, string]> = [
    ['Jours saisis', `${agg.daysWithLog}`],
    ['Sommeil moyen', formatMinutes(agg.averageSleepDurationMinutes)],
    [
      'Qualité sommeil',
      agg.averageSleepQuality !== null ? `${agg.averageSleepQuality} / 5` : '—',
    ],
    [
      'Réveils nocturnes',
      agg.nightWakingsAverage !== null ? `${agg.nightWakingsAverage} / nuit` : '—',
    ],
    [
      'Score repas',
      agg.averageMealsScore !== null ? `${agg.averageMealsScore} / 5` : '—',
    ],
    [
      'Bien-être',
      agg.averageWellbeing !== null ? `${agg.averageWellbeing} / 5` : '—',
    ],
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="px-4 sm:px-5 py-3 border-b border-gray-100"
          style={{ backgroundColor: 'rgba(217, 119, 6, 0.06)' }}
        >
          <h3
            className="text-sm sm:text-base font-bold"
            style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
          >
            Synthèse
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{rangeLabel}</p>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {stats.map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-gray-100 p-3"
                style={{ backgroundColor: '#fdf9f4' }}
              >
                <div className="text-[11px] text-gray-500">{label}</div>
                <div className="text-base sm:text-lg font-bold mt-0.5" style={{ color: '#015c5c' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Wellbeing 30j */}
          <div>
            <h4
              className="text-xs sm:text-sm font-semibold mb-2"
              style={{ color: '#78350f' }}
            >
              Bien-être — 30 derniers jours
            </h4>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${LINE_W} ${LINE_H}`}
                className="w-full h-32 sm:h-36"
                role="img"
                aria-label="Graphique du score de bien-être sur 30 jours"
              >
                {/* Grid + axes */}
                {[1, 2, 3, 4, 5].map((s) => {
                  const y = yFor(s)!;
                  return (
                    <g key={s}>
                      <line
                        x1={LINE_PAD.left}
                        y1={y}
                        x2={LINE_W - LINE_PAD.right}
                        y2={y}
                        stroke="#f3f4f6"
                        strokeDasharray={s % 2 === 0 ? '2 3' : ''}
                      />
                      <text
                        x={LINE_PAD.left - 6}
                        y={y + 3}
                        fontSize="9"
                        textAnchor="end"
                        fill="#9ca3af"
                      >
                        {s}
                      </text>
                    </g>
                  );
                })}
                {/* Path (peut avoir plusieurs segments si saisies discontinues) */}
                {pathSegments.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {/* Points */}
                {series.map((p, i) => {
                  const y = yFor(p.score);
                  if (y === null) return null;
                  const x = LINE_PAD.left + i * xStep;
                  return (
                    <circle
                      key={p.date}
                      cx={x}
                      cy={y}
                      r={2.5}
                      fill="#d97706"
                      stroke="#fff"
                      strokeWidth={1}
                    >
                      <title>{`${new Date(p.date).toLocaleDateString('fr-FR')} — ${p.score} / 5`}</title>
                    </circle>
                  );
                })}
                {/* Repères dates extrêmes */}
                <text
                  x={LINE_PAD.left}
                  y={LINE_H - 4}
                  fontSize="9"
                  fill="#9ca3af"
                  textAnchor="start"
                >
                  J-29
                </text>
                <text
                  x={LINE_W - LINE_PAD.right}
                  y={LINE_H - 4}
                  fontSize="9"
                  fill="#9ca3af"
                  textAnchor="end"
                >
                  Aujourd&apos;hui
                </text>
              </svg>
            </div>
            {agg.averageWellbeing === null && (
              <p className="text-[11px] text-gray-500">
                Pas encore assez de données pour tracer la tendance.
              </p>
            )}
          </div>

          {/* Distribution des émotions */}
          <div>
            <h4
              className="text-xs sm:text-sm font-semibold mb-2"
              style={{ color: '#78350f' }}
            >
              Distribution des émotions
            </h4>
            {totalEmotions === 0 ? (
              <p className="text-[11px] sm:text-xs text-gray-500">
                Aucune émotion enregistrée sur la période.
              </p>
            ) : (
              <div className="space-y-2">
                {EMOTIONS.map((e) => {
                  const count = agg.emotionDistribution[e];
                  if (count === 0) return null;
                  const pct = Math.round((count / totalEmotions) * 100);
                  return (
                    <div key={e} className="flex items-center gap-2">
                      <div className="w-20 sm:w-24 text-xs text-gray-700">{EMOTION_LABELS[e]}</div>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: EMOTION_COLORS[e] }}
                        />
                      </div>
                      <div className="w-16 text-right text-xs text-gray-600">
                        {count} · {pct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comportements (barres verticales) */}
          <div>
            <h4
              className="text-xs sm:text-sm font-semibold mb-2"
              style={{ color: '#78350f' }}
            >
              Fréquence des comportements
            </h4>
            {maxBehavior === 0 ? (
              <p className="text-[11px] sm:text-xs text-gray-500">
                Aucun comportement renseigné sur la période.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="flex items-end gap-2 min-h-[120px] h-[140px]">
                  {BEHAVIOR_TAGS.filter((b) => agg.behaviorFrequency[b] > 0).map((b) => {
                    const count = agg.behaviorFrequency[b];
                    const pct = Math.round((count / maxBehavior) * 100);
                    return (
                      <div key={b} className="flex flex-col items-center gap-1 flex-1 min-w-[50px]">
                        <div className="text-[10px] text-gray-600 font-semibold">{count}</div>
                        <div
                          className="w-full rounded-t-md transition"
                          style={{
                            height: `${Math.max(8, pct)}%`,
                            backgroundColor: '#7c3aed',
                            minHeight: 8,
                          }}
                          title={`${BEHAVIOR_TAG_LABELS[b]} : ${count}`}
                        />
                        <div className="text-[10px] text-gray-700 text-center leading-tight line-clamp-2 min-h-[1.5rem]">
                          {BEHAVIOR_TAG_LABELS[b]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
