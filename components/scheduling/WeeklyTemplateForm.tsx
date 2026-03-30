'use client';

import { useState } from 'react';
import type { WorkLocation, LocationRef } from '@/types/scheduling';
import LocationPicker from './LocationPicker';

interface WeeklyDaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface WeeklyTemplateFormProps {
  locations: WorkLocation[];
  saving: boolean;
  onApply: (schedule: Record<number, WeeklyDaySchedule>, monthStr: string, locationRef: LocationRef) => Promise<void>;
}

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lundi', short: 'Lun' },
  { id: 2, name: 'Mardi', short: 'Mar' },
  { id: 3, name: 'Mercredi', short: 'Mer' },
  { id: 4, name: 'Jeudi', short: 'Jeu' },
  { id: 5, name: 'Vendredi', short: 'Ven' },
  { id: 6, name: 'Samedi', short: 'Sam' },
  { id: 0, name: 'Dimanche', short: 'Dim' },
];

export default function WeeklyTemplateForm({ locations, saving, onApply }: WeeklyTemplateFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [locationRef, setLocationRef] = useState<LocationRef>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [schedule, setSchedule] = useState<Record<number, WeeklyDaySchedule>>({
    1: { enabled: true, start: '09:00', end: '17:00' },
    2: { enabled: true, start: '09:00', end: '17:00' },
    3: { enabled: true, start: '09:00', end: '17:00' },
    4: { enabled: true, start: '09:00', end: '17:00' },
    5: { enabled: true, start: '09:00', end: '17:00' },
    6: { enabled: false, start: '09:00', end: '17:00' },
    0: { enabled: false, start: '09:00', end: '17:00' },
  });

  const handleApply = async () => {
    await onApply(schedule, selectedMonth, locationRef);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📅</span>
          <div>
            <h3 className="font-semibold text-gray-900">Planning hebdomadaire</h3>
            <p className="text-sm text-gray-500">Appliquer un modele de semaine type sur un mois</p>
          </div>
        </div>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {/* Days schedule */}
          <div className="mt-4 space-y-2">
            {DAYS_OF_WEEK.map((day) => {
              const daySchedule = schedule[day.id];
              return (
                <div key={day.id} className="flex items-center gap-3 py-2">
                  <label className="flex items-center gap-2 w-28 text-sm">
                    <input
                      type="checkbox"
                      checked={daySchedule.enabled}
                      onChange={(e) => setSchedule({ ...schedule, [day.id]: { ...daySchedule, enabled: e.target.checked } })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className={daySchedule.enabled ? 'font-medium text-gray-900' : 'text-gray-400'}>{day.name}</span>
                  </label>

                  {daySchedule.enabled && (
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="time"
                        value={daySchedule.start}
                        onChange={(e) => setSchedule({ ...schedule, [day.id]: { ...daySchedule, start: e.target.value } })}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <span className="text-gray-400">→</span>
                      <input
                        type="time"
                        value={daySchedule.end}
                        onChange={(e) => setSchedule({ ...schedule, [day.id]: { ...daySchedule, end: e.target.value } })}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Location picker for the template */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Lieu pour ces creneaux</label>
            <LocationPicker
              locations={locations}
              value={locationRef}
              onChange={setLocationRef}
              compact
            />
          </div>

          {/* Month selector + apply button */}
          <div className="mt-4 flex items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mois cible</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleApply}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: '#027e7e' }}
            >
              {saving ? 'Application...' : 'Appliquer le planning'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
