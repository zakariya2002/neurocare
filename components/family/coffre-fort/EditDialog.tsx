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
      <div className="bg-white sm:rounded-2xl shadow-xl w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 id="edit-dialog-title" className="text-lg font-bold text-gray-900">
            Modifier le document
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Fermer"
            disabled={saving}
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Catégorie</label>
            <select
              value={form.doc_type}
              onChange={(e) =>
                setForm((s) => (s ? { ...s, doc_type: e.target.value as DocType, doc_subtype: '' } : s))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
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

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
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
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
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
