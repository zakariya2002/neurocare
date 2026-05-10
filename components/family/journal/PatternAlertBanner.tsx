'use client';

import type { ChildPatternAlertRow } from '@/lib/family/journal';
import { PATTERN_RULES } from '@/lib/family/journal';

interface Props {
  alerts: ReadonlyArray<ChildPatternAlertRow>;
  onDismiss: (id: string) => void;
}

const RULE_BY_KEY = Object.fromEntries(
  Object.values(PATTERN_RULES).map((r) => [r.key, r])
) as Record<string, { key: string; label: string; description: string }>;

export default function PatternAlertBanner({ alerts, onDismiss }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const rule = RULE_BY_KEY[a.rule_key];
        const label = rule?.label ?? 'Pattern détecté';
        const description = rule?.description ?? null;
        return (
          <div
            key={a.id}
            role="status"
            className="rounded-xl border-l-4 border-l-amber-500 bg-amber-50 px-4 py-3 flex items-start gap-3"
          >
            <svg
              className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-amber-900">{label}</div>
              {description && (
                <div className="text-xs text-amber-800 mt-0.5">{description}</div>
              )}
              <div className="text-xs text-amber-700 mt-1">
                Cette information est purement indicative — elle ne remplace pas un avis
                professionnel.
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(a.id)}
              className="text-xs text-amber-900 hover:underline flex-shrink-0"
            >
              Masquer
            </button>
          </div>
        );
      })}
    </div>
  );
}
