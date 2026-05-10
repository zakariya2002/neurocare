'use client';

import { useEffect, useState } from 'react';
import {
  REMINDER_TYPES,
  REMINDER_TYPE_LABELS,
  type FamilyAdminReminderRow,
  type ReminderType,
} from '@/lib/family/reminders-mdph';

interface Child {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface Props {
  children: Child[];
  editing: FamilyAdminReminderRow | null;
  onClose: () => void;
  onSaved: (r: FamilyAdminReminderRow) => void;
}

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-[#027e7e] focus:ring-2 focus:ring-[#027e7e]/20 outline-none transition placeholder:text-gray-400';

export default function ReminderModal({ children, editing, onClose, onSaved }: Props) {
  const [childId, setChildId] = useState<string>(editing?.child_id ?? children[0]?.id ?? '');
  const [type, setType] = useState<ReminderType>((editing?.type as ReminderType) ?? 'mdph_renew');
  const [expiresAt, setExpiresAt] = useState<string>(editing?.expires_at ?? '');
  const [label, setLabel] = useState<string>(editing?.label ?? '');
  const [notes, setNotes] = useState<string>(editing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!childId) { setError('Sélectionnez un proche'); return; }
    if (!expiresAt) { setError('Indiquez une date d’expiration'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) { setError('Format de date invalide'); return; }

    setSaving(true);
    try {
      let res: Response;
      if (editing) {
        res = await fetch('/api/family/reminders', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: editing.id,
            type,
            expires_at: expiresAt,
            label: label.trim() || null,
            notes: notes.trim() || null,
          }),
        });
      } else {
        res = await fetch('/api/family/reminders', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            child_id: childId,
            type,
            expires_at: expiresAt,
            label: label.trim() || null,
            notes: notes.trim() || null,
          }),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erreur serveur');
      onSaved(json.reminder as FamilyAdminReminderRow);
    } catch (e: any) {
      setError(e?.message || 'Erreur inattendue');
    } finally {
      setSaving(false);
    }
  };

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-stretch sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header sticky */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
              <svg className="w-5 h-5" style={{ color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 id="reminder-modal-title" className="text-base sm:text-lg font-bold text-gray-900 truncate" style={{ fontFamily: 'Verdana, sans-serif' }}>
              {editing ? 'Modifier l’échéance' : 'Ajouter une échéance'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 -m-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
            {!editing && (
              <div>
                <label htmlFor="rem-child" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Proche concerné
                </label>
                <select
                  id="rem-child"
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className={inputClass}
                  required
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name}{c.last_name ? ' ' + c.last_name : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="rem-type" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Type d’échéance
              </label>
              <select
                id="rem-type"
                value={type}
                onChange={(e) => setType(e.target.value as ReminderType)}
                className={inputClass}
                required
              >
                {REMINDER_TYPES.map((t) => (
                  <option key={t} value={t}>{REMINDER_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="rem-expires" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Date d’expiration
              </label>
              <input
                id="rem-expires"
                type="date"
                value={expiresAt}
                min={editing ? undefined : minDate}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={inputClass}
                required
              />
              <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Vous recevrez un rappel à 3&nbsp;mois, 2&nbsp;mois, 1&nbsp;mois et 1&nbsp;semaine de cette date.
              </p>
            </div>

            <div>
              <label htmlFor="rem-label" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Libellé <span className="font-normal text-gray-500">(facultatif)</span>
              </label>
              <input
                id="rem-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex : Notification CDAPH 2024"
                maxLength={200}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="rem-notes" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notes <span className="font-normal text-gray-500">(facultatif)</span>
              </label>
              <textarea
                id="rem-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Ex : numéro de dossier, démarches déjà engagées…"
                className={inputClass}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}
          </div>

          {/* Footer sticky */}
          <div
            className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 px-4 sm:px-5 py-3.5 border-t border-gray-100 bg-white flex-shrink-0"
            style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition hover:opacity-90 disabled:opacity-60 shadow-sm"
              style={{ backgroundColor: '#027e7e' }}
              disabled={saving}
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
                editing ? 'Enregistrer' : 'Ajouter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
