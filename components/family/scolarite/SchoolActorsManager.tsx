'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  SCHOOL_ACTOR_ROLES,
  SCHOOL_ACTOR_ROLE_LABELS,
  type SchoolActorRole,
  type SchoolActorRow,
} from '@/lib/family/scolarite';

interface SchoolActorsManagerProps {
  childId: string;
  yearId: string;
}

interface ActorFormState {
  role: SchoolActorRole;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

const emptyForm: ActorFormState = {
  role: 'enseignant_referent_mdph',
  name: '',
  email: '',
  phone: '',
  notes: '',
};

export default function SchoolActorsManager({ childId, yearId }: SchoolActorsManagerProps) {
  const [actors, setActors] = useState<SchoolActorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ActorFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const baseUrl = `/api/family/children/${childId}/scolarite/${yearId}/actors`;

  const fetchActors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(baseUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error('Impossible de charger les acteurs');
      const json = await res.json();
      setActors(json.actors ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearId]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (actor: SchoolActorRow) => {
    setForm({
      role: actor.role,
      name: actor.name,
      email: actor.email ?? '',
      phone: actor.phone ?? '',
      notes: actor.notes ?? '',
    });
    setEditingId(actor.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const payload = {
        role: form.role,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
      };

      const url = editingId ? `${baseUrl}/${editingId}` : baseUrl;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Erreur lors de l\'enregistrement');
      }
      await fetchActors();
      closeForm();
    } catch (e: any) {
      setError(e.message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (actorId: string) => {
    if (!confirm('Supprimer ce contact ?')) return;
    try {
      const res = await fetch(`${baseUrl}/${actorId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Suppression impossible');
      await fetchActors();
    } catch (e: any) {
      setError(e.message ?? 'Erreur');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Acteurs de la scolarité
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Enseignant référent MDPH, médecin scolaire, psychologue EN…
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openAdd}
            className="px-3 py-2 sm:px-4 sm:py-2.5 text-white rounded-lg font-semibold text-xs sm:text-sm hover:opacity-90 transition shadow-sm flex items-center gap-1.5"
            style={{ backgroundColor: '#027e7e' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded-r text-sm" role="alert">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rôle <span className="text-red-500">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as SchoolActorRole })
                }
                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm bg-white focus:ring-2 focus:outline-none"
                style={{ ['--tw-ring-color' as any]: '#027e7e' }}
              >
                {SCHOOL_ACTOR_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {SCHOOL_ACTOR_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:outline-none"
                style={{ ['--tw-ring-color' as any]: '#027e7e' }}
                placeholder="M. Martin"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:outline-none"
                style={{ ['--tw-ring-color' as any]: '#027e7e' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:outline-none"
                style={{ ['--tw-ring-color' as any]: '#027e7e' }}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:outline-none"
                style={{ ['--tw-ring-color' as any]: '#027e7e' }}
                placeholder="Disponibilités, jours de présence, remarques administratives…"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm text-white rounded-lg font-semibold disabled:opacity-50"
              style={{ backgroundColor: '#027e7e' }}
            >
              {saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : actors.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-500">
            Aucun acteur enregistré pour cette année. Ajoutez les contacts utiles
            (enseignant référent MDPH, médecin scolaire, psy EN…).
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {actors.map((actor) => (
            <li
              key={actor.id}
              className="border border-gray-200 rounded-xl p-3 sm:p-4 bg-white flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border"
                    style={{
                      backgroundColor: 'rgba(2, 126, 126, 0.08)',
                      color: '#027e7e',
                      borderColor: 'rgba(2, 126, 126, 0.25)',
                    }}
                  >
                    {SCHOOL_ACTOR_ROLE_LABELS[actor.role]}
                  </span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {actor.name}
                  </span>
                </div>
                {(actor.email || actor.phone) && (
                  <div className="mt-1.5 text-xs sm:text-sm text-gray-600 flex flex-wrap gap-x-3 gap-y-0.5">
                    {actor.email && (
                      <a
                        href={`mailto:${actor.email}`}
                        className="hover:underline"
                        style={{ color: '#027e7e' }}
                      >
                        {actor.email}
                      </a>
                    )}
                    {actor.phone && (
                      <a
                        href={`tel:${actor.phone.replace(/\s+/g, '')}`}
                        className="hover:underline"
                        style={{ color: '#027e7e' }}
                      >
                        {actor.phone}
                      </a>
                    )}
                  </div>
                )}
                {actor.notes && (
                  <p className="mt-1.5 text-xs sm:text-sm text-gray-600 whitespace-pre-line">
                    {actor.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(actor)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition"
                  style={{ color: '#027e7e' }}
                  title="Modifier"
                  aria-label="Modifier le contact"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => remove(actor.id)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                  title="Supprimer"
                  aria-label="Supprimer le contact"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
