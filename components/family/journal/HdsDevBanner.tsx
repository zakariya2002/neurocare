'use client';

import { HDS_DEV_BANNER } from '@/lib/family/journal';

/**
 * Bandeau d'information visible en mode dev/staging tant que l'infra HDS
 * n'est pas provisionnée. À masquer en prod via NEXT_PUBLIC_SUPABASE_HDS_URL
 * (cf. lib/supabase-health.ts → isHdsInfraConfigured).
 */
export default function HdsDevBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      role="status"
      className="rounded-lg border px-3 py-2 mb-4 flex items-start gap-3 text-sm"
      style={{ backgroundColor: '#fef9c3', borderColor: '#facc15', color: '#854d0e' }}
    >
      <svg
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3zm-7 9a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2H7a2 2 0 00-2 2v7z"
        />
      </svg>
      <span>{HDS_DEV_BANNER}</span>
    </div>
  );
}
