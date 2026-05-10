'use client';

import { useEffect, useState } from 'react';
import {
  DOC_SUBTYPES,
  DOC_TYPES,
  DOC_TYPE_LABELS,
  TAG_MAX_COUNT,
  TAG_MAX_LEN,
  type ChildDocumentRow,
  type DocType,
} from '@/lib/family/coffre-fort';

interface Props {
  open: boolean;
  document: ChildDocumentRow | null;
  onClose: () => void;
  onSave: (
    docId: string,
    payload: {
      doc_type: DocType;
      doc_subtype: string | null;
      title: string;
      description: string | null;
      issued_at: string | null;
      expires_at: string | null;
      issuer_name: string | null;
      tags: string[];
    }
  ) => Promise<void>;
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

const RED_BG = '#fee2e2';
const RED_BORDER = 'rgba(220, 38, 38, 0.25)';
const RED_TEXT = '#7f1d1d';

export default function EditDialog({ open, document, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && document) {
      setForm({
        doc_type: document.doc_type,
        doc_subtype: document.doc_subtype ?? '',
        title: document.title,
        description: document.description ?? '',
        issued_at: document.issued_at ?? '',
        expires_at: document.expires_at ?? '',
        issuer_name: document.issuer_name ?? '',
        tags: document.tags.join(', '),
      });
      setError(null);
      setSaving(false);
    } else if (!open) {
      setForm(null);
      setError(null);
      setSaving(false);
    }
  }, [open, document]);

  if (!open || !document || !form) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    const tags = form.tags
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, TAG_MAX_COUNT);
    if (tags.some((t) => t.length > TAG_MAX_LEN)) {
      setError(`Chaque tag doit faire moins de ${TAG_MAX_LEN} caractères.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(document.id, {
        doc_type: form.doc_type,
        doc_subtype: form.doc_subtype.trim() || null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        issued_at: form.issued_at || null,
        expires_at: form.expires_at || null,
        issuer_name: form.issuer_name.trim() || null,
        tags,
      });
    } catch (err: any) {
      setError(err?.message ?? 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-stretch sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-dialog-title"
    >
      <div className="bg-white sm:rounded-2xl shadow-xl w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden">
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2
                id="edit-dialog-title"
                className="text-base sm:text-lg font-bold truncate"
                style={{ fontFamily: 'Verdana, sans-serif', color: RED_TEXT }}
              >
                Modifier le document
              </h2>
              <p className="text-[11px] sm:text-xs truncate" style={{ color: '#991b1b' }}>
                {document.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-red-100/60 rounded-lg transition flex-shrink-0"
            aria-label="Fermer"
            disabled={saving}
          >
            <svg className="w-5 h-5" style={{ color: RED_TEXT }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto p-4 sm:p-6 space-y-3 flex-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Catégorie</label>
              <select
                value={form.doc_type}
                onChange={(e) =>
                  setForm((s) => (s ? { ...s, doc_type: e.target.value as DocType, doc_subtype: '' } : s))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DOC_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sous-catégorie</label>
              <input
                type="text"
                list="edit-doc-subtypes"
                value={form.doc_subtype}
                onChange={(e) => setForm((s) => (s ? { ...s, doc_subtype: e.target.value } : s))}
                maxLength={80}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
              <datalist id="edit-doc-subtypes">
                {DOC_SUBTYPES[form.doc_type].map((s) => (
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
                onChange={(e) => setForm((s) => (s ? { ...s, title: e.target.value } : s))}
                maxLength={200}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((s) => (s ? { ...s, description: e.target.value } : s))}
                rows={2}
                maxLength={1000}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Émis le</label>
                <input
                  type="date"
                  value={form.issued_at}
                  onChange={(e) => setForm((s) => (s ? { ...s, issued_at: e.target.value } : s))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Expire le</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm((s) => (s ? { ...s, expires_at: e.target.value } : s))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Émetteur</label>
              <input
                type="text"
                value={form.issuer_name}
                onChange={(e) => setForm((s) => (s ? { ...s, issuer_name: e.target.value } : s))}
                maxLength={200}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((s) => (s ? { ...s, tags: e.target.value } : s))}
                placeholder="Séparés par virgules"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-white flex flex-col-reverse sm:flex-row justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 shadow-sm"
              style={{ backgroundColor: '#027e7e' }}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
