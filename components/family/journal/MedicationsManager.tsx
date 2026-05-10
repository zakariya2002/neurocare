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

const ICON_PILL =
  'M10.5 20.5a7 7 0 0 1-9.9-9.9l9.9-9.9a7 7 0 0 1 9.9 9.9zM8.5 8.5l7 7';

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
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div
        className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 border-b border-gray-100"
        style={{ backgroundColor: 'rgba(217, 119, 6, 0.06)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(217, 119, 6, 0.18)' }}
            aria-hidden="true"
          >
            <svg className="w-5 h-5" fill="none" stroke="#d97706" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PILL} />
            </svg>
          </span>
          <h3
            className="text-sm sm:text-base font-bold truncate"
            style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
          >
            Liste des médicaments
          </h3>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full text-white transition hover:opacity-90 shadow-sm"
          style={{ backgroundColor: '#d97706' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un médicament
        </button>
      </div>

      <div className="p-4 sm:p-5">
        {medications.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun médicament configuré. La saisie quotidienne reste fonctionnelle sans cette liste.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {medications.map((m) => (
              <li key={m.id} className="py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                    <span>{m.name}</span>
                    {!m.active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">
                        Désactivé
                      </span>
                    )}
                  </div>
                  {(m.dose || m.notes) && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {[m.dose, m.notes].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(m)}
                    className="text-xs px-2 py-1 rounded-md text-gray-600 hover:bg-gray-100"
                    disabled={saving}
                  >
                    {m.active ? 'Désactiver' : 'Réactiver'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="text-xs px-2 py-1 rounded-md hover:bg-teal-50"
                    style={{ color: '#027e7e' }}
                    disabled={saving}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m)}
                    className="text-xs px-2 py-1 rounded-md text-red-600 hover:bg-red-50"
                    disabled={saving}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {open && (
          <form
            onSubmit={handleSubmit}
            className="mt-4 p-4 rounded-xl border space-y-3"
            style={{ borderColor: 'rgba(217, 119, 6, 0.25)', backgroundColor: '#fefbef' }}
          >
            <h4 className="text-sm font-semibold" style={{ color: '#78350f' }}>
              {editingId ? 'Modifier le médicament' : 'Nouveau médicament'}
            </h4>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nom du médicament</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                maxLength={120}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dose / posologie (optionnel)</label>
              <input
                type="text"
                value={form.dose}
                onChange={(e) => setForm((s) => ({ ...s, dose: e.target.value }))}
                maxLength={120}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Notes (optionnel)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm bg-white"
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
                className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50 shadow-sm"
                style={{ backgroundColor: '#d97706' }}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
