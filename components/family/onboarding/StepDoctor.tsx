'use client';

import { useState } from 'react';
import StepActions from './StepActions';
import type { OnboardingStepDoctor } from '@/lib/family/onboarding';

interface Props {
  initial: OnboardingStepDoctor | null;
  saving: boolean;
  onSave: (data: OnboardingStepDoctor) => Promise<void> | void;
  onSkip: () => Promise<void> | void;
  onBack?: () => void;
}

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-[#027e7e] focus:ring-2 focus:ring-[#027e7e]/20 outline-none transition placeholder:text-gray-400';

export default function StepDoctor({ initial, saving, onSave, onSkip, onBack }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: name.trim() || null,
      city: city.trim() || null,
      phone: phone.trim() || null,
      completed: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Si vous avez identifié un médecin référent (pédiatre, médecin traitant, neuropédiatre…),
        renseignez ses coordonnées. Tout est facultatif.
      </p>

      <div>
        <label htmlFor="doctor-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Nom du praticien
        </label>
        <input
          id="doctor-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dr. Martin"
          className={inputClass}
          maxLength={150}
        />
      </div>

      <div>
        <label htmlFor="doctor-city" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Ville du cabinet
        </label>
        <input
          id="doctor-city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Lyon"
          className={inputClass}
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor="doctor-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Téléphone
        </label>
        <input
          id="doctor-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="04 78 00 00 00"
          className={inputClass}
          maxLength={30}
        />
      </div>

      <StepActions onBack={onBack} onSkip={onSkip} saving={saving} />
    </form>
  );
}
