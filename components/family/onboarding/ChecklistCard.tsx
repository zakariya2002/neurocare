'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  ONBOARDING_TOTAL_STEPS,
  summarizeProgress,
  type OnboardingProgressRow,
} from '@/lib/family/onboarding';

interface ChecklistChild {
  id: string;
  first_name: string;
  last_name: string | null;
}

/**
 * Bloc "Premiers pas" à insérer dans le dashboard famille.
 *
 * Récupère lui-même la progression de l'utilisateur via /api/family/onboarding,
 * pour n'importe quel composant client (pas besoin de la passer depuis le parent).
 *
 * Affichage :
 *   - Si pas d'enfant : rien (le wizard gère l'empty state).
 *   - Si toutes les progressions sont dismissed ET completed : rien.
 *   - Sinon : carte avec X/5 + CTA "Continuer".
 */
export default function OnboardingChecklistCard({ familyId }: { familyId: string }) {
  const [children, setChildren] = useState<ChecklistChild[]>([]);
  const [progress, setProgress] = useState<Record<string, OnboardingProgressRow | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Charger les enfants
        const { data: kids } = await supabase
          .from('child_profiles')
          .select('id, first_name, last_name, is_active')
          .eq('family_id', familyId)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (cancelled) return;
        const list = (kids ?? []) as ChecklistChild[];
        setChildren(list);

        if (list.length === 0) {
          setLoading(false);
          return;
        }

        // Charger la progression
        const res = await fetch('/api/family/onboarding', { credentials: 'include' });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const json = await res.json();
        const rows: OnboardingProgressRow[] = Array.isArray(json?.progress) ? json.progress : [];
        const map: Record<string, OnboardingProgressRow | null> = {};
        for (const c of list) {
          map[c.id] = rows.find((r) => r.child_id === c.id) ?? null;
        }
        if (!cancelled) setProgress(map);
      } catch {
        // silencieux : le bloc se masque
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [familyId]);

  if (loading || children.length === 0) return null;

  // Calcul d'affichage : on prend le premier enfant non terminé / non dismissé,
  // sinon on cache complètement la carte.
  const visibleChild = children
    .map((c) => ({ child: c, summary: summarizeProgress(progress[c.id] ?? null, c.id) }))
    .find(({ summary }) => !summary.isComplete || !summary.isDismissed);

  // Si tous les enfants sont à 100% ET dismissed, on cache.
  const allDoneAndDismissed = children.every(({ id }) => {
    const s = summarizeProgress(progress[id] ?? null, id);
    return s.isComplete && s.isDismissed;
  });
  if (allDoneAndDismissed) return null;

  // Si tout est complete pour tous (mais pas dismissed), on affiche un état "tout est ok".
  const allComplete = children.every(({ id }) => summarizeProgress(progress[id] ?? null, id).isComplete);

  if (!visibleChild) return null;

  const { child, summary } = visibleChild;
  const childLabel = child.first_name;
  const pct = Math.round((summary.completedCount / ONBOARDING_TOTAL_STEPS) * 100);

  // Cercle de progression
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const ctaLabel = summary.completedCount === 0 ? 'Commencer' : allComplete ? 'Revoir' : 'Continuer';

  return (
    <div
      className="mt-3 sm:mt-4 md:mt-6 lg:mx-0 bg-white rounded-xl md:rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all"
      data-tour="onboarding-checklist"
    >
      <div className="p-4 sm:p-5 md:p-6">
        <div className="flex items-start gap-4">
          {/* Cercle de progression */}
          <div className="relative flex-shrink-0 w-16 h-16 sm:w-[68px] sm:h-[68px]" aria-hidden="true">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke="#e6f4f4"
                strokeWidth="6"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke="#027e7e"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 600ms ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {allComplete ? (
                <svg className="w-7 h-7" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {summary.completedCount}/{ONBOARDING_TOTAL_STEPS}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
                Premiers pas{children.length > 1 ? ` pour ${childLabel}` : ''}
              </h2>
              {!allComplete && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold" style={{ backgroundColor: '#e6f4f4', color: '#027e7e' }}>
                  {pct}%
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {allComplete
                ? `Vos premiers pas sont terminés${children.length > 1 ? ' pour tous vos enfants' : ''}. Vous pouvez les revoir à tout moment.`
                : children.length > 1
                  ? `Continuez le parcours pour structurer les démarches de ${childLabel}.`
                  : `Quelques questions pour structurer vos démarches après le diagnostic.`}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/family/onboarding?child_id=${encodeURIComponent(child.id)}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition hover:opacity-90 shadow-sm"
            style={{ backgroundColor: '#027e7e' }}
          >
            {ctaLabel}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          {!allComplete && (
            <span className="text-xs text-gray-500">
              {ONBOARDING_TOTAL_STEPS - summary.completedCount} étape{ONBOARDING_TOTAL_STEPS - summary.completedCount > 1 ? 's' : ''} restante{ONBOARDING_TOTAL_STEPS - summary.completedCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
