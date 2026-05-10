/**
 * Journal de bord quotidien (B1) — types, helpers, agrégation, pattern detection.
 *
 * Schema   : health.* (HDS-required).
 * Feature  : FEATURES.journalBord (off par défaut).
 *
 * Conventions :
 * - Aucune saisie n'est obligatoire — toutes les colonnes sont nullable.
 * - Les tags sont validés contre des listes blanches strictes pour éviter
 *   les pollutions et faciliter l'agrégation.
 * - Le score bien-être est calculé côté API à chaque écriture (1-5, NULL si
 *   on ne peut rien dire). Il alimente la heatmap calendrier.
 * - La détection de pattern reste simple et explicable (cf. `detectPatterns`).
 */

// ===========================================================================
// Vocabulaires contrôlés
// ===========================================================================

export const EMOTIONS = [
  'joie',
  'colere',
  'peur',
  'tristesse',
  'degout',
  'surprise',
  'calme',
] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const EMOTION_LABELS: Record<Emotion, string> = {
  joie: 'Joie',
  colere: 'Colère',
  peur: 'Peur',
  tristesse: 'Tristesse',
  degout: 'Dégoût',
  surprise: 'Surprise',
  calme: 'Calme',
};

export const EMOTION_COLORS: Record<Emotion, string> = {
  joie: '#facc15',
  colere: '#ef4444',
  peur: '#a855f7',
  tristesse: '#3b82f6',
  degout: '#84cc16',
  surprise: '#f97316',
  calme: '#14b8a6',
};

export const MEAL_TAGS = [
  'refus',
  'selectivite',
  'oralite',
  'bonne_journee',
] as const;
export type MealTag = (typeof MEAL_TAGS)[number];

export const MEAL_TAG_LABELS: Record<MealTag, string> = {
  refus: 'Refus alimentaire',
  selectivite: 'Sélectivité',
  oralite: 'Oralité difficile',
  bonne_journee: 'Bonne journée alimentaire',
};

export const BEHAVIOR_TAGS = [
  'crise',
  'retrait',
  'agressivite',
  'automutilation',
  'stereotypies',
  'nouvelle_competence',
  'bonne_humeur',
  'cooperation',
] as const;
export type BehaviorTag = (typeof BEHAVIOR_TAGS)[number];

export const BEHAVIOR_TAG_LABELS: Record<BehaviorTag, string> = {
  crise: 'Crise',
  retrait: 'Retrait',
  agressivite: 'Agressivité',
  automutilation: 'Automutilation',
  stereotypies: 'Stéréotypies',
  nouvelle_competence: 'Nouvelle compétence',
  bonne_humeur: 'Bonne humeur',
  cooperation: 'Coopération',
};

/** Tags considérés "négatifs" pour la détection de pattern. */
export const NEGATIVE_BEHAVIOR_TAGS: ReadonlyArray<BehaviorTag> = [
  'crise',
  'agressivite',
  'automutilation',
];

export const CONTEXT_TAGS = [
  'ecole',
  'transition',
  'rdv',
  'voyage',
  'fratrie',
  'weekend',
  'ferie',
  'autre',
] as const;
export type ContextTag = (typeof CONTEXT_TAGS)[number];

export const CONTEXT_TAG_LABELS: Record<ContextTag, string> = {
  ecole: 'École',
  transition: 'Transition',
  rdv: 'Rendez-vous',
  voyage: 'Voyage',
  fratrie: 'Fratrie',
  weekend: 'Week-end',
  ferie: 'Jour férié',
  autre: 'Autre',
};

// ===========================================================================
// Types DB-aligned
// ===========================================================================

export interface MedicationIntake {
  med_id: string;
  time: string | null;        // 'HH:MM' ou null
  taken: boolean;
}

