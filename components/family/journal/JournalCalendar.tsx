'use client';

import { useMemo } from 'react';
import {
  buildMonthGrid,
  frenchMonthLabel,
  isoDate,
  wellbeingLabel,
  type ChildDailyLogRow,
} from '@/lib/family/journal';

interface Props {
  monthStart: Date;
  logs: ReadonlyArray<ChildDailyLogRow>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (iso: string) => void;
  selectedDate: string;
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Palette dédiée B1 — vert (excellente) → ambre (moyenne) → rouge (très difficile).
 * On évite la fonction `wellbeingColor` du lib (interdiction d'éditer le lib pour
 * cette feature) afin de garder le ton chaleureux propre au journal.
 */
function heatmapColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#ffffff';
  switch (score) {
    case 1:
      return '#fecaca'; // rouge clair
    case 2:
      return '#fed7aa'; // ambre clair
    case 3:
      return '#fef3c7'; // jaune doux
    case 4:
      return '#bbf7d0'; // vert clair
    case 5:
      return '#86efac'; // vert
    default:
      return '#ffffff';
  }
}

const LEGEND: Array<{ score: number; color: string; label: string }> = [
  { score: 1, color: '#ef4444', label: 'Très difficile' },
  { score: 2, color: '#f59e0b', label: 'Difficile' },
  { score: 3, color: '#facc15', label: 'Moyenne' },
  { score: 4, color: '#10b981', label: 'Bonne' },
  { score: 5, color: '#059669', label: 'Excellente' },
];

export default function JournalCalendar({
  monthStart,
  logs,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  selectedDate,
}: Props) {
  const logsByDate = useMemo(() => {
    const map = new Map<string, ChildDailyLogRow>();
    for (const l of logs) map.set(l.log_date, l);
    return map;
  }, [logs]);

  const cells = useMemo(() => buildMonthGrid(monthStart, logsByDate), [monthStart, logsByDate]);

  const today = isoDate(new Date());

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 sm:px-5 pt-4 pb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-amber-50 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-300"
          aria-label="Mois précédent"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3
          className="text-sm sm:text-base font-bold capitalize"
          style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
        >
          {frenchMonthLabel(monthStart)}
        </h3>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-amber-50 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-300"
          aria-label="Mois suivant"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="px-4 sm:px-5 pb-4">
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {WEEKDAYS.map((d, i) => (
            <div
              key={i}
              className="text-[10px] sm:text-xs text-center font-semibold"
              style={{ color: i >= 5 ? '#d97706' : '#6b7280' }}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const isSelected = cell.date === selectedDate;
            const isToday = cell.date === today;
            const score = cell.log?.wellbeing_score ?? null;
            const dow = new Date(`${cell.date}T00:00:00`).getDay(); // 0=Dim, 6=Sam
            const isWeekend = dow === 0 || dow === 6;
            const bg = cell.log
              ? heatmapColor(score)
              : cell.inMonth
                ? isWeekend
                  ? '#fafafa'
                  : '#ffffff'
                : '#f9fafb';
            const dayNum = Number(cell.date.slice(8, 10));
            const tooltip = `${new Date(cell.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} — ${wellbeingLabel(score)}`;
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => onSelectDate(cell.date)}
                title={tooltip}
                className={`relative aspect-square rounded-md text-xs sm:text-sm transition transform hover:scale-110 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:z-10 ${
                  cell.inMonth ? 'text-gray-900' : 'text-gray-300'
                }`}
                style={{
                  backgroundColor: bg,
                  borderWidth: isSelected ? 2 : isToday ? 2 : 1,
                  borderStyle: 'solid',
                  borderColor: isSelected
                    ? '#027e7e'
                    : isToday
                      ? '#d97706'
                      : '#e5e7eb',
                }}
                aria-label={tooltip}
                aria-current={isToday ? 'date' : undefined}
              >
                <span className="absolute top-0.5 left-1 text-[10px] sm:text-xs font-semibold">
                  {dayNum}
                </span>
                {cell.log && (
                  <span
                    className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#027e7e' }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {LEGEND.map((l) => (
            <div key={l.score} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-sm border"
                style={{ backgroundColor: heatmapColor(l.score), borderColor: l.color }}
                aria-hidden="true"
              />
              <span className="text-[11px] text-gray-600">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
