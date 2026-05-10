'use client';

/**
 * Bandeau d'information visible en mode dev/staging tant que l'infra HDS
 * n'est pas provisionnée. À masquer en prod via NEXT_PUBLIC_SUPABASE_HDS_URL
 * (cf. lib/supabase-health.ts → isHdsInfraConfigured).
 *
 * Variante coffre-fort (B2) : accent rouge sécurité, signal de confidentialité.
 */
export default function HdsDevBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      role="status"
      className="rounded-xl border px-3 py-2.5 mb-3 sm:mb-4 flex items-start gap-3 text-xs sm:text-sm"
      style={{
        backgroundColor: '#fee2e2',
        borderColor: 'rgba(220, 38, 38, 0.3)',
        color: '#7f1d1d',
      }}
    >
      <span
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)' }}
        aria-hidden="true"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="#dc2626"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3zm-7 9a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2H7a2 2 0 00-2 2v7z"
          />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold" style={{ color: '#7f1d1d' }}>
          HDS pending
        </div>
        <p className="mt-0.5">
          Cette section sera hébergée sur infrastructure HDS-certifiée avant la mise en production.
        </p>
      </div>
    </div>
  );
}
