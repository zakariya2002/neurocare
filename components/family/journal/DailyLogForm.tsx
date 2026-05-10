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

// ===========================================================================
// Sub-components
// ===========================================================================

function SectionCard({
  iconPath,
  title,
  subtitle,
  accent = '#027e7e',
  children,
}: {
  iconPath: string;
  title: string;
  subtitle?: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div
        className="px-4 sm:px-5 py-3 flex items-center gap-3 border-b border-gray-100"
        style={{ backgroundColor: `${accent}0d` }}
      >
        <span
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${accent}1f` }}
          aria-hidden="true"
        >
          <svg className="w-5 h-5" fill="none" stroke={accent} strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </span>
        <div className="min-w-0">
          <h3
            className="text-sm sm:text-base font-bold"
            style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
          >
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function StarPicker({
  value,
  onChange,
  ariaLabel,
  disabled,
  color = '#d97706',
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  ariaLabel: string;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value !== null && n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === n ? null : n)}
            className="p-1 rounded transition transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-300 disabled:opacity-50"
            aria-pressed={value === n}
            aria-label={`${n} sur 5`}
          >
            <svg
              className="w-7 h-7"
              fill={active ? color : 'none'}
              stroke={active ? color : '#d1d5db'}
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.5l2.55 5.16 5.7.83a.5.5 0 01.28.85l-4.13 4.02.97 5.67a.5.5 0 01-.73.53L11 17.9l-5.1 2.68a.5.5 0 01-.73-.53l.98-5.67-4.13-4.02a.5.5 0 01.28-.85l5.7-.83 2.55-5.16a.5.5 0 01.93 0z"
              />
            </svg>
          </button>
        );
      })}
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
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              isOn ? 'text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'
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

/**
 * Roue d'émotions — 7 segments cliquables.
 */
function EmotionWheel({
  selected,
  onSelect,
  disabled,
}: {
  selected: Emotion | null;
  onSelect: (e: Emotion | null) => void;
  disabled?: boolean;
}) {
  const cx = 100;
  const cy = 100;
  const rOuter = 90;
  const rInner = 30;
  const total = EMOTIONS.length;
  const anglePer = (Math.PI * 2) / total;

  // Construit l'arc (path) d'un secteur
  const sectorPath = (i: number): { d: string; cx: number; cy: number } => {
    const start = -Math.PI / 2 + i * anglePer; // démarre en haut
    const end = start + anglePer;
    const x1 = cx + rOuter * Math.cos(start);
    const y1 = cy + rOuter * Math.sin(start);
    const x2 = cx + rOuter * Math.cos(end);
    const y2 = cy + rOuter * Math.sin(end);
    const x3 = cx + rInner * Math.cos(end);
    const y3 = cy + rInner * Math.sin(end);
    const x4 = cx + rInner * Math.cos(start);
    const y4 = cy + rInner * Math.sin(start);
    const large = anglePer > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
    // Centre du label
    const mid = (start + end) / 2;
    const rMid = (rOuter + rInner) / 2;
    return {
      d,
      cx: cx + rMid * Math.cos(mid),
      cy: cy + rMid * Math.sin(mid),
    };
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 200 200"
        className="w-48 h-48 sm:w-56 sm:h-56"
        role="radiogroup"
        aria-label="Roue des émotions"
      >
        {EMOTIONS.map((e, i) => {
          const seg = sectorPath(i);
          const isSelected = selected === e;
          const baseColor = EMOTION_COLORS[e];
          const fill = isSelected ? baseColor : `${baseColor}66`;
          return (
            <g key={e}>
              <path
                d={seg.d}
                fill={fill}
                stroke="#ffffff"
                strokeWidth={2}
                style={{ cursor: disabled ? 'default' : 'pointer', transition: 'all 0.15s' }}
                onClick={() => !disabled && onSelect(isSelected ? null : e)}
                role="radio"
                aria-checked={isSelected}
                aria-label={EMOTION_LABELS[e]}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(ev) => {
                  if (!disabled && (ev.key === 'Enter' || ev.key === ' ')) {
                    ev.preventDefault();
                    onSelect(isSelected ? null : e);
                  }
                }}
              />
              <text
                x={seg.cx}
                y={seg.cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight={isSelected ? 700 : 500}
                fill={isSelected ? '#ffffff' : '#1f2937'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {EMOTION_LABELS[e]}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={rInner - 2} fill="#fdf9f4" stroke="#e5e7eb" strokeWidth={1} />
        {selected && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight={700}
            fill={EMOTION_COLORS[selected]}
            style={{ pointerEvents: 'none' }}
          >
            {EMOTION_LABELS[selected]}
          </text>
        )}
      </svg>
      {selected && !disabled && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-xs text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline"
        >
          Effacer la sélection
        </button>
      )}
    </div>
  );
}

// Icônes par section — paths Heroicons / Tabler
const ICON_SLEEP = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'; // moon
const ICON_MEAL = 'M3 12a9 9 0 0 0 9 9 9 9 0 0 0 9-9H3zM12 3v6'; // bowl
const ICON_BEHAVIOR =
  'M9.5 2A1.5 1.5 0 0 1 11 3.5V5h2V3.5A1.5 1.5 0 0 1 14.5 2 2.5 2.5 0 0 1 17 4.5V7h2.5A1.5 1.5 0 0 1 21 8.5V11h-1.5a1.5 1.5 0 0 0 0 3H21v3.5a1.5 1.5 0 0 1-1.5 1.5H17v-2.5a2.5 2.5 0 0 0-5 0V19H4.5A1.5 1.5 0 0 1 3 17.5V14h1.5a1.5 1.5 0 0 0 0-3H3V8.5A1.5 1.5 0 0 1 4.5 7H7V4.5A2.5 2.5 0 0 1 9.5 2z'; // puzzle
const ICON_HEART = 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
const ICON_PILL =
  'M10.5 20.5a7 7 0 0 1-9.9-9.9l9.9-9.9a7 7 0 0 1 9.9 9.9zM8.5 8.5l7 7';
const ICON_TAG =
  'M20.59 13.41l-7.18 7.18a2 2 0 0 1-2.82 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01';
const ICON_PHOTO =
  'M3 16.5l4.5-4.5 3 3 4-4 6.5 6.5M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z';
const ICON_PEN =
  'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z';

// ===========================================================================
// Component
// ===========================================================================

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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pb-24 lg:pb-0">
      {/* En-tête de date */}
      <div
        className="rounded-xl md:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 border"
        style={{ backgroundColor: '#fef3c7', borderColor: 'rgba(217, 119, 6, 0.25)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(217, 119, 6, 0.18)' }}
            aria-hidden="true"
          >
            <svg className="w-5 h-5" fill="none" stroke="#d97706" strokeWidth={2} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
              />
            </svg>
          </span>
          <div>
            <h3
              className="text-sm sm:text-base font-bold capitalize"
              style={{ fontFamily: 'Verdana, sans-serif', color: '#78350f' }}
            >
              {frenchDateLabel(date)}
            </h3>
            <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: '#92400e' }}>
              Aucune saisie n&apos;est obligatoire. Notez ce qui vous semble utile.
            </p>
          </div>
        </div>
      </div>

      {/* Sommeil */}
      <SectionCard
        iconPath={ICON_SLEEP}
        title="Sommeil"
        subtitle="Heures, qualité ressentie, réveils"
        accent="#3a9e9e"
      >
        <fieldset disabled={disabled} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-600">Coucher</span>
              <input
                type="time"
                value={state.sleep_bedtime}
                onChange={(e) => setState((s) => ({ ...s, sleep_bedtime: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600">Réveil</span>
              <input
                type="time"
                value={state.sleep_waketime}
                onChange={(e) => setState((s) => ({ ...s, sleep_waketime: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-600">Qualité ressentie</span>
            <StarPicker
              value={state.sleep_quality}
              onChange={(n) => setState((s) => ({ ...s, sleep_quality: n }))}
              ariaLabel="Qualité du sommeil"
              disabled={disabled}
            />
          </div>
          <label className="block">
            <span className="text-xs text-gray-600">Réveils nocturnes</span>
            <input
              type="number"
              min={0}
              max={20}
              inputMode="numeric"
              value={state.night_wakings}
              onChange={(e) => setState((s) => ({ ...s, night_wakings: e.target.value }))}
              className="mt-1 w-32 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </label>
        </fieldset>
      </SectionCard>

      {/* Repas */}
      <SectionCard
        iconPath={ICON_MEAL}
        title="Repas"
        subtitle="Qualité globale et observations"
        accent="#d97706"
      >
        <fieldset disabled={disabled} className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
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
            colorAccent="#d97706"
          />
        </fieldset>
      </SectionCard>

      {/* Comportements */}
      <SectionCard
        iconPath={ICON_BEHAVIOR}
        title="Comportements observés"
        subtitle="Sélectionnez tout ce qui s'applique"
        accent="#7c3aed"
      >
        <fieldset disabled={disabled}>
          <TagToggle
            tags={BEHAVIOR_TAGS}
            labels={BEHAVIOR_TAG_LABELS}
            selected={state.behavior_tags}
            onToggle={(t) => setState((s) => ({ ...s, behavior_tags: toggle(s.behavior_tags, t) }))}
            disabled={disabled}
            colorAccent="#7c3aed"
          />
        </fieldset>
      </SectionCard>

      {/* Émotions — roue */}
      <SectionCard
        iconPath={ICON_HEART}
        title="Émotion principale du jour"
        subtitle="Cliquez sur un segment pour la sélectionner"
        accent="#dc2626"
      >
        <fieldset disabled={disabled} className="space-y-4">
          <EmotionWheel
            selected={state.emotion_main}
            onSelect={(e) =>
              setState((s) => ({
                ...s,
                emotion_main: e,
                emotion_intensity: e === null ? null : (s.emotion_intensity ?? 3),
              }))
            }
            disabled={disabled}
          />
          {state.emotion_main && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-600">Intensité</span>
              <StarPicker
                value={state.emotion_intensity}
                onChange={(n) => setState((s) => ({ ...s, emotion_intensity: n }))}
                ariaLabel="Intensité de l'émotion"
                disabled={disabled}
                color={EMOTION_COLORS[state.emotion_main]}
              />
            </div>
          )}
        </fieldset>
      </SectionCard>

      {/* Médicaments */}
      <SectionCard
        iconPath={ICON_PILL}
        title="Médicaments pris"
        accent="#0891b2"
      >
        <fieldset disabled={disabled}>
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
                    className={`flex flex-wrap items-center gap-3 p-2 sm:p-3 rounded-lg border transition ${
                      taken ? 'border-cyan-200 bg-cyan-50/40' : 'border-gray-200'
                    }`}
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
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-sm text-gray-900 truncate">
                        {med.name}
                        {med.dose ? (
                          <span className="text-gray-500"> · {med.dose}</span>
                        ) : null}
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
      </SectionCard>

      {/* Contexte */}
      <SectionCard
        iconPath={ICON_TAG}
        title="Contexte / déclencheurs"
        accent="#3a9e9e"
      >
        <fieldset disabled={disabled}>
          <TagToggle
            tags={CONTEXT_TAGS}
            labels={CONTEXT_TAG_LABELS}
            selected={state.context_tags}
            onToggle={(t) => setState((s) => ({ ...s, context_tags: toggle(s.context_tags, t) }))}
            disabled={disabled}
            colorAccent="#3a9e9e"
          />
        </fieldset>
      </SectionCard>

      {/* Photo */}
      <SectionCard
        iconPath={ICON_PHOTO}
        title="Photo de la journée (optionnelle)"
        accent="#0891b2"
      >
        <fieldset disabled={disabled}>
          {photoPreview ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Aperçu de la journée"
                className="w-40 h-40 sm:w-48 sm:h-48 object-cover rounded-xl border border-gray-200"
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
            <label
              className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed cursor-pointer transition ${
                photoUploading ? 'opacity-60' : 'hover:border-cyan-400 hover:bg-cyan-50/40'
              }`}
              style={{ borderColor: '#d1d5db' }}
            >
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoChange}
                disabled={disabled || photoUploading}
              />
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5l4.5-4.5 3 3 4-4 6.5 6.5M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
              </svg>
              <span className="text-xs sm:text-sm text-gray-700 font-medium text-center">
                {photoUploading ? 'Envoi en cours…' : 'Glissez une photo ou cliquez pour parcourir'}
              </span>
              <span className="text-[11px] text-gray-500">JPG / PNG, 5 Mo max</span>
            </label>
          )}
          {photoError && <p className="text-xs text-red-600 mt-2">{photoError}</p>}
        </fieldset>
      </SectionCard>

      {/* Note libre */}
      <SectionCard
        iconPath={ICON_PEN}
        title="Note libre"
        subtitle="Un détail à retenir, un bon moment, une difficulté…"
        accent="#027e7e"
      >
        <fieldset disabled={disabled}>
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
            placeholder="Notez ce qui vous semble utile…"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y text-sm"
          />
          <div className="text-xs text-gray-500 text-right mt-1">
            {remainingChars} caractères restants
          </div>
        </fieldset>
      </SectionCard>

      {/* Bouton sticky mobile + barre desktop */}
      <div className="hidden lg:flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            disabled={saving}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={disabled}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#027e7e' }}
        >
          {saving ? 'Enregistrement…' : initialLog ? 'Mettre à jour la journée' : 'Enregistrer la journée'}
        </button>
      </div>

      {/* Sticky mobile / tablet */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 px-3 sm:px-4 py-3 bg-white/95 backdrop-blur border-t border-gray-200"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="flex items-center gap-2 max-w-5xl mx-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
              disabled={saving}
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={disabled}
            className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm disabled:opacity-50"
            style={{ backgroundColor: '#027e7e' }}
          >
            {saving ? 'Enregistrement…' : initialLog ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </form>
  );
}
