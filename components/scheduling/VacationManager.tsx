'use client';

import { useState, useMemo } from 'react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { VacationException, VacationPeriod } from '@/types/scheduling';

interface VacationManagerProps {
  exceptions: VacationException[];
  saving: boolean;
  onAddVacation: (startDate: string, endDate: string, reason: string) => Promise<void>;
  onDeleteVacation: (ids: string[]) => Promise<void>;
}

export default function VacationManager({ exceptions, saving, onAddVacation, onDeleteVacation }: VacationManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Group contiguous vacation dates with same reason into periods
  const vacationPeriods = useMemo(() => {
    const vacations = exceptions
      .filter((e) => e.exception_type === 'vacation')
      .sort((a, b) => a.date.localeCompare(b.date));

    if (vacations.length === 0) return [];

    const periods: VacationPeriod[] = [];
    let currentPeriod: VacationPeriod = {
      startDate: vacations[0].date,
      endDate: vacations[0].date,
      reason: vacations[0].reason || 'Vacances',
      exceptionIds: [vacations[0].id],
    };

    for (let i = 1; i < vacations.length; i++) {
      const prev = vacations[i - 1];
      const curr = vacations[i];
      const daysDiff = differenceInCalendarDays(parseISO(curr.date), parseISO(prev.date));
      const sameReason = (curr.reason || 'Vacances') === (prev.reason || 'Vacances');

      if (daysDiff <= 1 && sameReason) {
        currentPeriod.endDate = curr.date;
        currentPeriod.exceptionIds.push(curr.id);
      } else {
        periods.push(currentPeriod);
        currentPeriod = {
          startDate: curr.date,
          endDate: curr.date,
          reason: curr.reason || 'Vacances',
          exceptionIds: [curr.id],
        };
      }
    }
    periods.push(currentPeriod);

    return periods;
  }, [exceptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    if (startDate > endDate) return;

    await onAddVacation(startDate, endDate, reason || 'Vacances');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🏖️</span>
          <div>
            <h3 className="font-semibold text-gray-900">Periodes de vacances</h3>
            <p className="text-sm text-gray-500">
              {vacationPeriods.length} periode{vacationPeriods.length !== 1 ? 's' : ''} planifiee{vacationPeriods.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {/* Add vacation form */}
          <form onSubmit={handleSubmit} className="mt-4 p-4 bg-red-50/50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Debut</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); if (!endDate || e.target.value > endDate) setEndDate(e.target.value); }}
                  min={today}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raison (optionnel)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ex: Vacances d'ete"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !startDate || !endDate || startDate > endDate}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Enregistrement...' : 'Bloquer cette periode'}
            </button>
          </form>

          {/* Vacation periods list */}
          {vacationPeriods.length > 0 && (
            <div className="mt-4 space-y-2">
              {vacationPeriods.map((period, idx) => {
                const startLabel = format(parseISO(period.startDate), 'd MMM yyyy', { locale: fr });
                const endLabel = format(parseISO(period.endDate), 'd MMM yyyy', { locale: fr });
                const isSingleDay = period.startDate === period.endDate;

                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border-l-4 border-red-400">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {isSingleDay ? startLabel : `${startLabel} → ${endLabel}`}
                      </div>
                      <div className="text-xs text-gray-500">{period.reason}</div>
                    </div>
                    <button
                      onClick={() => onDeleteVacation(period.exceptionIds)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
