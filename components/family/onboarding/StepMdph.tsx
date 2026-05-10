'use client';

import { useState } from 'react';
import StepActions from './StepActions';
import type { MdphStatus, OnboardingStepMdph } from '@/lib/family/onboarding';

interface Props {
  initial: OnboardingStepMdph | null;
  saving: boolean;
  onSave: (data: OnboardingStepMdph) => Promise<void> | void;
  onSkip: () => Promise<void> | void;
  onBack?: () => void;
}

const STATUS_OPTIONS: { value: MdphStatus; label: string; help: string }[] = [
  { value: 'never', label: 'Jamais déposé', help: 'Aucun dossier MDPH n\'a encore été constitué.' },
  { value: 'in_progress', label: 'Dossier en cours', help: 'Le dossier a été déposé, vous attendez une réponse.' },
  { value: 'granted', label: 'Accordé', help: 'Une notification favorable a été reçue.' },
  { value: 'denied', label: 'Refusé', help: 'Le dossier a été refusé ou clôturé.' },
];

export default function StepMdph({ initial, saving, onSave, onSkip, onBack }: Props) {
  const [status, setStatus] = useState<MdphStatus | null>(initial?.status ?? null);
  const [expiresAt, setExpiresAt] = useState(initial?.expires_at ?? '');
  const [department, setDepartment] = useState(initial?.department ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      status,
      expires_at: status === 'granted' && expiresAt ? expiresAt : null,
      department: department.trim() || null,
      completed: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        La Maison Départementale des Personnes Handicapées (MDPH) est le guichet unique pour
        l\'AEEH, la PCH, l\'AESH et la reconnaissance du handicap. Où en êtes-vous&nbsp;?
      </p>

      <fieldset className="space-y-2">
        <legend className="sr-only">Statut du dossier MDPH</legend>
        {STATUS_OPTIONS.map((opt) => {
          const checked = status === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                checked ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="mdph-status"
                value={opt.value}
                checked={checked}
                onChange={() => setStatus(opt.value)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                <span className="block text-xs text-gray-600">{opt.help}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {status === 'granted' && (
        <div>
          <label htmlFor="mdph-expires" className="block text-sm font-medium text-gray-900 mb-1">
            Date de fin de droits
          </label>
          <input
            id="mdph-expires"
            type="date"
            value={expiresAt ?? ''}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nous vous rappellerons 6 mois avant pour anticiper le renouvellement.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="mdph-department" className="block text-sm font-medium text-gray-900 mb-1">
          Département de la MDPH
        </label>
        <input
          id="mdph-department"
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Rhône (69), Paris (75)…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
          maxLength={80}
        />
      </div>

      <StepActions onBack={onBack} onSkip={onSkip} saving={saving} />
    </form>
  );
}
