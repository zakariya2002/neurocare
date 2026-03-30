'use client';

import { useState } from 'react';
import type { WorkLocation, LocationType } from '@/types/scheduling';
import { LOCATION_TYPE_LABELS, LOCATION_COLORS } from '@/types/scheduling';

interface LocationManagerProps {
  locations: WorkLocation[];
  saving: boolean;
  onAdd: (data: Omit<WorkLocation, 'id' | 'educator_id' | 'created_at' | 'updated_at' | 'is_active'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<WorkLocation>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function LocationManager({ locations, saving, onAdd, onUpdate, onDelete }: LocationManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('office');
  const [address, setAddress] = useState('');
  const [color, setColor] = useState<string>(LOCATION_COLORS[0]);
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setName('');
    setLocationType('office');
    setAddress('');
    setColor(LOCATION_COLORS[0]);
    setIsDefault(false);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (loc: WorkLocation) => {
    setName(loc.name);
    setLocationType(loc.location_type);
    setAddress(loc.address || '');
    setColor(loc.color);
    setIsDefault(loc.is_default);
    setEditingId(loc.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      location_type: locationType,
      address: locationType === 'online' ? null : address.trim() || null,
      color,
      is_default: isDefault,
    };

    if (editingId) {
      await onUpdate(editingId, data);
    } else {
      await onAdd(data as any);
    }
    resetForm();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📍</span>
          <div>
            <h3 className="font-semibold text-gray-900">Mes lieux de travail</h3>
            <p className="text-sm text-gray-500">{locations.length} lieu{locations.length !== 1 ? 'x' : ''} enregistre{locations.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {/* Locations list */}
          <div className="space-y-2 mt-4">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border-l-4"
                style={{ borderLeftColor: loc.color }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: loc.color }} />
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {loc.name}
                      {loc.is_default && <span className="ml-2 text-xs px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">Par defaut</span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {LOCATION_TYPE_LABELS[loc.location_type]}
                      {loc.address && ` - ${loc.address}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(loc)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    title="Modifier"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(loc.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add/edit form */}
          {showForm ? (
            <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Cabinet Paris 11e"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as LocationType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {Object.entries(LOCATION_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {locationType !== 'online' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Adresse complete"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                <div className="flex gap-2">
                  {LOCATION_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                        color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c, outlineColor: c }}
                    >
                      {color === c && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                Lieu par defaut
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  {editingId ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 w-full py-2.5 text-sm font-medium border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-teal-400 hover:text-teal-600 transition-colors"
            >
              + Ajouter un lieu de travail
            </button>
          )}
        </div>
      )}
    </div>
  );
}
