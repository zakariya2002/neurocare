'use client';

import AddressAutocomplete from '@/components/AddressAutocomplete';
import {
  AnnouncementFormData,
  PLACE_OPTIONS,
  SCHEDULE_OPTIONS,
} from './types';

interface StepLocationScheduleProps {
  data: AnnouncementFormData;
  onChange: (patch: Partial<AnnouncementFormData>) => void;
  errors: Record<string, string>;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function StepLocationSchedule({ data, onChange, errors }: StepLocationScheduleProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
          Ville ou adresse <span className="text-red-500">*</span>
        </label>
        <AddressAutocomplete
          id="location"
          value={data.location_label}
          onChange={(val) => onChange({ location_label: val })}
          onSelect={(s) =>
            onChange({
              location_label: s.label,
              city: s.city,
              postal_code: s.postcode,
              latitude: s.latitude ?? null,
              longitude: s.longitude ?? null,
            })
          }
          placeholder="Ex: Lyon, 12 rue de la Paix Paris"
          className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base"
        />
        {errors.location_label && <p className="text-xs text-red-600 mt-1">{errors.location_label}</p>}
        {data.city && (
          <p className="text-xs text-gray-500 mt-1">
            Ville détectée : <span className="font-medium text-gray-700">{data.city} ({data.postal_code})</span>
          </p>
        )}
      </div>

      <div>
        <label htmlFor="radius" className="block text-sm font-semibold text-gray-700 mb-2">
          Rayon de recherche : <span style={{ color: '#027e7e' }}>{data.radius_km} km</span>
        </label>
        <input
          id="radius"
          type="range"
          min={1}
          max={100}
          step={1}
          value={data.radius_km}
          onChange={(e) => onChange({ radius_km: Number(e.target.value) })}
          className="w-full"
          style={{ accentColor: '#027e7e' }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 km</span>
          <span>100 km</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Lieu(x) d&apos;intervention <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PLACE_OPTIONS.map((opt) => {
            const selected = data.place_types.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                  selected ? 'border-transparent' : 'border-gray-200 hover:border-gray-300'
                }`}
                style={selected ? { backgroundColor: 'rgba(2, 126, 126, 0.1)', borderColor: '#027e7e' } : {}}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onChange({ place_types: toggle(data.place_types, opt.value) })}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: '#027e7e' }}
                />
                <span className="text-sm text-gray-700 font-medium">{opt.label}</span>
              </label>
            );
          })}
        </div>
        {errors.place_types && <p className="text-xs text-red-600 mt-2">{errors.place_types}</p>}
      </div>

      <div>
        <label htmlFor="hours" className="block text-sm font-semibold text-gray-700 mb-2">
          Volume horaire (par semaine)
        </label>
        <div className="flex items-center gap-2 max-w-xs">
          <input
            id="hours"
            type="number"
            min={0}
            step={0.5}
            value={data.hours_per_week ?? ''}
            onChange={(e) => onChange({ hours_per_week: e.target.value ? Number(e.target.value) : null })}
            placeholder="Ex: 3.5"
            className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base"
            style={{ '--tw-ring-color': '#027e7e', fontSize: '16px' } as any}
          />
          <span className="text-sm text-gray-500 whitespace-nowrap">h / semaine</span>
        </div>
        {errors.hours_per_week && <p className="text-xs text-red-600 mt-1">{errors.hours_per_week}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Préférences horaires
        </label>
        <p className="text-xs text-gray-500 mb-3">Choisissez les créneaux qui vous arrangent.</p>
        <div className="flex flex-wrap gap-2">
          {SCHEDULE_OPTIONS.map((opt) => {
            const selected = data.schedule_preferences.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({ schedule_preferences: toggle(data.schedule_preferences, opt.value) })
                }
                className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                  selected ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                }`}
                style={selected ? { backgroundColor: '#027e7e' } : {}}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-semibold text-gray-700 mb-2">
            Date de début souhaitée
          </label>
          <input
            id="start_date"
            type="date"
            value={data.start_date}
            onChange={(e) => onChange({ start_date: e.target.value })}
            className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base"
            style={{ '--tw-ring-color': '#027e7e', fontSize: '16px' } as any}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Flexibilité</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'immediate', label: 'Immédiat' },
              { value: 'flexible', label: 'Flexible' },
              { value: 'fixed', label: 'Date fixe' },
            ].map((opt) => {
              const selected = data.start_date_flexibility === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all text-sm ${
                    selected ? 'border-transparent' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={selected ? { backgroundColor: 'rgba(2, 126, 126, 0.1)', borderColor: '#027e7e' } : {}}
                >
                  <input
                    type="radio"
                    name="start_date_flexibility"
                    value={opt.value}
                    checked={selected}
                    onChange={() => onChange({ start_date_flexibility: opt.value as any })}
                    className="sr-only"
                  />
                  <span className="font-medium text-gray-700">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
