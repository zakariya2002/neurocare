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

// Icônes SVG par étape (path d="" en stroke)
const STEP_ICONS: Record<OnboardingStepKey, string> = {
  doctor: 'M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z',
  mdph: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  pco_fip: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  school: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  aids: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

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

  // Détermine l'état d'une étape pour la sidebar.
  const stateOf = (key: OnboardingStepKey): 'done' | 'current' | 'todo' => {
    if (summary.steps[key]?.completed) return 'done';
    if (!showCompletion && key === currentKey) return 'current';
    return 'todo';
  };

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header sélecteur enfant */}
      {children.length > 1 && (
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50/50">
          <label htmlFor="child-select" className="block text-xs font-medium text-gray-600 mb-1">
            Enfant concerné
          </label>
          <select
            id="child-select"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#027e7e] focus:ring-2 focus:ring-[#027e7e]/20 transition"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name}{c.last_name ? ` ${c.last_name}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="md:grid md:grid-cols-[260px_1fr]">
        {/* Sidebar verticale (desktop uniquement) */}
        <aside className="hidden md:block border-r border-gray-100 bg-gray-50/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
            Étapes
          </p>
          <ol className="space-y-1.5" aria-label="Liste des étapes du parcours">
            {ORDERED_STEPS.map((key, idx) => {
              const state = stateOf(key);
              const m = STEP_META[key];
              const interactive = !showCompletion;
              const Tag: any = interactive ? 'button' : 'div';
              return (
                <li key={key}>
                  <Tag
                    {...(interactive
                      ? { type: 'button', onClick: () => setStepIdx(idx), 'aria-current': state === 'current' ? 'step' : undefined }
                      : {})}
                    className={`w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      state === 'current'
                        ? 'bg-white border border-[#027e7e]/30 shadow-sm'
                        : state === 'done'
                          ? 'hover:bg-white border border-transparent'
                          : 'hover:bg-white border border-transparent'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                        state === 'done'
                          ? 'text-white'
                          : state === 'current'
                            ? 'text-white'
                            : 'bg-gray-200 text-gray-500'
                      }`}
                      style={
                        state === 'done'
                          ? { backgroundColor: '#027e7e' }
                          : state === 'current'
                            ? { backgroundColor: '#3a9e9e' }
                            : undefined
                      }
                      aria-hidden="true"
                    >
                      {state === 'done' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-semibold ${
                          state === 'current' ? 'text-[#027e7e]' : state === 'done' ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {m.title}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {state === 'done' ? 'Complétée' : m.subtitle}
                      </span>
                    </span>
                  </Tag>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Contenu principal */}
        <div className="px-4 sm:px-6 py-5 md:py-6">
          {/* Mobile : barre de progression horizontale */}
          <div className="md:hidden">
            <ProgressBar current={showCompletion ? 0 : stepIdx + 1} completedCount={summary.completedCount} />
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {!showCompletion && meta && currentKey && (
            <div>
              {/* Illustration + titre */}
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#e6f4f4' }}
                >
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={STEP_ICONS[currentKey]} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#027e7e]">
                    Étape {stepIdx + 1} sur {ORDERED_STEPS.length}
                  </p>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-0.5" style={{ fontFamily: 'Verdana, sans-serif' }}>
                    {meta.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{meta.subtitle}</p>
                </div>
              </div>

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
              <div className="text-center py-3 sm:py-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f4f4' }}>
                  <svg className="w-9 h-9 sm:w-10 sm:h-10" fill="none" stroke="#027e7e" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  Bravo, vos premiers pas sont posés{currentChild ? ` pour ${currentChild.first_name}` : ''}.
                </h2>
                <p className="text-sm text-gray-600 max-w-lg mx-auto">
                  Voici quelques actions personnalisées pour avancer concrètement.
                </p>
              </div>

              {recommendations.length > 0 ? (
                <ul className="space-y-2 mb-5 mt-4">
                  {recommendations.map((rec) => (
                    <li key={rec.id}>
                      <Link
                        href={rec.href}
                        className="flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-[#027e7e]/40 hover:bg-[#e6f4f4]/40 hover:shadow-sm transition group"
                      >
                        <span
                          className="flex-shrink-0 mt-1.5 inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: rec.priority === 'high' ? '#dc2626' : rec.priority === 'medium' ? '#d97706' : '#027e7e' }}
                          aria-hidden="true"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-gray-900">{rec.label}</span>
                          <span className="block text-xs text-gray-600 mt-0.5">{rec.reason}</span>
                        </span>
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1 group-hover:text-[#027e7e] group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 text-center mb-5 mt-4">
                  Vos démarches semblent bien avancées. Revenez ici si votre situation évolue.
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                <Link
                  href="/dashboard/family"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition hover:opacity-90"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  Retour au tableau de bord
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <button
                  type="button"
                  onClick={() => { setShowCompletion(false); setStepIdx(0); }}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition"
                >
                  Modifier mes réponses
                </button>
                {!summary.isDismissed && (
                  <button
                    type="button"
                    onClick={handleDismiss}
                    disabled={saving}
                    className="px-4 py-2.5 text-sm font-medium rounded-xl text-gray-500 hover:text-gray-700 transition disabled:opacity-60"
                  >
                    Ne plus afficher sur le tableau de bord
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
