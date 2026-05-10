'use client';

interface StepActionsProps {
  saving: boolean;
  onBack?: () => void;
  onSkip: () => Promise<void> | void;
  submitLabel?: string;
}

export default function StepActions({ saving, onBack, onSkip, submitLabel }: StepActionsProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100 mt-5">
      <div className="flex items-center justify-start">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition disabled:opacity-50"
            disabled={saving}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
        )}
      </div>
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onSkip()}
          disabled={saving}
          className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition disabled:opacity-60 underline-offset-4 hover:underline"
        >
          Je le ferai plus tard
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition hover:opacity-90 disabled:opacity-60 shadow-sm"
          style={{ backgroundColor: '#027e7e' }}
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Enregistrement…
            </>
          ) : (
            <>
              {submitLabel ?? 'Enregistrer et continuer'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