export interface ChildMedicationRow {
  id: string;
  child_id: string;
  user_id: string;
  name: string;
  dose: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

export interface ChildDailyLogRow {
  id: string;
  child_id: string;
  user_id: string;
  log_date: string;            // 'YYYY-MM-DD'
  sleep_bedtime: string | null;
  sleep_waketime: string | null;
  sleep_quality: number | null;
  night_wakings: number | null;
  meals_score: number | null;
  meal_tags: MealTag[];
  emotion_main: Emotion | null;
  emotion_intensity: number | null;
  behavior_tags: BehaviorTag[];
  medications_taken: MedicationIntake[];
  context_tags: ContextTag[];
  photo_path: string | null;
  free_note: string | null;
  wellbeing_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ChildDailyLogCommentRow {
  id: string;
  log_id: string;
  child_id: string;
  author_user_id: string;
  comment: string;
  created_at: string;
}

export interface ChildPatternAlertRow {
  id: string;
  child_id: string;
  user_id: string;
  rule_key: string;
  triggered_at: string;
  payload: Record<string, unknown>;
  dismissed_at: string | null;
}

// ===========================================================================
// Validation / parsing payload (côté API)
// ===========================================================================

export const FREE_NOTE_MAX = 280;
export const COMMENT_MAX = 1000;

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isFiniteIntInRange = (v: unknown, min: number, max: number): v is number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && Number.isInteger(n) && n >= min && n <= max;
};

const trimStr = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
};

const sanitizeStringArray = <T extends string>(
  input: unknown,
  whitelist: ReadonlyArray<T>
): T[] => {
  if (!Array.isArray(input)) return [];
  const allowed = new Set<string>(whitelist);
  const out: T[] = [];
  const seen = new Set<string>();
  for (const v of input) {
    if (typeof v === 'string' && allowed.has(v) && !seen.has(v)) {
      seen.add(v);
      out.push(v as T);
    }
  }
  return out;
};

export const isLogDate = (v: unknown): v is string => {
  if (typeof v !== 'string' || !DATE_REGEX.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
};

const parseTime = (v: unknown): string | null => {
  if (typeof v !== 'string' || v.trim() === '') return null;
  return TIME_REGEX.test(v) ? v : null;
};

const parseMedicationsTaken = (input: unknown): MedicationIntake[] => {
  if (!Array.isArray(input)) return [];
  const out: MedicationIntake[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const medId = typeof r.med_id === 'string' ? r.med_id.trim() : '';
    if (!medId || seen.has(medId)) continue;
    seen.add(medId);
    out.push({
      med_id: medId,
      time: parseTime(r.time),
      taken: Boolean(r.taken),
    });
  }
  return out;
};

export interface DailyLogPayload {
  log_date: string;
  sleep_bedtime: string | null;
  sleep_waketime: string | null;
  sleep_quality: number | null;
  night_wakings: number | null;
  meals_score: number | null;
  meal_tags: MealTag[];
  emotion_main: Emotion | null;
  emotion_intensity: number | null;
  behavior_tags: BehaviorTag[];
  medications_taken: MedicationIntake[];
  context_tags: ContextTag[];
  photo_path: string | null;
  free_note: string | null;
}

/**
 * Parse / valide un payload de log quotidien.
 * Retourne null si invalide.
 */
export function parseDailyLogPayload(input: unknown): DailyLogPayload | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;

  if (!isLogDate(raw.log_date)) return null;

  const sleep_quality = raw.sleep_quality === null || raw.sleep_quality === undefined || raw.sleep_quality === ''
    ? null
    : isFiniteIntInRange(raw.sleep_quality, 1, 5) ? Number(raw.sleep_quality) : undefined;
  if (sleep_quality === undefined) return null;

  const night_wakings = raw.night_wakings === null || raw.night_wakings === undefined || raw.night_wakings === ''
    ? null
    : isFiniteIntInRange(raw.night_wakings, 0, 20) ? Number(raw.night_wakings) : undefined;
  if (night_wakings === undefined) return null;

  const meals_score = raw.meals_score === null || raw.meals_score === undefined || raw.meals_score === ''
    ? null
    : isFiniteIntInRange(raw.meals_score, 1, 5) ? Number(raw.meals_score) : undefined;
  if (meals_score === undefined) return null;

  const emotion_intensity = raw.emotion_intensity === null || raw.emotion_intensity === undefined || raw.emotion_intensity === ''
    ? null
    : isFiniteIntInRange(raw.emotion_intensity, 1, 5) ? Number(raw.emotion_intensity) : undefined;
  if (emotion_intensity === undefined) return null;

  const emotion_main = typeof raw.emotion_main === 'string'
      && (EMOTIONS as readonly string[]).includes(raw.emotion_main)
    ? (raw.emotion_main as Emotion)
    : null;

  const free_note = trimStr(raw.free_note);
  if (free_note !== null && free_note.length > FREE_NOTE_MAX) return null;

  const photo_path = trimStr(raw.photo_path);

  return {
    log_date: raw.log_date as string,
    sleep_bedtime: parseTime(raw.sleep_bedtime),
    sleep_waketime: parseTime(raw.sleep_waketime),
    sleep_quality,
    night_wakings,
    meals_score,
    meal_tags: sanitizeStringArray(raw.meal_tags, MEAL_TAGS),
    emotion_main,
    emotion_intensity: emotion_main === null ? null : emotion_intensity,
    behavior_tags: sanitizeStringArray(raw.behavior_tags, BEHAVIOR_TAGS),
    medications_taken: parseMedicationsTaken(raw.medications_taken),
    context_tags: sanitizeStringArray(raw.context_tags, CONTEXT_TAGS),
    photo_path,
    free_note,
  };
}

