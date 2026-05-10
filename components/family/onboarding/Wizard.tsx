'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ORDERED_STEPS,
  STEP_META,
  buildRecommendations,
  summarizeProgress,
  type OnboardingProgressRow,
  type OnboardingStepAids,
  type OnboardingStepDoctor,
  type OnboardingStepKey,
  type OnboardingStepMdph,
  type OnboardingStepPcoFip,
  type OnboardingStepSchool,
} from '@/lib/family/onboarding';
import ProgressBar from './ProgressBar';
import StepDoctor from './StepDoctor';
import StepMdph from './StepMdph';
import StepPcoFip from './StepPcoFip';
import StepSchool from './StepSchool';
import StepAids from './StepAids';

interface Child {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface WizardProps {
  children: Child[];
  initialChildId: string;
  initialProgress: Record<string, OnboardingProgressRow | null>;
}

type AnyStepData =
  | OnboardingStepDoctor
  | OnboardingStepMdph
  | OnboardingStepPcoFip
  | OnboardingStepSchool
  | OnboardingStepAids;

export default function OnboardingWizard({ children, initialChildId, initialProgress }: WizardProps) {
  const [childId, setChildId] = useState<string>(initialChildId);
  const [progressByChild, setProgressByChild] = useState<Record<string, OnboardingProgressRow | null>>(initialProgress);
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  const currentChild = children.find((c) => c.id === childId) ?? children[0];
  const progress = progressByChild[childId] ?? null;
  const summary = useMemo(() => summarizeProgress(progress, childId), [progress, childId]);
  const recommendations = useMemo(() => buildRecommendations(summary), [summary]);

  // Aller automatiquement à la première étape non complétée
  useEffect(() => {
    const idx = ORDERED_STEPS.findIndex((key) => !summary.steps[key]?.completed);
    if (idx === -1) {
      setShowCompletion(true);
    } else {
      setStepIdx(idx);
      setShowCompletion(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const persist = async (payload: { step?: OnboardingStepKey; data?: unknown; action?: string }) => {
    setError(null);
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expirée, reconnectez-vous.');

      const res = await fetch('/api/family/onboarding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId, ...payload }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Erreur de sauvegarde');
      }
      const json = await res.json();
      setProgressByChild((prev) => ({
        ...prev,
        [childId]: json.progress as OnboardingProgressRow | null,
      }));
      return json.progress as OnboardingProgressRow | null;
    } catch (err: any) {
      setError(err?.message || 'Erreur inconnue');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const goNext = (latest?: OnboardingProgressRow | null) => {
    const next = latest ? summarizeProgress(latest, childId) : summary;
    const remaining = ORDERED_STEPS.findIndex((key) => !next.steps[key]?.completed);
    if (remaining === -1) {
      setShowCompletion(true);
    } else {
      setStepIdx(remaining);
    }
  };

  const handleSaveStep = async (key: OnboardingStepKey, data: AnyStepData) => {
    const updated = await persist({ step: key, data });
    if (updated) goNext(updated);
  };

  const handleSkipStep = async (key: OnboardingStepKey) => {
    // Marque l'étape comme complétée sans données
    const skipPayload: AnyStepData = { completed: true } as AnyStepData;
    const updated = await persist({ step: key, data: skipPayload });
    if (updated) goNext(updated);
  };

  const handleDismiss = async () => {
    await persist({ action: 'dismiss' });
  };

  const currentKey = ORDERED_STEPS[stepIdx];
  const meta = currentKey ? STEP_META[currentKey] : null;

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
      {/* Header sélecteur enfant */}
      {children.length > 1 && (
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
          <label htmlFor="child-select" className="block text-xs font-medium text-gray-600 mb-1">
            Enfant concerné
          </label>
          <select
            id="child-select"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name}{c.last_name ? ` ${c.last_name}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="px-4 sm:px-6 py-5">
        <ProgressBar current={showCompletion ? 0 : stepIdx + 1} completedCount={summary.completedCount} />

        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!showCompletion && meta && currentKey && (
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {meta.title}
            </h2>
            <p className="text-sm text-gray-600 mb-4">{meta.subtitle}</p>

            {currentKey === 'doctor' && (
              <StepDoctor
                initial={summary.steps.doctor}
                saving={saving}
                onSave={(d) => handleSaveStep('doctor', d)}
                onSkip={() => handleSkipStep('doctor')}
                onBack={stepIdx > 0 ? () => setStepIdx(stepIdx - 1) : undefined}
              />
            )}
            {currentKey === 'mdph' && (
              <StepMdph
                initial={summary.steps.mdph}
                saving={saving}
                onSave={(d) => handleSaveStep('mdph', d)}
                onSkip={() => handleSkipStep('mdph')}
                onBack={stepIdx > 0 ? () => setStepIdx(stepIdx - 1) : undefined}
              />
            )}
            {currentKey === 'pco_fip' && (
              <StepPcoFip
                initial={summary.steps.pco_fip}
                saving={saving}
                onSave={(d) => handleSaveStep('pco_fip', d)}
                onSkip={() => handleSkipStep('pco_fip')}
                onBack={stepIdx > 0 ? () => setStepIdx(stepIdx - 1) : undefined}
              />
            )}
            {currentKey === 'school' && (
              <StepSchool
                initial={summary.steps.school}
                saving={saving}
                onSave={(d) => handleSaveStep('school', d)}
                onSkip={() => handleSkipStep('school')}
                onBack={stepIdx > 0 ? () => setStepIdx(stepIdx - 1) : undefined}
              />
            )}
            {currentKey === 'aids' && (
              <StepAids
                initial={summary.steps.aids}
                saving={saving}
                onSave={(d) => handleSaveStep('aids', d)}
                onSkip={() => handleSkipStep('aids')}
                onBack={stepIdx > 0 ? () => setStepIdx(stepIdx - 1) : undefined}
              />
            )}
          </div>
        )}

        {showCompletion && (
          <div>
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f4f4' }}>
                <svg className="w-8 h-8" fill="none" stroke="#027e7e" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Bravo, vos premiers pas sont posés{currentChild ? ` pour ${currentChild.first_name}` : ''}.
              </h2>
              <p className="text-sm text-gray-600">
                Voici quelques actions personnalisées pour avancer concrètement.
              </p>
            </div>

            {recommendations.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {recommendations.map((rec) => (
                  <li key={rec.id}>
                    <Link
                      href={rec.href}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-teal-600 hover:bg-teal-50 transition"
                    >
                      <span
                        className="flex-shrink-0 mt-0.5 inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: rec.priority === 'high' ? '#dc2626' : rec.priority === 'medium' ? '#d97706' : '#027e7e' }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-gray-900">{rec.label}</span>
                        <span className="block text-xs text-gray-600">{rec.reason}</span>
                      </span>
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 text-center mb-4">
                Vos démarches semblent bien avancées. Revenez ici si votre situation évolue.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              <Link
                href="/dashboard/family"
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition"
                style={{ backgroundColor: '#027e7e' }}
              >
                Retour au tableau de bord
              </Link>
              <button
                type="button"
                onClick={() => { setShowCompletion(false); setStepIdx(0); }}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Modifier mes réponses
              </button>
              {!summary.isDismissed && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-700 transition disabled:opacity-60"
                >
                  Ne plus afficher sur le tableau de bord
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
