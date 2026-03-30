'use client';

import { useMemo } from 'react';
import { format, addDays, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AvailabilitySlot, VacationException, Appointment } from '@/types/scheduling';
import SlotBlock from './SlotBlock';

interface WeekViewProps {
  currentWeekStart: Date;
  slots: AvailabilitySlot[];
  appointments: Appointment[];
  exceptions: VacationException[];
  onNavigate: (direction: -1 | 1) => void;
  onSlotClick: (slot: AvailabilitySlot) => void;
  onEmptyCellClick: (date: string, hour: number) => void;
  onTodayClick: () => void;
}

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 56;

export default function WeekView({
  currentWeekStart,
  slots,
  appointments,
  exceptions,
  onNavigate,
  onSlotClick,
  onEmptyCellClick,
  onTodayClick,
}: WeekViewProps) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i),
    []
  );

  const vacationDates = useMemo(() => {
    const set = new Set<string>();
    exceptions.forEach((exc) => {
      if (exc.exception_type === 'vacation' && !exc.start_time) {
        set.add(exc.date);
      }
    });
    return set;
  }, [exceptions]);

  const weekLabel = useMemo(() => {
    const start = format(currentWeekStart, 'd MMMM', { locale: fr });
    const end = format(addDays(currentWeekStart, 6), 'd MMMM yyyy', { locale: fr });
    return `${start} - ${end}`;
  }, [currentWeekStart]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => onNavigate(-1)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900 capitalize">{weekLabel}</h3>
          <button
            onClick={onTodayClick}
            className="px-3 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Aujourd&apos;hui
          </button>
        </div>

        <button
          onClick={() => onNavigate(1)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-100">
            <div className="p-2" />
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isVacation = vacationDates.has(dateStr);
              const today = isToday(day);

              return (
                <div
                  key={dateStr}
                  className={`text-center py-2 border-l border-gray-100 ${today ? 'bg-teal-50' : ''} ${isVacation ? 'bg-red-50' : ''}`}
                >
                  <div className={`text-xs uppercase tracking-wide ${today ? 'text-teal-700 font-bold' : 'text-gray-500'}`}>
                    {format(day, 'EEE', { locale: fr })}
                  </div>
                  <div className={`text-lg font-semibold ${today ? 'text-teal-700' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </div>
                  {isVacation && (
                    <div className="text-xs text-red-500 font-medium">Vacances</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
            {/* Hours column */}
            <div className="sticky left-0 z-10 bg-white">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex items-start justify-end pr-2 text-xs text-gray-400 font-medium border-b border-gray-50"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="-mt-2">{String(hour).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isVacation = vacationDates.has(dateStr);
              const today = isToday(day);

              const daySlots = slots.filter((s) => s.availability_date === dateStr);
              const dayAppointments = appointments.filter((a) => a.appointment_date === dateStr);

              return (
                <div
                  key={dateStr}
                  className={`relative border-l border-gray-100 ${today ? 'bg-teal-50/30' : ''} ${isVacation ? 'bg-red-50/40' : ''}`}
                  style={{ height: `${hours.length * HOUR_HEIGHT}px` }}
                >
                  {/* Hour grid lines */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      onClick={() => !isVacation && onEmptyCellClick(dateStr, hour)}
                      className={`absolute w-full border-b border-gray-50 ${!isVacation ? 'cursor-pointer hover:bg-gray-50/50' : ''}`}
                      style={{
                        top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
                        height: `${HOUR_HEIGHT}px`,
                      }}
                    />
                  ))}

                  {/* Availability slots */}
                  {daySlots.map((slot) => (
                    <SlotBlock
                      key={slot.id}
                      slot={slot}
                      hourHeight={HOUR_HEIGHT}
                      startHour={START_HOUR}
                      onClick={onSlotClick}
                    />
                  ))}

                  {/* Appointments overlay */}
                  {dayAppointments.map((appt) => {
                    const [aStartH, aStartM] = appt.start_time.split(':').map(Number);
                    const [aEndH, aEndM] = appt.end_time.split(':').map(Number);
                    const topOffset = ((aStartH - START_HOUR) + aStartM / 60) * HOUR_HEIGHT;
                    const height = ((aEndH - aStartH) + (aEndM - aStartM) / 60) * HOUR_HEIGHT;

                    return (
                      <div
                        key={appt.id}
                        className="absolute left-1 right-1 rounded-md px-1.5 py-0.5 pointer-events-none overflow-hidden"
                        style={{
                          top: `${topOffset}px`,
                          height: `${Math.max(height, 20)}px`,
                          backgroundColor: 'rgba(99, 102, 241, 0.15)',
                          borderLeft: '3px solid #6366f1',
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(99, 102, 241, 0.08) 4px, rgba(99, 102, 241, 0.08) 8px)',
                        }}
                      >
                        <div className="text-xs font-medium text-indigo-700 truncate">
                          {appt.start_time} - {appt.end_time}
                        </div>
                        {height >= 40 && appt.family && (
                          <div className="text-xs text-indigo-500 truncate">
                            {appt.family.first_name} {appt.family.last_name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
