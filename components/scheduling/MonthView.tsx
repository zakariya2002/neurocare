'use client';

import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AvailabilitySlot, VacationException, Appointment, SlotFormData } from '@/types/scheduling';

interface MonthViewProps {
  currentMonth: Date;
  slots: AvailabilitySlot[];
  appointments: Appointment[];
  exceptions: VacationException[];
  onNavigate: (direction: -1 | 1) => void;
  onDateClick: (dateStr: string) => void;
  selectedDate: string | null;
  onSlotClick: (slot: AvailabilitySlot) => void;
  onDeleteSlot: (id: string) => Promise<void>;
  onAddSlot: (data: SlotFormData) => Promise<void>;
  onUpdateSlot: (id: string, fields: Partial<AvailabilitySlot>) => Promise<void>;
  saving: boolean;
}

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function MonthView({
  currentMonth,
  slots,
  appointments,
  exceptions,
  onNavigate,
  onDateClick,
  selectedDate,
  onSlotClick,
  onDeleteSlot,
  onAddSlot,
  onUpdateSlot,
  saving,
}: MonthViewProps) {
  const [inlineStart, setInlineStart] = useState('09:00');
  const [inlineEnd, setInlineEnd] = useState('17:00');
  const [editingInlineId, setEditingInlineId] = useState<string | null>(null);
  const vacationDates = useMemo(() => {
    const set = new Set<string>();
    exceptions.forEach((exc) => {
      if (exc.exception_type === 'vacation' && !exc.start_time) {
        set.add(exc.date);
      }
    });
    return set;
  }, [exceptions]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const selectedDateSlots = useMemo(() => {
    if (!selectedDate) return [];
    return slots.filter((s) => s.availability_date === selectedDate);
  }, [selectedDate, slots]);

  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return appointments.filter((a) => a.appointment_date === selectedDate);
  }, [selectedDate, appointments]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={() => onNavigate(-1)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3>
        <button onClick={() => onNavigate(1)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const isSelected = selectedDate === dateStr;
          const isVacation = vacationDates.has(dateStr);
          const daySlots = slots.filter((s) => s.availability_date === dateStr);
          const dayAppointments = appointments.filter((a) => a.appointment_date === dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onDateClick(dateStr)}
              className={`relative p-2 min-h-[72px] border-b border-r border-gray-50 text-left transition-colors
                ${!inMonth ? 'opacity-30' : ''}
                ${isSelected ? 'bg-teal-50 ring-2 ring-inset ring-teal-300' : 'hover:bg-gray-50'}
                ${isVacation && inMonth ? 'bg-red-50' : ''}
              `}
            >
              <div className={`text-sm font-medium mb-1 ${today ? 'text-white bg-teal-600 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>

              {/* Slot dots */}
              {daySlots.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {daySlots.slice(0, 4).map((slot) => (
                    <div
                      key={slot.id}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: slot.work_location?.color || '#9ca3af' }}
                    />
                  ))}
                  {daySlots.length > 4 && (
                    <span className="text-xs text-gray-400">+{daySlots.length - 4}</span>
                  )}
                </div>
              )}

              {/* Appointment count */}
              {dayAppointments.length > 0 && (
                <div className="text-xs text-indigo-600 font-medium mt-0.5">
                  {dayAppointments.length} RDV
                </div>
              )}

              {isVacation && inMonth && (
                <div className="text-xs text-red-500 font-medium">Vac.</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date detail */}
      {selectedDate && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 capitalize">
            {format(new Date(selectedDate + 'T00:00:00'), 'EEEE d MMMM', { locale: fr })}
            {vacationDates.has(selectedDate) && <span className="ml-2 text-red-500 text-xs font-medium">Vacances</span>}
          </h4>

          {/* Appointments (read-only) */}
          {selectedDateAppointments.length > 0 && (
            <div className="space-y-2 mb-3">
              {selectedDateAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center p-2 rounded-lg bg-indigo-50 border-l-4 border-indigo-400">
                  <div>
                    <span className="text-sm font-medium text-indigo-900">{appt.start_time} - {appt.end_time}</span>
                    {appt.family && (
                      <span className="ml-2 text-xs text-indigo-600">
                        RDV: {appt.family.first_name} {appt.family.last_name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Existing slots: show inline edit per slot */}
          {selectedDateSlots.length > 0 && (
            <div className="space-y-2 mb-3">
              {selectedDateSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-3 rounded-lg bg-gray-50 border-l-4"
                  style={{ borderLeftColor: slot.work_location?.color || '#9ca3af' }}
                >
                  {editingInlineId === slot.id ? (
                    /* Inline edit mode */
                    <div className="flex items-end gap-2 flex-wrap">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Debut</label>
                        <input
                          type="time"
                          value={inlineStart}
                          onChange={(e) => setInlineStart(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent w-28"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Fin</label>
                        <input
                          type="time"
                          value={inlineEnd}
                          onChange={(e) => setInlineEnd(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent w-28"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          if (inlineStart < inlineEnd) {
                            await onUpdateSlot(slot.id, { start_time: inlineStart, end_time: inlineEnd });
                            setEditingInlineId(null);
                          }
                        }}
                        disabled={saving || inlineStart >= inlineEnd}
                        className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                        style={{ backgroundColor: '#027e7e' }}
                      >
                        {saving ? '...' : 'Enregistrer'}
                      </button>
                      <button
                        onClick={() => setEditingInlineId(null)}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setEditingInlineId(slot.id);
                          setInlineStart(slot.start_time);
                          setInlineEnd(slot.end_time);
                        }}
                      >
                        <span className="text-sm font-medium text-gray-900">{slot.start_time} - {slot.end_time}</span>
                        {(slot.work_location?.name || slot.ad_hoc_location_name) && (
                          <span className="ml-2 text-xs text-gray-500">
                            {slot.work_location?.name || slot.ad_hoc_location_name}
                          </span>
                        )}
                        {!slot.is_available && <span className="ml-2 text-xs text-red-500">Indisponible</span>}
                        <span className="ml-2 text-xs text-teal-600 hover:underline">Modifier</span>
                      </div>
                      <button
                        onClick={() => onDeleteSlot(slot.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inline add form - only when NO slots exist for this date */}
          {!vacationDates.has(selectedDate) && selectedDateSlots.length === 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Ajouter des heures de travail</p>
              <div className="flex items-end gap-2 flex-wrap">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Debut</label>
                  <input
                    type="time"
                    value={inlineStart}
                    onChange={(e) => setInlineStart(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent w-28"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fin</label>
                  <input
                    type="time"
                    value={inlineEnd}
                    onChange={(e) => setInlineEnd(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent w-28"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (selectedDate && inlineStart < inlineEnd) {
                      await onAddSlot({ date: selectedDate, startTime: inlineStart, endTime: inlineEnd, locationRef: null });
                    }
                  }}
                  disabled={saving || inlineStart >= inlineEnd}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  {saving ? '...' : 'Ajouter'}
                </button>
              </div>
              {inlineStart >= inlineEnd && inlineStart && inlineEnd && (
                <p className="text-xs text-red-500 mt-1">L&apos;heure de fin doit etre apres le debut</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
