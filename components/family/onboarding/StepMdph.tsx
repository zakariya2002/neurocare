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

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-[#027e7e] focus:ring-2 focus:ring-[#027e7e]/20 outline-none transition placeholder:text-gray-400';

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-gray-600">
        La Maison Départementale des Personnes Handicapées (MDPH) est le guichet unique pour
        l&apos;AEEH, la PCH, l&apos;AESH et la reconnaissance du handicap. Où en êtes-vous&nbsp;?
      </p>

      <fieldset className="space-y-2">
        <legend className="sr-only">Statut du dossier MDPH</legend>
        {STATUS_OPTIONS.map((opt) => {
          const checked = status === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                checked
                  ? 'border-[#027e7e] bg-[#e6f4f4]/60 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="mdph-status"
                value={opt.value}
                checked={checked}
                onChange={() => setStatus(opt.value)}
                className="mt-0.5 h-4 w-4"
                style={{ accentColor: '#027e7e' }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                <span className="block text-xs text-gray-600 mt-0.5">{opt.help}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {status === 'granted' && (
        <div className="rounded-xl border border-[#027e7e]/20 bg-[#e6f4f4]/40 p-4 space-y-3">
          <div>
            <label htmlFor="mdph-expires" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Date de fin de droits
            </label>
            <input
              id="mdph-expires"
              type="date"
              value={expiresAt ?? ''}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-gray-600 mt-1.5 flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nous vous rappellerons 6 mois avant pour anticiper le renouvellement.
            </p>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="mdph-department" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Département de la MDPH
        </label>
        <input
          id="mdph-department"
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Rhône (69), Paris (75)…"
          className={inputClass}
          maxLength={80}
        />
      </div>

      <StepActions onBack={onBack} onSkip={onSkip} saving={saving} />
    </form>
  );
}
