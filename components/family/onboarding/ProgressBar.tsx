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
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
        <span className="font-semibold text-[#027e7e]">
          {current > 0 ? `Étape ${current} sur ${total}` : 'Premiers pas'}
        </span>
        <span className="text-gray-600">
          {completedCount}/{total} complétées
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completedCount}
      >
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #027e7e 0%, #3a9e9e 100%)' }}
        />
      </div>
    </div>
  );
}
