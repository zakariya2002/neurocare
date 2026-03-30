'use client';

import { useState } from 'react';
import type { WorkLocation, LocationRef } from '@/types/scheduling';

interface LocationPickerProps {
  locations: WorkLocation[];
  value: LocationRef;
  onChange: (ref: LocationRef) => void;
  compact?: boolean;
}

export default function LocationPicker({ locations, value, onChange, compact }: LocationPickerProps) {
  const [mode, setMode] = useState<'none' | 'saved' | 'adhoc'>(
    value?.type === 'saved' ? 'saved' : value?.type === 'adhoc' ? 'adhoc' : 'none'
  );

  const handleModeChange = (newMode: 'none' | 'saved' | 'adhoc') => {
    setMode(newMode);
    if (newMode === 'none') {
      onChange(null);
    } else if (newMode === 'saved' && locations.length > 0) {
      const defaultLoc = locations.find(l => l.is_default) || locations[0];
      onChange({ type: 'saved', locationId: defaultLoc.id });
    } else if (newMode === 'adhoc') {
      onChange({ type: 'adhoc', name: '', address: '' });
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div className={`flex gap-2 ${compact ? 'flex-wrap' : ''}`}>
        {(['none', 'saved', 'adhoc'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
              mode === m
                ? 'border-teal-600 bg-teal-50 text-teal-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {m === 'none' && 'Aucun lieu'}
            {m === 'saved' && 'Lieu enregistre'}
            {m === 'adhoc' && 'Lieu ponctuel'}
          </button>
        ))}
      </div>

      {/* Saved location dropdown */}
      {mode === 'saved' && locations.length > 0 && (
        <select
          value={value?.type === 'saved' ? value.locationId : ''}
          onChange={(e) => onChange({ type: 'saved', locationId: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} ({loc.location_type === 'online' ? 'En ligne' : loc.address || loc.location_type})
            </option>
          ))}
        </select>
      )}

      {mode === 'saved' && locations.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          Aucun lieu enregistre. Ajoutez-en dans la section &quot;Mes lieux de travail&quot;.
        </p>
      )}

      {/* Ad-hoc location fields */}
      {mode === 'adhoc' && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nom du lieu (ex: Domicile Dupont)"
            value={value?.type === 'adhoc' ? value.name : ''}
            onChange={(e) => onChange({ type: 'adhoc', name: e.target.value, address: value?.type === 'adhoc' ? value.address : '' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Adresse"
            value={value?.type === 'adhoc' ? value.address : ''}
            onChange={(e) => onChange({ type: 'adhoc', name: value?.type === 'adhoc' ? value.name : '', address: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      )}
    </div>
  );
}
