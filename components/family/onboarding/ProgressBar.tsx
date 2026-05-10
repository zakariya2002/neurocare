'use client';

import { ONBOARDING_TOTAL_STEPS } from '@/lib/family/onboarding';

interface ProgressBarProps {
  current: number; // 1..N (étape en cours), ou 0 si écran d'intro
  completedCount: number;
}

export default function ProgressBar({ current, completedCount }: ProgressBarProps) {
  const total = ONBOARDING_TOTAL_STEPS;
  const pct = Math.min(100, Math.round((completedCount / total) * 100));

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2 text-xs sm:text-sm text-gray-600">
        <span>
          {current > 0 ? `Étape ${current} sur ${total}` : 'Premiers pas'}
        </span>
        <span>
          {completedCount}/{total} complétées
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completedCount}>
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: '#027e7e' }}
        />
      </div>
    </div>
  );
}
