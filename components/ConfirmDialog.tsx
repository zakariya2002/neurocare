'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

type Variant = 'info' | 'warning' | 'danger';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}

export interface PromptOptions extends ConfirmOptions {
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'email' | 'url';
  required?: boolean;
  multiline?: boolean;
}

type DialogState =
  | { type: 'confirm'; opts: ConfirmOptions; resolve: (value: boolean) => void }
  | { type: 'prompt'; opts: PromptOptions; resolve: (value: string | null) => void };

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx.confirm;
}

export function usePrompt() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('usePrompt must be used within <ConfirmProvider>');
  return ctx.prompt;
}

const VARIANT_STYLES: Record<
  Variant,
  { iconBg: string; iconColor: string; confirmBtn: string; icon: React.ReactNode }
> = {
  info: {
    iconBg: 'bg-teal-50',
    iconColor: '#027e7e',
    confirmBtn: 'text-white',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    iconBg: 'bg-amber-50',
    iconColor: '#d97706',
    confirmBtn: 'text-white',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  danger: {
    iconBg: 'bg-red-50',
    iconColor: '#dc2626',
    confirmBtn: 'text-white',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const VARIANT_BTN_COLOR: Record<Variant, string> = {
  info: '#027e7e',
  warning: '#d97706',
  danger: '#dc2626',
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [mounted, setMounted] = useState(false);
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      setDialog({ type: 'confirm', opts, resolve });
    });
  }, []);

  const prompt = useCallback((opts: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      setInputValue(opts.defaultValue ?? '');
      setInputError('');
      setDialog({ type: 'prompt', opts, resolve });
    });
  }, []);

  const close = useCallback(() => {
    setDialog(null);
    setInputValue('');
    setInputError('');
    previousActiveElement.current?.focus?.();
  }, []);

  const handleConfirm = useCallback(() => {
    if (!dialog) return;
    if (dialog.type === 'confirm') {
      dialog.resolve(true);
      close();
      return;
    }
    // prompt
    const value = inputValue.trim();
    if (dialog.opts.required && !value) {
      setInputError('Ce champ est requis');
      return;
    }
    dialog.resolve(value || (dialog.opts.required ? '' : inputValue));
    close();
  }, [dialog, inputValue, close]);

  const handleCancel = useCallback(() => {
    if (!dialog) return;
    if (dialog.type === 'confirm') dialog.resolve(false);
    else dialog.resolve(null);
    close();
  }, [dialog, close]);

  useEffect(() => {
    if (!dialog) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter') {
        const activeTag = (document.activeElement as HTMLElement)?.tagName;
        // on prompt: Enter on input confirms, except on textarea
        if (dialog.type === 'prompt' && activeTag === 'TEXTAREA') return;
        e.preventDefault();
        handleConfirm();
      }
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      if (dialog.type === 'prompt' && inputRef.current) {
        inputRef.current.focus();
        if ('select' in inputRef.current) inputRef.current.select();
      } else if (primaryBtnRef.current) {
        primaryBtnRef.current.focus();
      }
    }, 30);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [dialog, handleCancel, handleConfirm]);

  const value: ConfirmContextValue = { confirm, prompt };

  const renderDialog = () => {
    if (!dialog) return null;
    const variant = dialog.opts.variant ?? 'info';
    const style = VARIANT_STYLES[variant];
    const btnColor = VARIANT_BTN_COLOR[variant];
    const confirmLabel =
      dialog.opts.confirmLabel ?? (dialog.type === 'prompt' ? 'Valider' : 'Confirmer');
    const cancelLabel = dialog.opts.cancelLabel ?? 'Annuler';
    const isPrompt = dialog.type === 'prompt';
    const promptOpts = isPrompt ? (dialog.opts as PromptOptions) : null;

    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ animation: 'confirmOverlayIn 0.15s ease-out' }}
      >
        <div
          className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          onClick={handleCancel}
          aria-hidden="true"
        />
        <div
          role="alertdialog"
          aria-labelledby="confirm-title"
          aria-describedby={dialog.opts.message ? 'confirm-message' : undefined}
          aria-modal="true"
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          style={{ animation: 'confirmDialogIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${style.iconBg}`}
                style={{ color: style.iconColor }}
              >
                {style.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h2
                  id="confirm-title"
                  className="text-base sm:text-lg font-bold text-gray-900 leading-snug"
                >
                  {dialog.opts.title}
                </h2>
                {dialog.opts.message && (
                  <p
                    id="confirm-message"
                    className="mt-1.5 text-sm text-gray-600 whitespace-pre-line leading-relaxed"
                  >
                    {dialog.opts.message}
                  </p>
                )}
              </div>
            </div>

            {isPrompt && promptOpts && (
              <div className="mt-4 ml-[60px]">
                {promptOpts.multiline ? (
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    rows={3}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    placeholder={promptOpts.placeholder}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': btnColor } as React.CSSProperties}
                  />
                ) : (
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type={promptOpts.inputType ?? 'text'}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    placeholder={promptOpts.placeholder}
                    required={promptOpts.required}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': btnColor } as React.CSSProperties}
                  />
                )}
                {inputError && (
                  <p className="mt-1.5 text-xs text-red-600">{inputError}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 px-5 sm:px-6 pb-5 sm:pb-6 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90 ${style.confirmBtn}`}
              style={{ backgroundColor: btnColor }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes confirmOverlayIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes confirmDialogIn {
            from {
              opacity: 0;
              transform: scale(0.96) translateY(8px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
      </div>
    );
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {mounted && dialog && createPortal(renderDialog(), document.body)}
    </ConfirmContext.Provider>
  );
}
