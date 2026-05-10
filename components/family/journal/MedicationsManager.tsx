'use client';

import { useState } from 'react';
import type { ChildMedicationRow } from '@/lib/family/journal';

interface Props {
  childId: string;
  medications: ReadonlyArray<ChildMedicationRow>;
  onChange: () => void;
}

interface FormState {
  name: string;
  dose: string;
  notes: string;
}

const EMPTY_FORM: FormState = { name: '', dose: '', notes: '' };

export default function MedicationsManager({ childId, medications, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  };

  const startEdit = (m: ChildMedicationRow) => {
    setEditingId(m.id);
    setForm({ name: m.name, dose: m.dose ?? '', notes: m.notes ?? '' });
    setError(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Le nom du médicament est obligatoire.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = editingId
        ? `/api/family/children/${childId}/medications/${editingId}`
        : `/api/family/children/${childId}/medications`;
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          dose: form.dose.trim() || null,
          notes: form.notes.trim() || null,
          active: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Erreur enregistrement');
      }
      setOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      onChange();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (m: ChildMedicationRow) => {
    setSaving(true);
    try {
      await fetch(`/api/family/children/${childId}/medications/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: m.name,
          dose: m.dose,
          notes: m.notes,
          active: !m.active,
        }),
      });
      onChange();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: ChildMedicationRow) => {
    if (!confirm(`Supprimer "${m.name}" de la liste ? Les saisies passées sont conservées.`)) return;
    setSaving(true);
    try {
      await fetch(`/api/family/children/${childId}/medications/${m.id}`, {
        method: 'DELETE',
      });
      onChange();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Liste des médicaments</h3>
        <button
          type="button"
          onClick={startCreate}
          className="text-sm font-medium px-3 py-1.5 rounded-lg text-white"
          style={{ backgroundColor: '#027e7e' }}
        >
          Ajouter
        </button>
      </div>

      {medications.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aucun médicament configuré. La saisie quotidienne reste fonctionnelle sans cette
          liste.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {medications.map((m) => (
            <li key={m.id} className="py-2 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {m.name}{' '}
                  {!m.active && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 ml-1">
                      Désactivé
                    </span>
                  )}
                </div>
                {(m.dose || m.notes) && (
                  <div className="text-xs text-gray-500 truncate">
                    {[m.dose, m.notes].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleToggleActive(m)}
                className="text-xs text-gray-600 hover:text-gray-900"
                disabled={saving}
              >
                {m.active ? 'Désactiver' : 'Réactiver'}
              </button>
              <button
                type="button"
                onClick={() => startEdit(m)}
                className="text-xs text-teal-700 hover:underline"
                disabled={saving}
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => handleDelete(m)}
                className="text-xs text-red-600 hover:underline"
                disabled={saving}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-3"
        >
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nom du médicament</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              maxLength={120}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Dose / posologie (optionnel)</label>
            <input
              type="text"
              value={form.dose}
              onChange={(e) => setForm((s) => ({ ...s, dose: e.target.value }))}
              maxLength={120}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
              maxLength={500}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-white"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
              style={{ backgroundColor: '#027e7e' }}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
