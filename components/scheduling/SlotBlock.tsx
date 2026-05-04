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

  const isBlocked = !slot.is_available;
  const color = isBlocked ? '#d97706' : (slot.work_location?.color || '#9ca3af');
  const locationName = slot.work_location?.name || slot.ad_hoc_location_name || '';
  const note = slot.internal_note;

  return (
    <button
      onClick={() => onClick(slot)}
      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left transition-opacity hover:opacity-80 overflow-hidden cursor-pointer border-0"
      style={{
        top: `${topOffset}px`,
        height: `${Math.max(height, 20)}px`,
        backgroundColor: isBlocked ? '#fef3c7' : `${color}20`,
        borderLeft: `3px solid ${color}`,
        backgroundImage: isBlocked
          ? 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(217, 119, 6, 0.08) 6px, rgba(217, 119, 6, 0.08) 12px)'
          : undefined,
      }}
      title={isBlocked ? `Bloqué : ${note || 'RDV externe'}` : `${slot.start_time} - ${slot.end_time}${locationName ? ` | ${locationName}` : ''}`}
    >
      <div className="text-xs font-medium truncate" style={{ color }}>
        {slot.start_time} - {slot.end_time}
      </div>
      {isBlocked ? (
        <div className="text-xs truncate" style={{ color }}>
          🔒 {note || 'Bloqué'}
        </div>
      ) : (
        height >= 40 && locationName && (
          <div className="text-xs truncate text-gray-500">
            {locationName}
          </div>
        )
      )}
    </button>
  );
}
