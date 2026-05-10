'use client';

interface StepActionsProps {
  saving: boolean;
  onBack?: () => void;
  onSkip: () => Promise<void> | void;
  submitLabel?: string;
}

export default function StepActions({ saving, onBack, onSkip, submitLabel }: StepActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 mt-4">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            disabled={saving}
          >
            Retour
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSkip()}
          disabled={saving}
          className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
        >
          Je le ferai plus tard
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition disabled:opacity-60"
          style={{ backgroundColor: '#027e7e' }}
        >
          {saving ? 'Enregistrement…' : (submitLabel ?? 'Enregistrer et continuer')}
        </button>
      </div>
    </div>
  );
}
