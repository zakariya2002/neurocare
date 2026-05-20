'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/admin/ui';

interface RejectionDialogProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const MIN_LENGTH = 20;

export function RejectionDialog({ open, loading = false, onClose, onConfirm }: RejectionDialogProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setTouched(false);
    }
  }, [open]);

  if (!open) return null;

  const trimmed = reason.trim();
  const tooShort = trimmed.length < MIN_LENGTH;
  const showError = touched && tooShort;

  const handleConfirm = () => {
    setTouched(true);
    if (tooShort) return;
    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rejection-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-admin-surface-dark rounded-xl shadow-xl border border-gray-200 dark:border-admin-border-dark">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-admin-border-dark">
          <h2
            id="rejection-dialog-title"
            className="text-lg font-bold text-gray-900 dark:text-admin-text-dark"
          >
            Refuser l&apos;annonce
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
            Indiquez clairement la raison du refus. Elle sera transmise à la famille
            pour qu&apos;elle puisse corriger son annonce.
          </p>
        </div>

        <div className="px-6 py-4 space-y-2">
          <label
            htmlFor="rejection-reason"
            className="block text-sm font-medium text-gray-700 dark:text-admin-text-dark"
          >
            Raison du refus (minimum {MIN_LENGTH} caractères)
          </label>
          <textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            rows={5}
            disabled={loading}
            placeholder="Ex : description trop vague, zone géographique trop large, propos inappropriés…"
            className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-admin-surface-dark text-gray-900 dark:text-admin-text-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              showError
                ? 'border-red-400 dark:border-red-700'
                : 'border-gray-300 dark:border-admin-border-dark'
            }`}
          />
          <div className="flex items-center justify-between text-xs">
            <span
              className={
                showError
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-admin-muted-dark'
              }
            >
              {showError
                ? `Encore ${MIN_LENGTH - trimmed.length} caractère${MIN_LENGTH - trimmed.length > 1 ? 's' : ''} minimum`
                : `${trimmed.length}/${MIN_LENGTH} minimum`}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-admin-border-dark flex justify-end gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            size="md"
            loading={loading}
            onClick={handleConfirm}
          >
            Confirmer le refus
          </Button>
        </div>
      </div>
    </div>
  );
}
