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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="reminder-modal-title">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 id="reminder-modal-title" className="text-base sm:text-lg font-bold text-gray-900">
            {editing ? 'Modifier l’échéance' : 'Ajouter une échéance'}
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="p-1 text-gray-400 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {!editing && (
            <div>
              <label htmlFor="rem-child" className="block text-sm font-semibold text-gray-700 mb-1">
                Proche concerné
              </label>
              <select
                id="rem-child"
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#027e7e] focus:border-transparent"
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
            <label htmlFor="rem-type" className="block text-sm font-semibold text-gray-700 mb-1">
              Type d’échéance
            </label>
            <select
              id="rem-type"
              value={type}
              onChange={(e) => setType(e.target.value as ReminderType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#027e7e] focus:border-transparent"
              required
            >
              {REMINDER_TYPES.map((t) => (
                <option key={t} value={t}>{REMINDER_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rem-expires" className="block text-sm font-semibold text-gray-700 mb-1">
              Date d’expiration
            </label>
            <input
              id="rem-expires"
              type="date"
              value={expiresAt}
              min={editing ? undefined : minDate}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#027e7e] focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Vous recevrez un rappel à 3 mois, 2 mois, 1 mois et 1 semaine de cette date.
            </p>
          </div>

          <div>
            <label htmlFor="rem-label" className="block text-sm font-semibold text-gray-700 mb-1">
              Libellé <span className="font-normal text-gray-500">(facultatif)</span>
            </label>
            <input
              id="rem-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex : Notification CDAPH 2024"
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#027e7e] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="rem-notes" className="block text-sm font-semibold text-gray-700 mb-1">
              Notes <span className="font-normal text-gray-500">(facultatif)</span>
            </label>
            <textarea
              id="rem-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Ex : numéro de dossier, démarches déjà engagées…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#027e7e] focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#027e7e' }}
              disabled={saving}
            >
              {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
