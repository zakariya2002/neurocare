'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseHealth } from '@/lib/supabase-health';
import {
  EMOTIONS,
  EMOTION_LABELS,
  EMOTION_COLORS,
  MEAL_TAGS,
  MEAL_TAG_LABELS,
  BEHAVIOR_TAGS,
  BEHAVIOR_TAG_LABELS,
  CONTEXT_TAGS,
  CONTEXT_TAG_LABELS,
  FREE_NOTE_MAX,
  frenchDateLabel,
  type ChildDailyLogRow,
  type ChildMedicationRow,
  type Emotion,
  type MealTag,
  type BehaviorTag,
  type ContextTag,
  type MedicationIntake,
  type DailyLogPayload,
} from '@/lib/family/journal';

interface Props {
  childId: string;
  userId: string;
  date: string;
  initialLog: ChildDailyLogRow | null;
  medications: ReadonlyArray<ChildMedicationRow>;
  saving: boolean;
  canEdit: boolean;
  onSubmit: (payload: DailyLogPayload) => void;
  onCancel?: () => void;
}

interface FormState {
  sleep_bedtime: string;
  sleep_waketime: string;
  sleep_quality: number | null;
  night_wakings: string;
  meals_score: number | null;
  meal_tags: MealTag[];
  emotion_main: Emotion | null;
  emotion_intensity: number | null;
  behavior_tags: BehaviorTag[];
  context_tags: ContextTag[];
  free_note: string;
  photo_path: string | null;
  medications: Map<string, MedicationIntake>;
}

function buildInitial(
  log: ChildDailyLogRow | null,
  meds: ReadonlyArray<ChildMedicationRow>
): FormState {
  const medMap = new Map<string, MedicationIntake>();
  if (log) {
    for (const m of log.medications_taken ?? []) {
      medMap.set(m.med_id, m);
    }
  }
  // S'assurer que chaque médoc actif a une entrée dans la map
  for (const med of meds) {
    if (!medMap.has(med.id)) {
      medMap.set(med.id, { med_id: med.id, taken: false, time: null });
    }
  }
  return {
    sleep_bedtime: log?.sleep_bedtime ?? '',
    sleep_waketime: log?.sleep_waketime ?? '',
    sleep_quality: log?.sleep_quality ?? null,
    night_wakings: log?.night_wakings !== null && log?.night_wakings !== undefined ? String(log.night_wakings) : '',
    meals_score: log?.meals_score ?? null,
    meal_tags: log?.meal_tags ?? [],
    emotion_main: log?.emotion_main ?? null,
    emotion_intensity: log?.emotion_intensity ?? null,
    behavior_tags: log?.behavior_tags ?? [],
    context_tags: log?.context_tags ?? [],
    free_note: log?.free_note ?? '',
    photo_path: log?.photo_path ?? null,
    medications: medMap,
  };
}

function StarPicker({
  value,
  onChange,
  ariaLabel,
  disabled,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === n ? null : n)}
          className={`p-1 rounded transition ${value !== null && n <= value ? '' : 'opacity-40'}`}
          aria-pressed={value === n}
          aria-label={`${n} sur 5`}
        >
          <svg
            className="w-7 h-7"
            fill={value !== null && n <= value ? '#facc15' : '#e5e7eb'}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function TagToggle<T extends string>({
  tags,
  labels,
  selected,
  onToggle,
  disabled,
  colorAccent,
}: {
  tags: ReadonlyArray<T>;
  labels: Record<T, string>;
  selected: ReadonlyArray<T>;
  onToggle: (tag: T) => void;
  disabled?: boolean;
  colorAccent?: string;
}) {
  const accent = colorAccent ?? '#027e7e';
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => {
        const isOn = selected.includes(t);
        return (
          <button
            key={t}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(t)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              isOn ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: isOn ? accent : '#ffffff',
              borderColor: isOn ? accent : '#d1d5db',
            }}
            aria-pressed={isOn}
          >
            {labels[t]}
          </button>
        );
      })}
    </div>
  );
}

