'use client';

import { useState } from 'react';
import StepActions from './StepActions';
import type { AidCode, OnboardingStepAids } from '@/lib/family/onboarding';

interface Props {
  initial: OnboardingStepAids | null;
  saving: boolean;
  onSave: (data: OnboardingStepAids) => Promise<void> | void;
  onSkip: () => Promise<void> | void;
  onBack?: () => void;
}

const AID_OPTIONS: { value: AidCode; label: string; help?: string }[] = [
  { value: 'aeeh', label: 'AEEH', help: 'Allocation d\'Éducation de l\'Enfant Handicapé (CAF / MSA).' },
  { value: 'complement_aeeh', label: 'Complément AEEH', help: 'Majoration selon les besoins (catégories 1 à 6).' },
  { value: 'pch', label: 'PCH', help: 'Prestation de Compensation du Handicap.' },
  { value: 'cesu', label: 'CESU', help: 'Chèque Emploi Service Universel pour rémunérer un intervenant.' },
  { value: 'other', label: 'Autre aide', help: 'Bons CAF, mutuelle, complémentaire santé solidaire…' },
  { value: 'none', label: 'Aucune aide pour le moment' },
];

export default function StepAids({ initial, saving, onSave, onSkip, onBack }: Props) {
  const [selected, setSelected] = useState<AidCode[]>(initial?.aids ?? []);

  const toggle = (code: AidCode) => {
    setSelected((prev) => {
      if (code === 'none') {
        // "Aucune" est exclusive
        return prev.includes('none') ? [] : ['none'];
      }
      // Si on choisit autre chose, retirer "none"
      const without = prev.filter((c) => c !== 'none');
      return without.includes(code) ? without.filter((c) => c !== code) : [...without, code];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      aids: selected.length > 0 ? selected : null,
      completed: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Cochez les aides que vous percevez actuellement. Vous pourrez modifier cela plus tard.
      </p>

      <div className="space-y-2">
        {AID_OPTIONS.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                checked ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                {opt.help && <span className="block text-xs text-gray-600">{opt.help}</span>}
              </span>
            </label>
          );
        })}
      </div>

      <StepActions onBack={onBack} onSkip={onSkip} saving={saving} submitLabel="Terminer" />
    </form>
  );
}
