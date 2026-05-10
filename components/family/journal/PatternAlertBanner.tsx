'use client';

import { useState } from 'react';
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (alerts.length === 0) return null;

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const rule = RULE_BY_KEY[a.rule_key];
        const label = rule?.label ?? 'Pattern détecté';
        const description = rule?.description ?? null;
        const isOpen = expanded.has(a.id);
        return (
          <div
            key={a.id}
            role="status"
            className="rounded-xl border px-3 sm:px-4 py-3 flex items-start gap-3"
            style={{
              backgroundColor: '#fef3c7',
              borderColor: 'rgba(217, 119, 6, 0.3)',
            }}
          >
            <span
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
              style={{ backgroundColor: 'rgba(217, 119, 6, 0.18)' }}
              aria-hidden="true"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="#d97706"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
                />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: '#78350f' }}>
                {label}
              </div>
              {description && !isOpen && (
                <div className="text-xs mt-0.5" style={{ color: '#92400e' }}>
                  {description.length > 90 ? `${description.slice(0, 90)}…` : description}
                </div>
              )}
              {isOpen && (
                <div className="text-xs mt-1.5 space-y-1.5" style={{ color: '#92400e' }}>
                  {description && <p>{description}</p>}
                  <p className="italic">
                    Cette information est purement indicative — elle ne remplace pas un avis
                    professionnel. Si vous le souhaitez, parlez-en au pro qui suit votre enfant.
                  </p>
                </div>
              )}
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggle(a.id)}
                  className="text-xs font-semibold underline-offset-2 hover:underline"
                  style={{ color: '#b45309' }}
                  aria-expanded={isOpen}
                >
                  {isOpen ? 'Réduire' : 'Comprendre'}
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(a.id)}
                  className="text-xs font-medium underline-offset-2 hover:underline"
                  style={{ color: '#78350f' }}
                >
                  Masquer
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
