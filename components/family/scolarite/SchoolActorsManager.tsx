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

/** Couleur par rôle d'acteur scolaire */
const ROLE_STYLES: Record<SchoolActorRole, { bg: string; color: string }> = {
  enseignant_referent_mdph: { bg: '#cffafe', color: '#0891b2' },     // cyan
  medecin_scolaire: { bg: '#fee2e2', color: '#dc2626' },             // rouge
  psy_en: { bg: '#ede9fe', color: '#7c3aed' },                        // violet
  directeur_etablissement: { bg: '#fef3c7', color: '#b45309' },      // ambre
  aesh: { bg: '#d1fae5', color: '#059669' },                          // émeraude
  educateur_specialise: { bg: '#c9eaea', color: '#015c5c' },         // teal
  autre: { bg: '#f3f4f6', color: '#4b5563' },                         // gris
};

const inputClass =
  'w-full border border-gray-200 rounded-xl py-2 px-3 text-sm bg-white focus:outline-none focus:border-[#3a9e9e] focus:ring-2 focus:ring-[#3a9e9e]/20 transition';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#c9eaea' }}
            aria-hidden="true"
          >
            <svg className="w-5 h-5" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3
              className="text-sm sm:text-base font-bold"
              style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
            >
              Acteurs de la scolarité
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
              Enseignant référent MDPH, médecin scolaire, psychologue EN…
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:opacity-90 hover:shadow-md whitespace-nowrap"
            style={{ backgroundColor: '#3a9e9e' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Ajouter un acteur</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2" role="alert">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          className="rounded-xl md:rounded-2xl shadow-sm border overflow-hidden p-4 space-y-3"
          style={{ backgroundColor: '#e6f4f4', borderColor: '#c9eaea' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Rôle <span className="text-red-500">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as SchoolActorRole })
                }
                className={inputClass}
              >
                {SCHOOL_ACTOR_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {SCHOOL_ACTOR_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="M. Martin"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={inputClass}
                placeholder="Disponibilités, jours de présence, remarques administratives…"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#c9eaea]/60">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm text-white rounded-xl font-semibold disabled:opacity-50 hover:opacity-90 hover:shadow-sm transition-all shadow-sm"
              style={{ backgroundColor: '#3a9e9e' }}
            >
              {saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Chargement…
        </div>
      ) : actors.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-8 text-center bg-gray-50/50">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Aucun acteur enregistré pour cette année. Ajoutez les contacts utiles
            (enseignant référent MDPH, médecin scolaire, psy EN…).
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {actors.map((actor) => {
            const roleStyle = ROLE_STYLES[actor.role];
            const initials = getInitials(actor.name);
            return (
              <li
                key={actor.id}
                className="rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-3 sm:p-4 bg-white flex flex-col sm:flex-row sm:items-start gap-3 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                  aria-hidden="true"
                >
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                    >
                      {SCHOOL_ACTOR_ROLE_LABELS[actor.role]}
                    </span>
                  </div>
                  <p
                    className="font-bold text-gray-900 text-sm sm:text-base"
                    style={{ fontFamily: 'Verdana, sans-serif' }}
                  >
                    {actor.name}
                  </p>
                  {(actor.email || actor.phone) && (
                    <div className="mt-1 text-xs sm:text-sm text-gray-600 flex flex-wrap gap-x-3 gap-y-0.5">
                      {actor.email && (
                        <a
                          href={`mailto:${actor.email}`}
                          className="hover:underline inline-flex items-center gap-1"
                          style={{ color: '#3a9e9e' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {actor.email}
                        </a>
                      )}
                      {actor.phone && (
                        <a
                          href={`tel:${actor.phone.replace(/\s+/g, '')}`}
                          className="hover:underline inline-flex items-center gap-1"
                          style={{ color: '#3a9e9e' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
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

                <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => openEdit(actor)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    style={{ color: '#3a9e9e' }}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
