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
  const childLabel = `${child.first_name}${child.last_name ? ` ${child.last_name}` : ''}`;

  return (
    <div
      className="mt-3 sm:mt-4 md:mt-6 lg:mx-0 bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      data-tour="onboarding-checklist"
    >
      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
          Premiers pas
        </h2>
        <span className="text-xs font-medium text-gray-600">
          {summary.completedCount}/{ONBOARDING_TOTAL_STEPS}
        </span>
      </div>
      <div className="p-3 sm:p-4 md:p-6">
        <p className="text-xs sm:text-sm text-gray-700 mb-3">
          {allComplete
            ? `Vos premiers pas sont terminés${children.length > 1 ? ' pour tous vos enfants' : ''}. Vous pouvez les revoir à tout moment.`
            : children.length > 1
              ? `Continuez le parcours pour ${childLabel}.`
              : `Quelques questions pour structurer vos démarches après le diagnostic.`}
        </p>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mb-4" aria-hidden="true">
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.round((summary.completedCount / ONBOARDING_TOTAL_STEPS) * 100)}%`,
              backgroundColor: '#027e7e',
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/family/onboarding?child_id=${encodeURIComponent(child.id)}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition"
            style={{ backgroundColor: '#027e7e' }}
          >
            {summary.completedCount === 0 ? 'Commencer' : allComplete ? 'Revoir' : 'Continuer'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
