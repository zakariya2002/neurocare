'use client';

import { useState } from 'react';
import StepActions from './StepActions';
import type {
  OnboardingStepSchool,
  SchoolDevice,
  SchoolType,
} from '@/lib/family/onboarding';

interface Props {
  initial: OnboardingStepSchool | null;
  saving: boolean;
  onSave: (data: OnboardingStepSchool) => Promise<void> | void;
  onSkip: () => Promise<void> | void;
  onBack?: () => void;
}

const SCHOOL_TYPE_OPTIONS: { value: SchoolType; label: string }[] = [
  { value: 'creche', label: 'Crèche' },
  { value: 'maternelle', label: 'Maternelle' },
  { value: 'elementaire', label: 'Élémentaire' },
  { value: 'college', label: 'Collège' },
  { value: 'lycee', label: 'Lycée' },
  { value: 'ime', label: 'IME / établissement médico-social' },
  { value: 'ueea_uema', label: 'UEEA / UEMA' },
  { value: 'home', label: 'Scolarisation à domicile' },
  { value: 'none', label: 'Pas de scolarisation actuellement' },
];

const DEVICE_OPTIONS: { value: SchoolDevice; label: string; help: string }[] = [
  { value: 'pps', label: 'PPS', help: 'Projet Personnalisé de Scolarisation (validé par la MDPH).' },
  { value: 'pap', label: 'PAP', help: 'Plan d\'Accompagnement Personnalisé (équipe enseignante).' },
  { value: 'none', label: 'Aucun', help: 'Aucun dispositif n\'est en place pour le moment.' },
  { value: 'unknown', label: 'Je ne sais pas', help: '' },
];

export default function StepSchool({ initial, saving, onSave, onSkip, onBack }: Props) {
  const [schoolType, setSchoolType] = useState<SchoolType | null>(initial?.school_type ?? null);
  const [device, setDevice] = useState<SchoolDevice | null>(initial?.device ?? null);
  const [hasAesh, setHasAesh] = useState<boolean | null>(initial?.has_aesh ?? null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      school_type: schoolType,
      device,
      has_aesh: hasAesh,
      completed: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-xs text-gray-600 italic">
        Ces informations sont administratives — elles nous aident à personnaliser vos démarches.
      </p>

      <div>
        <label htmlFor="school-type" className="block text-sm font-medium text-gray-900 mb-1">
          Structure de scolarisation
        </label>
        <select
          id="school-type"
          value={schoolType ?? ''}
          onChange={(e) => setSchoolType((e.target.value || null) as SchoolType | null)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
        >
          <option value="">— Choisissez —</option>
          {SCHOOL_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900 mb-2">Dispositif d\'accompagnement</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEVICE_OPTIONS.map((opt) => {
            const checked = device === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  checked ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="school-device"
                  value={opt.value}
                  checked={checked}
                  onChange={() => setDevice(opt.value)}
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
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900 mb-2">Une AESH accompagne-t-elle votre enfant&nbsp;?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setHasAesh(true)}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition ${
              hasAesh === true ? 'text-white border-transparent' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
            style={hasAesh === true ? { backgroundColor: '#027e7e' } : undefined}
          >
            Oui
          </button>
          <button
            type="button"
            onClick={() => setHasAesh(false)}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition ${
              hasAesh === false ? 'text-white border-transparent' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
            style={hasAesh === false ? { backgroundColor: '#027e7e' } : undefined}
          >
            Non
          </button>
        </div>
      </div>

      <StepActions onBack={onBack} onSkip={onSkip} saving={saving} />
    </form>
  );
}
