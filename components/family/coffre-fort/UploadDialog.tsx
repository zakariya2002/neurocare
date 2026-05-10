'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ACCEPTED_FILE_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  DOC_SUBTYPES,
  DOC_TYPES,
  DOC_TYPE_LABELS,
  DOC_TYPE_DESCRIPTIONS,
  MAX_FILE_SIZE_BYTES,
  TAG_MAX_COUNT,
  TAG_MAX_LEN,
  formatBytes,
  isAllowedMime,
  type DocType,
} from '@/lib/family/coffre-fort';

interface Props {
  open: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
}

interface FormState {
  doc_type: DocType;
  doc_subtype: string;
  title: string;
  description: string;
  issued_at: string;
  expires_at: string;
  issuer_name: string;
  tags: string;
}

const EMPTY_FORM: FormState = {
  doc_type: 'mdph',
  doc_subtype: '',
  title: '',
  description: '',
  issued_at: '',
  expires_at: '',
  issuer_name: '',
  tags: '',
};

const RED_BG = '#fee2e2';
const RED_BORDER = 'rgba(220, 38, 38, 0.25)';
const RED_TEXT = '#7f1d1d';

export default function UploadDialog({ open, onClose, onUpload }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setForm(EMPTY_FORM);
      setError(null);
      setSubmitting(false);
      setDragOver(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSelectFile = (selected: File | null) => {
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!isAllowedMime(selected.type)) {
      setError(`Format non supporté. Formats acceptés : ${ALLOWED_MIME_TYPES.map((m) => m.split('/')[1]).join(', ').toUpperCase()}.`);
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError(`Fichier trop volumineux (max ${formatBytes(MAX_FILE_SIZE_BYTES)}).`);
      return;
    }
    setFile(selected);
    if (!form.title) {
      const name = selected.name.replace(/\.[^.]+$/, '');
      setForm((s) => ({ ...s, title: name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Sélectionnez un fichier (PDF, JPG ou PNG).');
      return;
    }
    if (!form.title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }

    const tagsArray = form.tags
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, TAG_MAX_COUNT);
    if (tagsArray.some((t) => t.length > TAG_MAX_LEN)) {
      setError(`Chaque tag doit faire moins de ${TAG_MAX_LEN} caractères.`);
      return;
    }

    const formData = new FormData();
    formData.set('file', file);
    formData.set('doc_type', form.doc_type);
    if (form.doc_subtype.trim()) formData.set('doc_subtype', form.doc_subtype.trim());
    formData.set('title', form.title.trim());
    if (form.description.trim()) formData.set('description', form.description.trim());
    if (form.issued_at) formData.set('issued_at', form.issued_at);
    if (form.expires_at) formData.set('expires_at', form.expires_at);
    if (form.issuer_name.trim()) formData.set('issuer_name', form.issuer_name.trim());
    if (tagsArray.length > 0) formData.set('tags', tagsArray.join(','));

    setSubmitting(true);
    try {
      await onUpload(formData);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors de l\'envoi du document.');
    } finally {
      setSubmitting(false);
    }
  };

  const subtypeSuggestions = DOC_SUBTYPES[form.doc_type];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-stretch sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-dialog-title"
    >
      <div className="bg-white sm:rounded-2xl shadow-xl w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden">
        {/* Sticky header rouge pastel */}
        <div
          className="px-4 sm:px-6 py-3.5 border-b flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: RED_BG, borderColor: RED_BORDER }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(220, 38, 38, 0.18)' }}
              aria-hidden="true"
            >
              <svg className="w-5 h-5" fill="none" stroke="#dc2626" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M16 12l-4-4-4 4M12 8v12" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2
                id="upload-dialog-title"
                className="text-base sm:text-lg font-bold truncate"
                style={{ fontFamily: 'Verdana, sans-serif', color: RED_TEXT }}
              >
                Ajouter un document
              </h2>
              <p className="text-[11px] sm:text-xs" style={{ color: '#991b1b' }}>
                Stockage chiffré, partage maîtrisé
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-red-100/60 rounded-lg transition flex-shrink-0"
            aria-label="Fermer"
            disabled={submitting}
          >
            <svg className="w-5 h-5" style={{ color: RED_TEXT }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer?.files?.[0];
                if (f) handleSelectFile(f);
              }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition ${
                dragOver ? 'scale-[1.01] shadow-md' : 'hover:bg-gray-50'
              }`}
              style={{
                borderColor: dragOver ? '#027e7e' : '#d1d5db',
                backgroundColor: dragOver ? 'rgba(2, 126, 126, 0.06)' : 'transparent',
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_FILE_EXTENSIONS}
                onChange={(e) => handleSelectFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {file ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center mb-2">
                    <span
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}
                      aria-hidden="true"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="#027e7e" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 break-all">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {file.type} · {formatBytes(file.size)}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-xs text-red-600 hover:underline mt-1"
                  >
                    Retirer ce fichier
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center mb-2">
                    <span
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(2, 126, 126, 0.08)' }}
                      aria-hidden="true"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="#027e7e" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 0 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-semibold">
                    Glissez-déposez votre document, ou cliquez pour parcourir
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, JPG ou PNG · {formatBytes(MAX_FILE_SIZE_BYTES)} maximum
                  </p>
                </div>
              )}
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={form.doc_type}
                onChange={(e) =>
                  setForm((s) => ({ ...s, doc_type: e.target.value as DocType, doc_subtype: '' }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DOC_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">{DOC_TYPE_DESCRIPTIONS[form.doc_type]}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sous-catégorie (optionnel)
              </label>
              <input
                type="text"
                list="doc-subtypes"
                value={form.doc_subtype}
                onChange={(e) => setForm((s) => ({ ...s, doc_subtype: e.target.value }))}
                maxLength={80}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                placeholder="Ex : Notification MDPH"
              />
              <datalist id="doc-subtypes">
                {subtypeSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                maxLength={200}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Description (optionnel)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                rows={2}
                maxLength={1000}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date d&apos;émission
                </label>
                <input
                  type="date"
                  value={form.issued_at}
                  onChange={(e) => setForm((s) => ({ ...s, issued_at: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date d&apos;expiration
                </label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm((s) => ({ ...s, expires_at: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Émetteur (optionnel)
              </label>
              <input
                type="text"
                value={form.issuer_name}
                onChange={(e) => setForm((s) => ({ ...s, issuer_name: e.target.value }))}
                maxLength={200}
                placeholder="Ex : MDPH 75, Dr. Dupont, Asso ABA Lyon"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tags (optionnel, séparés par virgules)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
                placeholder="Ex : 2026, renouvellement, urgent"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-white flex flex-col-reverse sm:flex-row justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !file}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 shadow-sm"
              style={{ backgroundColor: '#027e7e' }}
            >
              {submitting ? 'Envoi en cours…' : 'Ajouter au coffre-fort'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
