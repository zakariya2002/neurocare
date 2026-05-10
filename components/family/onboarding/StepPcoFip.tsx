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
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
        <strong>PCO</strong>&nbsp;: Plateforme de Coordination et d\'Orientation, qui finance et organise
        un parcours de bilan complet. <strong>FIP</strong>&nbsp;: Forfait d\'Intervention Précoce, qui
        prend en charge les séances chez les pros libéraux (orthophoniste, psychomot, ergo).
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900 mb-2">
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
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition ${
                  checked
                    ? 'text-white border-transparent'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
                style={checked ? { backgroundColor: '#027e7e' } : undefined}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900 mb-2">
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
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition ${
                  checked
                    ? 'text-white border-transparent'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
                style={checked ? { backgroundColor: '#027e7e' } : undefined}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {fip === 'yes' && (
        <div>
          <label htmlFor="fip-started" className="block text-sm font-medium text-gray-900 mb-1">
            Date de début du FIP
          </label>
          <input
            id="fip-started"
            type="date"
            value={fipStartedAt ?? ''}
            onChange={(e) => setFipStartedAt(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            Le FIP couvre généralement un parcours d\'un an, renouvelable une fois.
          </p>
        </div>
      )}

      <StepActions onBack={onBack} onSkip={onSkip} saving={saving} />
    </form>
  );
}