export interface MedicationPayload {
  name: string;
  dose: string | null;
  notes: string | null;
  active: boolean;
}

export function parseMedicationPayload(input: unknown): MedicationPayload | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;

  const name = trimStr(raw.name);
  if (!name || name.length > 120) return null;

  const dose = trimStr(raw.dose);
  if (dose !== null && dose.length > 120) return null;

  const notes = trimStr(raw.notes);
  if (notes !== null && notes.length > 500) return null;

  return {
    name,
    dose,
    notes,
    active: raw.active === false ? false : true,
  };
}

export interface CommentPayload {
  comment: string;
}

export function parseCommentPayload(input: unknown): CommentPayload | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const comment = trimStr(raw.comment);
  if (!comment || comment.length > COMMENT_MAX) return null;
  return { comment };
}

// ===========================================================================
// Bien-être (heatmap calendrier)
// ===========================================================================

/**
 * Calcule un score 1-5 agrégé à partir d'un payload de log.
 * Retourne null si on n'a aucun signal.
 *
 * Heuristique simple, explicable :
 * - sleep_quality (1-5)
 * - meals_score (1-5)
 * - emotion_intensity ajustée selon valence (joie/calme positif, autres négatif)
 * - malus -1 par tag négatif, bonus +0.5 par "bonne_humeur" / "cooperation"
 */
export function computeWellbeingScore(p: Partial<DailyLogPayload>): number | null {
  const components: number[] = [];
  if (typeof p.sleep_quality === 'number') components.push(p.sleep_quality);
  if (typeof p.meals_score === 'number') components.push(p.meals_score);

  if (p.emotion_main && typeof p.emotion_intensity === 'number') {
    const positive = p.emotion_main === 'joie' || p.emotion_main === 'calme';
    components.push(positive ? p.emotion_intensity : 6 - p.emotion_intensity);
  }

  if (components.length === 0 && (!p.behavior_tags || p.behavior_tags.length === 0)) {
    return null;
  }

  let base = components.length > 0
    ? components.reduce((acc, n) => acc + n, 0) / components.length
    : 3;

  const tags = p.behavior_tags ?? [];
  for (const t of tags) {
    if ((NEGATIVE_BEHAVIOR_TAGS as readonly string[]).includes(t)) base -= 1;
    if (t === 'bonne_humeur' || t === 'cooperation') base += 0.5;
    if (t === 'nouvelle_competence') base += 0.5;
  }

  const clamped = Math.max(1, Math.min(5, Math.round(base)));
  return clamped;
}

/** Couleur Tailwind-like pour la heatmap calendrier (1=rouge, 5=vert). */
export function wellbeingColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#f3f4f6';
  switch (score) {
    case 1: return '#fecaca';
    case 2: return '#fed7aa';
    case 3: return '#fef3c7';
    case 4: return '#bbf7d0';
    case 5: return '#86efac';
    default: return '#f3f4f6';
  }
}

