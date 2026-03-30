'use client';

import type { CalendarView } from '@/types/scheduling';

interface ViewToggleProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
      <button
        onClick={() => onViewChange('week')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
          currentView === 'week'
            ? 'text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        style={currentView === 'week' ? { backgroundColor: '#027e7e' } : {}}
      >
        Semaine
      </button>
      <button
        onClick={() => onViewChange('month')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
          currentView === 'month'
            ? 'text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        style={currentView === 'month' ? { backgroundColor: '#027e7e' } : {}}
      >
        Mois
      </button>
    </div>
  );
}
