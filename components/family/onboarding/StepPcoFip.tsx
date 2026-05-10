'use client';

import { useState } from 'react';
import StepActions from './StepActions';
import type { OnboardingStepPcoFip, YesNoUnknown } from '@/lib/family/onboarding';

interface Props {
  initial: OnboardingStepPcoFip | null;
  saving: boolean;
  onSave: (data: OnboardingStepPcoFip) => Promise<void> | void;
  onSkip: () => Promise<void> | void;
  onBack?: () => void;
}

const PCO_OPTIONS: { value: YesNoUnknown; label: string }[] = [
  { value: 'yes', label: 'Oui' },
  { value: 'no', label: 'Non' },
  { value: 'unknown', label: 'Je ne sais pas' },
];

const FIP_OPTIONS: { value: 'yes' | 'no'; label: string }[] = [
  { value: 'yes', label: 'Oui' },
  { value: 'no', label: 'Non' },
];

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-[#027e7e] focus:ring-2 focus:ring-[#027e7e]/20 outline-none transition placeholder:text-gray-400';

const choiceClass = (checked: boolean) =>
  `px-4 py-2.5 text-sm font-medium rounded-xl border transition ${
    checked
      ? 'text-white border-transparent shadow-sm'
      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
  }`;

export default function StepPcoFip({ initial, saving, onSave, onSkip, onBack }: Props) {
  const [pco, setPco] = useState<YesNoUnknown | null>(initial?.pco_oriented ?? null);
  const [fip, setFip] = useState<'yes' | 'no' | null>(initial?.fip_active ?? null);
  const [fipStartedAt, setFipStartedAt] = useState(initial?.fip_started_at ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      pco_oriented: pco,
      fip_active: fip,
      fip_started_at: fip === 'yes' && fipStartedAt ? fipStartedAt : null,
      completed: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          <strong>PCO</strong>&nbsp;: Plateforme de Coordination et d&apos;Orientation, qui finance et organise
          un parcours de bilan complet. <strong>FIP</strong>&nbsp;: Forfait d&apos;Intervention Précoce, qui
          prend en charge les séances chez les pros libéraux (orthophoniste, psychomot, ergo).
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-2">
          Votre enfant a-t-il été orienté vers une PCO&nbsp;?
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PCO_OPTIONS.map((opt) => {
            const checked = pco === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPco(opt.value)}
                className={choiceClass(checked)}
                style={checked ? { backgroundColor: '#027e7e' } : undefined}
                aria-pressed={checked}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-2">
          Une prescription FIP est-elle en cours&nbsp;?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {FIP_OPTIONS.map((opt) => {
            const checked = fip === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFip(opt.value)}
                className={choiceClass(checked)}
                style={checked ? { backgroundColor: '#027e7e' } : undefined}
                aria-pressed={checked}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {fip === 'yes' && (
        <div className="rounded-xl border border-[#027e7e]/20 bg-[#e6f4f4]/40 p-4">
          <label htmlFor="fip-started" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Date de début du FIP
          </label>
          <input
            id="fip-started"
            type="date"
            value={fipStartedAt ?? ''}
            onChange={(e) => setFipStartedAt(e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-gray-600 mt-1.5">
            Le FIP couvre généralement un parcours d&apos;un an, renouvelable une fois.
          </p>
        </div>
      )}

      <StepActions onBack={onBack} onSkip={onSkip} saving={saving} />
    </form>
  );
}