export function wellbeingLabel(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'Pas de saisie';
  return [
    'Journée très difficile',
    'Journée difficile',
    'Journée moyenne',
    'Bonne journée',
    'Excellente journée',
  ][score - 1] ?? 'Pas de saisie';
}

// ===========================================================================
// Agrégations (vue hebdo / mensuel)
// ===========================================================================

export interface AggregateMetrics {
  daysWithLog: number;
  averageSleepQuality: number | null;
  averageSleepDurationMinutes: number | null;
  averageMealsScore: number | null;
  averageWellbeing: number | null;
  emotionDistribution: Record<Emotion, number>;
  behaviorFrequency: Record<BehaviorTag, number>;
  nightWakingsAverage: number | null;
}

/**
 * Calcule la durée de sommeil en minutes depuis un couple bedtime/waketime
 * (gère le passage de minuit). Retourne null si une heure manque.
 */
export function sleepDurationMinutes(
  bedtime: string | null,
  waketime: string | null
): number | null {
  if (!bedtime || !waketime) return null;
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const start = toMin(bedtime);
  const end = toMin(waketime);
  let diff = end - start;
  if (diff <= 0) diff += 24 * 60; // passage de minuit
  return diff;
}

export function aggregateLogs(logs: ReadonlyArray<ChildDailyLogRow>): AggregateMetrics {
  const emotionDistribution = EMOTIONS.reduce<Record<Emotion, number>>((acc, e) => {
    acc[e] = 0;
    return acc;
  }, {} as Record<Emotion, number>);
  const behaviorFrequency = BEHAVIOR_TAGS.reduce<Record<BehaviorTag, number>>((acc, b) => {
    acc[b] = 0;
    return acc;
  }, {} as Record<BehaviorTag, number>);

  const sleepQs: number[] = [];
  const sleepDurs: number[] = [];
  const mealsScores: number[] = [];
  const wellbeings: number[] = [];
  const nightWakings: number[] = [];

  for (const log of logs) {
    if (typeof log.sleep_quality === 'number') sleepQs.push(log.sleep_quality);
    const dur = sleepDurationMinutes(log.sleep_bedtime, log.sleep_waketime);
    if (dur !== null) sleepDurs.push(dur);
    if (typeof log.meals_score === 'number') mealsScores.push(log.meals_score);
    if (typeof log.wellbeing_score === 'number') wellbeings.push(log.wellbeing_score);
    if (typeof log.night_wakings === 'number') nightWakings.push(log.night_wakings);
    if (log.emotion_main && emotionDistribution[log.emotion_main] !== undefined) {
      emotionDistribution[log.emotion_main]++;
    }
    for (const tag of log.behavior_tags) {
      if (behaviorFrequency[tag] !== undefined) behaviorFrequency[tag]++;
    }
  }

  const avg = (arr: number[]): number | null =>
    arr.length === 0 ? null : Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;

  return {
    daysWithLog: logs.length,
    averageSleepQuality: avg(sleepQs),
    averageSleepDurationMinutes: avg(sleepDurs),
    averageMealsScore: avg(mealsScores),
    averageWellbeing: avg(wellbeings),
    emotionDistribution,
    behaviorFrequency,
    nightWakingsAverage: avg(nightWakings),
  };
}

// ===========================================================================
// Pattern detection (côté server après upsert)
// ===========================================================================

export const PATTERN_RULES = {
  shortNightsWithCrisis: {
    key: 'short_nights_with_crisis',
    label: '3 nuits courtes consécutives associées à une crise',
    description:
      "Trois jours de suite avec un sommeil de mauvaise qualité (≤ 2/5 ou < 6h) et au moins une crise observée.",
  },
  consecutiveCrises: {
    key: 'consecutive_crises',
    label: 'Crises 3 jours consécutifs',
    description: 'Trois jours consécutifs avec un comportement de crise enregistré.',
  },
  weekLowWellbeing: {
    key: 'week_low_wellbeing',
    label: 'Semaine difficile',
    description:
      'Score de bien-être moyen sur les 7 derniers jours inférieur ou égal à 2.',
  },
} as const;

