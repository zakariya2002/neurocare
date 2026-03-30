'use client';

import { useState, useEffect } from 'react';
import type { WorkLocation, AvailabilitySlot, LocationRef, SlotFormData } from '@/types/scheduling';
import LocationPicker from './LocationPicker';

interface SlotCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SlotFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  locations: WorkLocation[];
  prefillDate?: string;
  prefillStartTime?: string;
  prefillEndTime?: string;
  editingSlot?: AvailabilitySlot | null;
  saving: boolean;
}

export default function SlotCreationModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  locations,
  prefillDate,
  prefillStartTime,
  prefillEndTime,
  editingSlot,
  saving,
}: SlotCreationModalProps) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [locationRef, setLocationRef] = useState<LocationRef>(null);

  useEffect(() => {
    if (editingSlot) {
      setDate(editingSlot.availability_date);
      setStartTime(editingSlot.start_time);
      setEndTime(editingSlot.end_time);
      if (editingSlot.work_location_id) {
        setLocationRef({ type: 'saved', locationId: editingSlot.work_location_id });
      } else if (editingSlot.ad_hoc_location_name) {
        setLocationRef({ type: 'adhoc', name: editingSlot.ad_hoc_location_name, address: editingSlot.ad_hoc_location_address || '' });
      } else {
        setLocationRef(null);
      }
    } else {
      setDate(prefillDate || '');
      setStartTime(prefillStartTime || '09:00');
      setEndTime(prefillEndTime || '10:00');
      // Default to first saved location if available
      const defaultLoc = locations.find(l => l.is_default) || locations[0];
      if (defaultLoc) {
        setLocationRef({ type: 'saved', locationId: defaultLoc.id });
      } else {
        setLocationRef(null);
      }
    }
  }, [editingSlot, prefillDate, prefillStartTime, prefillEndTime, locations, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) return;
    if (startTime >= endTime) return;

    await onSave({ date, startTime, endTime, locationRef });
    onClose();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">
            {editingSlot ? 'Modifier le creneau' : 'Ajouter un creneau'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Debut</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {startTime >= endTime && startTime && endTime && (
            <p className="text-sm text-red-500">L&apos;heure de fin doit etre apres l&apos;heure de debut</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lieu</label>
            <LocationPicker
              locations={locations}
              value={locationRef}
              onChange={setLocationRef}
              compact
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || !date || startTime >= endTime}
              className="flex-1 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: '#027e7e' }}
            >
              {saving ? 'Enregistrement...' : editingSlot ? 'Modifier' : 'Ajouter'}
            </button>
            {editingSlot && onDelete && (
              <button
                type="button"
                onClick={() => { onDelete(editingSlot.id); onClose(); }}
                className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
              >
                Supprimer
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
