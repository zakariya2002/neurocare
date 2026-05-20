'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import StepNeed from './StepNeed';
import StepPerson from './StepPerson';
import StepLocationSchedule from './StepLocationSchedule';
import StepReview from './StepReview';
import {
  AnnouncementFormData,
  ChildProfileLite,
  emptyForm,
} from './types';

interface AnnouncementWizardProps {
  mode?: 'create' | 'edit';
  announcementId?: string;
  initialData?: Partial<AnnouncementFormData>;
}

const STEPS = [
  { id: 1, label: 'Besoin' },
  { id: 2, label: 'Personne' },
  { id: 3, label: 'Lieu & horaires' },
  { id: 4, label: 'Récap' },
];

function validateStep(step: number, data: AnnouncementFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (data.title.trim().length < 8) errors.title = 'Le titre doit faire au moins 8 caractères.';
    if (data.description.trim().length < 30)
      errors.description = 'La description doit faire au moins 30 caractères.';
    if (data.accompaniment_types.length === 0)
      errors.accompaniment_types = 'Sélectionnez au moins un type d\'accompagnement.';
    if (data.desired_professions.length === 0)
      errors.desired_professions = 'Sélectionnez au moins une profession.';
  } else if (step === 2) {
    if (!data.child_id && data.person_age === null)
      errors.child_id = 'Choisissez un proche ou indiquez l\'âge de la personne adulte.';
    if (!data.child_id && data.person_age !== null && (data.person_age < 0 || data.person_age > 120))
      errors.person_age = 'Âge invalide.';
  } else if (step === 3) {
    if (!data.location_label.trim() || !data.city)
      errors.location_label = 'Sélectionnez une ville dans les suggestions.';
    if (data.place_types.length === 0)
      errors.place_types = 'Choisissez au moins un lieu d\'intervention.';
    if (data.hours_per_week !== null && data.hours_per_week < 0)
      errors.hours_per_week = 'Volume invalide.';
  }
  return errors;
}

export default function AnnouncementWizard({
  mode = 'create',
  announcementId,
  initialData,
}: AnnouncementWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<AnnouncementFormData>(() => ({
    ...emptyForm(),
    ...initialData,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [childrenList, setChildrenList] = useState<ChildProfileLite[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: family } = await supabase
        .from('family_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      if (!family) return;
      const { data: children } = await supabase
        .from('child_profiles')
        .select('id, first_name, last_name, age, birth_date')
        .eq('family_id', family.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (active && children) setChildrenList(children as ChildProfileLite[]);
    })();
    return () => {
      active = false;
    };
  }, []);

  const patch = (p: Partial<AnnouncementFormData>) => {
    setData((prev) => ({ ...prev, ...p }));
  };

  const goNext = () => {
    const stepErrors = validateStep(step, data);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) {
      setStep((s) => Math.min(s + 1, 4));
      setErrors({});
    }
  };

  const goPrev = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };

  const submit = async (asDraft: boolean) => {
    // Validation finale sur les 3 premières étapes en mode publication
    if (!asDraft) {
      for (const s of [1, 2, 3]) {
        const e = validateStep(s, data);
        if (Object.keys(e).length > 0) {
          setStep(s);
          setErrors(e);
          return;
        }
      }
    }

    setSubmitting(true);
    setServerError('');
    try {
      const payload: any = { ...data };
      if (asDraft) payload.status = 'draft';

      const url = mode === 'edit' && announcementId
        ? `/api/family/announcements/${announcementId}`
        : '/api/family/announcements';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erreur lors de l\'enregistrement de l\'annonce.');
      }

      router.push('/dashboard/family/announcements');
      router.refresh();
    } catch (e: any) {
      setServerError(e.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Progression */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Étape {step} / 4 — {STEPS[step - 1].label}
          </p>
          <p className="text-xs text-gray-400">{Math.round((step / 4) * 100)}%</p>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%`, backgroundColor: '#027e7e' }}
          />
        </div>
        <div className="hidden sm:flex justify-between mt-3">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`text-xs font-medium ${step >= s.id ? 'text-gray-800' : 'text-gray-400'}`}
            >
              {s.id}. {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
        {step === 1 && <StepNeed data={data} onChange={patch} errors={errors} />}
        {step === 2 && (
          <StepPerson data={data} onChange={patch} childrenList={childrenList} errors={errors} />
        )}
        {step === 3 && <StepLocationSchedule data={data} onChange={patch} errors={errors} />}
        {step === 4 && <StepReview data={data} childrenList={childrenList} />}
      </div>

      {serverError && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r text-sm" role="alert">
          {serverError}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-between">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={goPrev}
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-semibold text-sm disabled:opacity-50"
            >
              ← Précédent
            </button>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          {step === 4 ? (
            <>
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold text-sm disabled:opacity-50"
              >
                Sauvegarder en brouillon
              </button>
              <button
                type="button"
                onClick={() => submit(false)}
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 text-white rounded-xl hover:opacity-90 transition font-semibold text-sm shadow-md disabled:opacity-50"
                style={{ backgroundColor: '#027e7e' }}
              >
                {submitting ? 'Envoi...' : 'Soumettre pour publication'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="w-full sm:w-auto px-6 py-3 text-white rounded-xl hover:opacity-90 transition font-semibold text-sm shadow-md"
              style={{ backgroundColor: '#027e7e' }}
            >
              Suivant →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