export type PatternRuleKey = (typeof PATTERN_RULES)[keyof typeof PATTERN_RULES]['key'];

export interface DetectedPattern {
  rule_key: PatternRuleKey;
  payload: Record<string, unknown>;
}

const SHORT_NIGHT_THRESHOLD_MINUTES = 360; // 6h

function isShortNight(log: ChildDailyLogRow): boolean {
  if (typeof log.sleep_quality === 'number' && log.sleep_quality <= 2) return true;
  const dur = sleepDurationMinutes(log.sleep_bedtime, log.sleep_waketime);
  return dur !== null && dur < SHORT_NIGHT_THRESHOLD_MINUTES;
}

function hasCrisis(log: ChildDailyLogRow): boolean {
  return log.behavior_tags.some((t) => (NEGATIVE_BEHAVIOR_TAGS as readonly string[]).includes(t));
}

/**
 * Inspecte un historique trié décroissant (plus récent en tête).
 * Retourne la liste des patterns déclenchés sur la fenêtre récente.
 */
export function detectPatterns(
  logsDesc: ReadonlyArray<ChildDailyLogRow>
): DetectedPattern[] {
  const out: DetectedPattern[] = [];
  if (logsDesc.length === 0) return out;

  // Règle 1 : 3 derniers jours avec nuits courtes + crise
  const last3 = logsDesc.slice(0, 3);
  if (
    last3.length === 3
    && last3.every(isShortNight)
    && last3.some(hasCrisis)
  ) {
    out.push({
      rule_key: PATTERN_RULES.shortNightsWithCrisis.key,
      payload: {
        days: last3.map((l) => l.log_date),
      },
    });
  }

  // Règle 2 : 3 jours consécutifs avec crise (sur la fenêtre récente)
  if (last3.length === 3 && last3.every(hasCrisis)) {
    out.push({
      rule_key: PATTERN_RULES.consecutiveCrises.key,
      payload: { days: last3.map((l) => l.log_date) },
    });
  }

  // Règle 3 : moyenne wellbeing 7 derniers jours <= 2
  const last7 = logsDesc.slice(0, 7);
  if (last7.length >= 5) {
    const ws = last7
      .map((l) => l.wellbeing_score)
      .filter((n): n is number => typeof n === 'number');
    if (ws.length >= 5) {
      const avg = ws.reduce((a, b) => a + b, 0) / ws.length;
      if (avg <= 2) {
        out.push({
          rule_key: PATTERN_RULES.weekLowWellbeing.key,
          payload: { average: Math.round(avg * 10) / 10, sample_size: ws.length },
        });
      }
    }
  }

  return out;
}

// ===========================================================================
// Helpers calendrier (UI)
// ===========================================================================

export interface CalendarCell {
  date: string;            // 'YYYY-MM-DD'
  inMonth: boolean;
  log: ChildDailyLogRow | null;
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/**
 * Construit une grille de 6 semaines (42 cells) lundi → dimanche pour le mois
 * `monthStart`. Chaque cellule porte le log du jour s'il existe.
 */
export function buildMonthGrid(
  monthStart: Date,
  logsByDate: Map<string, ChildDailyLogRow>
): CalendarCell[] {
  const first = startOfMonth(monthStart);
  // Lundi = 0
  const dayOfWeek = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - dayOfWeek);

  const out: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = isoDate(d);
    out.push({
      date: iso,
      inMonth: d.getMonth() === first.getMonth(),
      log: logsByDate.get(iso) ?? null,
    });
  }
  return out;
}

export function frenchMonthLabel(d: Date): string {
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function frenchDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ===========================================================================
// Étiquettes utilitaires pour les UI / PDF
// ===========================================================================

export const HDS_DEV_BANNER =
  'Cette section sera hébergée sur infrastructure HDS-certifiée avant la mise en production.';

export const PRIVACY_REASSURANCE =
  'Aucune saisie n\'est obligatoire. Vos données sont privées et chiffrées au repos.';