export default function DailyLogForm({
  childId,
  userId,
  date,
  initialLog,
  medications,
  saving,
  canEdit,
  onSubmit,
  onCancel,
}: Props) {
  const [state, setState] = useState<FormState>(() => buildInitial(initialLog, medications));
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    setState(buildInitial(initialLog, medications));
    setPhotoPreview(null);
    setPhotoError(null);
  }, [initialLog, medications, date]);

  // Charger l'aperçu de la photo (signed URL) si présente
  useEffect(() => {
    let cancelled = false;
    const path = state.photo_path;
    if (!path) {
      setPhotoPreview(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/family/children/${childId}/journal/photo?path=${encodeURIComponent(path)}`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setPhotoPreview(json.signedUrl ?? null);
      } catch {
        // silencieux
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [childId, state.photo_path]);

  const remainingChars = useMemo(
    () => FREE_NOTE_MAX - state.free_note.length,
    [state.free_note]
  );

  const toggle = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo trop volumineuse (max 5 Mo).');
      return;
    }
    setPhotoUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${userId}/${childId}/${date}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabaseHealth.storage
        .from('health-journal-photos')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (upErr) throw upErr;

      // Supprimer l'ancienne photo si remplacée
      if (state.photo_path && state.photo_path !== path) {
        await supabaseHealth.storage
          .from('health-journal-photos')
          .remove([state.photo_path])
          .catch(() => undefined);
      }
      setState((s) => ({ ...s, photo_path: path }));
    } catch (err: any) {
      setPhotoError(err?.message ?? 'Échec de l\'upload.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    const path = state.photo_path;
    if (!path) return;
    try {
      await supabaseHealth.storage
        .from('health-journal-photos')
        .remove([path])
        .catch(() => undefined);
    } finally {
      setState((s) => ({ ...s, photo_path: null }));
      setPhotoPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nightWakings = state.night_wakings.trim() === ''
      ? null
      : Number(state.night_wakings);
    const payload: DailyLogPayload = {
      log_date: date,
      sleep_bedtime: state.sleep_bedtime || null,
      sleep_waketime: state.sleep_waketime || null,
      sleep_quality: state.sleep_quality,
      night_wakings: Number.isFinite(nightWakings) ? (nightWakings as number) : null,
      meals_score: state.meals_score,
      meal_tags: state.meal_tags,
      emotion_main: state.emotion_main,
      emotion_intensity: state.emotion_intensity,
      behavior_tags: state.behavior_tags,
      medications_taken: Array.from(state.medications.values()).filter((m) => m.taken),
      context_tags: state.context_tags,
      photo_path: state.photo_path,
      free_note: state.free_note.trim() || null,
    };
    onSubmit(payload);
  };

  const disabled = saving || !canEdit;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-1 capitalize">
          {frenchDateLabel(date)}
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Aucune saisie n&apos;est obligatoire. Notez ce qui vous semble utile.
        </p>

        {/* Sommeil */}
        <fieldset className="mb-6" disabled={disabled}>
          <legend className="text-sm font-semibold text-gray-800 mb-3">Sommeil</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-600">Heure du coucher</span>
              <input
                type="time"
                value={state.sleep_bedtime}
                onChange={(e) => setState((s) => ({ ...s, sleep_bedtime: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600">Heure du réveil</span>
              <input
                type="time"
                value={state.sleep_waketime}
                onChange={(e) => setState((s) => ({ ...s, sleep_waketime: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-600">Qualité ressentie</span>
            <StarPicker
              value={state.sleep_quality}
              onChange={(n) => setState((s) => ({ ...s, sleep_quality: n }))}
              ariaLabel="Qualité du sommeil"
              disabled={disabled}
            />
          </div>
          <div className="mt-3">
            <label className="block">
              <span className="text-xs text-gray-600">Nombre de réveils nocturnes</span>
              <input
                type="number"
                min={0}
                max={20}
                inputMode="numeric"
                value={state.night_wakings}
                onChange={(e) => setState((s) => ({ ...s, night_wakings: e.target.value }))}
                className="mt-1 w-32 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </label>
          </div>
        </fieldset>

        {/* Repas */}
        <fieldset className="mb-6" disabled={disabled}>
          <legend className="text-sm font-semibold text-gray-800 mb-3">Repas</legend>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-xs text-gray-600">Qualité globale</span>
            <StarPicker
              value={state.meals_score}
              onChange={(n) => setState((s) => ({ ...s, meals_score: n }))}
              ariaLabel="Score repas"
              disabled={disabled}
            />
          </div>
          <TagToggle
            tags={MEAL_TAGS}
            labels={MEAL_TAG_LABELS}
            selected={state.meal_tags}
            onToggle={(t) => setState((s) => ({ ...s, meal_tags: toggle(s.meal_tags, t) }))}
            disabled={disabled}
          />
        </fieldset>

        {/* Comportements */}
        <fieldset className="mb-6" disabled={disabled}>
          <legend className="text-sm font-semibold text-gray-800 mb-3">Comportements observés</legend>
          <TagToggle
            tags={BEHAVIOR_TAGS}
            labels={BEHAVIOR_TAG_LABELS}
            selected={state.behavior_tags}
            onToggle={(t) => setState((s) => ({ ...s, behavior_tags: toggle(s.behavior_tags, t) }))}
            disabled={disabled}
          />
        </fieldset>

        {/* Émotion */}
        <fieldset className="mb-6" disabled={disabled}>
          <legend className="text-sm font-semibold text-gray-800 mb-3">Émotion principale du jour</legend>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => {
              const isOn = state.emotion_main === e;
              return (
                <button
                  key={e}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      emotion_main: isOn ? null : e,
                      emotion_intensity: isOn ? null : (s.emotion_intensity ?? 3),
                    }))
                  }
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    isOn ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: isOn ? EMOTION_COLORS[e] : '#ffffff',
                    borderColor: isOn ? EMOTION_COLORS[e] : '#d1d5db',
                  }}
                  aria-pressed={isOn}
                >
                  {EMOTION_LABELS[e]}
                </button>
              );
            })}
          </div>
          {state.emotion_main && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-xs text-gray-600">Intensité</span>
              <StarPicker
                value={state.emotion_intensity}
                onChange={(n) => setState((s) => ({ ...s, emotion_intensity: n }))}
                ariaLabel="Intensité de l'émotion"
                disabled={disabled}
              />
            </div>
          )}
        </fieldset>

        {/* Médicaments */}
        <fieldset className="mb-6" disabled={disabled}>
          <legend className="text-sm font-semibold text-gray-800 mb-3">Médicaments pris</legend>
          {medications.length === 0 ? (
            <p className="text-xs text-gray-500">
              Aucun médicament n&apos;est encore configuré pour cet enfant.
            </p>
          ) : (
            <ul className="space-y-2">
              {medications.map((med) => {
                const intake = state.medications.get(med.id);
                const taken = !!intake?.taken;
                return (
                  <li
                    key={med.id}
                    className="flex flex-wrap items-center gap-3 p-2 rounded-lg border border-gray-200"
                  >
                    <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taken}
                        onChange={(ev) => {
                          const checked = ev.target.checked;
                          setState((s) => {
                            const next = new Map(s.medications);
                            const cur = next.get(med.id) ?? {
                              med_id: med.id,
                              taken: false,
                              time: null,
                            };
                            next.set(med.id, { ...cur, taken: checked });
                            return { ...s, medications: next };
                          });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-900 truncate">
                        {med.name}
                        {med.dose ? <span className="text-gray-500"> · {med.dose}</span> : null}
                      </span>
                    </label>
                    <input
                      type="time"
                      value={intake?.time ?? ''}
                      disabled={!taken || disabled}
                      onChange={(ev) => {
                        const v = ev.target.value || null;
                        setState((s) => {
                          const next = new Map(s.medications);
                          const cur = next.get(med.id) ?? {
                            med_id: med.id,
                            taken: false,
                            time: null,
                          };
                          next.set(med.id, { ...cur, time: v });
                          return { ...s, medications: next };
                        });
                      }}
                      className="px-2 py-1 rounded border border-gray-300 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        {/* Contexte */}
        <fieldset className="mb-6" disabled={disabled}>
          <legend className="text-sm font-semibold text-gray-800 mb-3">Contexte / déclencheurs</legend>
          <TagToggle
            tags={CONTEXT_TAGS}
            labels={CONTEXT_TAG_LABELS}
            selected={state.context_tags}
            onToggle={(t) => setState((s) => ({ ...s, context_tags: toggle(s.context_tags, t) }))}
            disabled={disabled}
            colorAccent="#3a9e9e"
          />
        </fieldset>

        {/* Photo */}
        <fieldset className="mb-6" disabled={disabled}>
          <legend className="text-sm font-semibold text-gray-800 mb-3">Photo (optionnelle)</legend>
          {photoPreview ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Aperçu de la journée"
                className="w-40 h-40 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-sm text-red-600 hover:underline"
              >
                Retirer la photo
              </button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 text-sm">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoChange}
                disabled={disabled || photoUploading}
              />
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5l4.5-4.5 3 3 4-4 6.5 6.5M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z" />
              </svg>
              <span>{photoUploading ? 'Envoi…' : 'Ajouter une photo'}</span>
            </label>
          )}
          {photoError && <p className="text-xs text-red-600 mt-2">{photoError}</p>}
        </fieldset>

        {/* Note libre */}
        <fieldset className="mb-2" disabled={disabled}>
          <legend className="text-sm font-semibold text-gray-800 mb-2">Note libre</legend>
          <textarea
            value={state.free_note}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                free_note: e.target.value.slice(0, FREE_NOTE_MAX),
              }))
            }
            maxLength={FREE_NOTE_MAX}
            rows={3}
            placeholder="Un détail à retenir, un bon moment, une difficulté…"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y text-sm"
          />
          <div className="text-xs text-gray-500 text-right mt-1">{remainingChars} caractères restants</div>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            disabled={saving}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={disabled}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: '#027e7e' }}
        >
          {saving ? 'Enregistrement…' : initialLog ? 'Mettre à jour' : 'Enregistrer la journée'}
        </button>
      </div>
    </form>
  );
}
