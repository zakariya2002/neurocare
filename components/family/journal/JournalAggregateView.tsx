'use client';

import { useMemo } from 'react';
import {
  EMOTIONS,
  EMOTION_COLORS,
  EMOTION_LABELS,
  BEHAVIOR_TAGS,
  BEHAVIOR_TAG_LABELS,
  aggregateLogs,
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

export default function JournalAggregateView({ logs, rangeLabel }: Props) {
  const agg = useMemo(() => aggregateLogs(logs), [logs]);

  const totalEmotions = useMemo(
    () => Object.values(agg.emotionDistribution).reduce((a, b) => a + b, 0),
    [agg.emotionDistribution]
  );

  const maxBehavior = useMemo(
    () => Math.max(0, ...Object.values(agg.behaviorFrequency)),
    [agg.behaviorFrequency]
  );

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
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Synthèse</h3>
        <p className="text-xs text-gray-500">{rangeLabel}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-gray-200 p-3"
            style={{ backgroundColor: '#fdf9f4' }}
          >
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-base font-semibold text-gray-900 mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Distribution des émotions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Distribution des émotions</h4>
        {totalEmotions === 0 ? (
          <p className="text-xs text-gray-500">Aucune émotion enregistrée sur la période.</p>
        ) : (
          <div className="space-y-2">
            {EMOTIONS.map((e) => {
              const count = agg.emotionDistribution[e];
              if (count === 0) return null;
              const pct = Math.round((count / totalEmotions) * 100);
              return (
                <div key={e} className="flex items-center gap-2">
                  <div className="w-20 text-xs text-gray-700">{EMOTION_LABELS[e]}</div>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full"
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

      {/* Comportements */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Fréquence des comportements</h4>
        {maxBehavior === 0 ? (
          <p className="text-xs text-gray-500">Aucun comportement renseigné sur la période.</p>
        ) : (
          <div className="space-y-2">
            {BEHAVIOR_TAGS.filter((b) => agg.behaviorFrequency[b] > 0).map((b) => {
              const count = agg.behaviorFrequency[b];
              const pct = Math.round((count / maxBehavior) * 100);
              return (
                <div key={b} className="flex items-center gap-2">
                  <div className="w-32 text-xs text-gray-700 truncate">
                    {BEHAVIOR_TAG_LABELS[b]}
                  </div>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{ width: `${pct}%`, backgroundColor: '#027e7e' }}
                    />
                  </div>
                  <div className="w-10 text-right text-xs text-gray-600">{count}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
