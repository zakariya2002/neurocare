'use client';

import type { AvailabilitySlot } from '@/types/scheduling';

interface SlotBlockProps {
  slot: AvailabilitySlot;
  hourHeight: number;
  startHour: number;
  onClick: (slot: AvailabilitySlot) => void;
}

export default function SlotBlock({ slot, hourHeight, startHour, onClick }: SlotBlockProps) {
  const [startH, startM] = slot.start_time.split(':').map(Number);
  const [endH, endM] = slot.end_time.split(':').map(Number);

  const topOffset = ((startH - startHour) + startM / 60) * hourHeight;
  const height = ((endH - startH) + (endM - startM) / 60) * hourHeight;

  const color = slot.work_location?.color || '#9ca3af';
  const locationName = slot.work_location?.name || slot.ad_hoc_location_name || '';

  return (
    <button
      onClick={() => onClick(slot)}
      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left transition-opacity hover:opacity-80 overflow-hidden cursor-pointer border-0"
      style={{
        top: `${topOffset}px`,
        height: `${Math.max(height, 20)}px`,
        backgroundColor: `${color}20`,
        borderLeft: `3px solid ${color}`,
      }}
      title={`${slot.start_time} - ${slot.end_time}${locationName ? ` | ${locationName}` : ''}`}
    >
      <div className="text-xs font-medium truncate" style={{ color }}>
        {slot.start_time} - {slot.end_time}
      </div>
      {height >= 40 && locationName && (
        <div className="text-xs truncate text-gray-500">
          {locationName}
        </div>
      )}
      {!slot.is_available && (
        <div className="text-xs text-red-500 font-medium">Indisponible</div>
      )}
    </button>
  );
}
