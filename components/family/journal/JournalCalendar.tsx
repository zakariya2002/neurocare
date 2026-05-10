'use client';

import { useMemo } from 'react';
import {
  buildMonthGrid,
  frenchMonthLabel,
  isoDate,
  wellbeingColor,
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
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          aria-label="Mois précédent"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
          {frenchMonthLabel(monthStart)}
        </h3>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          aria-label="Mois suivant"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-xs text-center text-gray-500 font-medium">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const isSelected = cell.date === selectedDate;
          const isToday = cell.date === today;
          const score = cell.log?.wellbeing_score ?? null;
          const bg = cell.log
            ? wellbeingColor(score)
            : cell.inMonth ? '#ffffff' : '#f9fafb';
          const dayNum = Number(cell.date.slice(8, 10));
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={`relative aspect-square rounded-lg text-xs sm:text-sm transition border ${
                isSelected ? 'border-2' : 'border'
              } ${
                cell.inMonth ? 'text-gray-900' : 'text-gray-400'
              } hover:scale-105`}
              style={{
                backgroundColor: bg,
                borderColor: isSelected ? '#027e7e' : isToday ? '#3a9e9e' : '#e5e7eb',
              }}
              aria-label={`${cell.date} — ${wellbeingLabel(score)}`}
            >
              <span className="absolute top-1 left-1 text-xs font-medium">{dayNum}</span>
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

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: wellbeingColor(s) }}
              aria-hidden="true"
            />
            <span>{wellbeingLabel(s)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
