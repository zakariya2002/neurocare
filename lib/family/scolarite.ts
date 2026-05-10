/**
 * Scolarité light (B3') — helpers et types partagés.
 *
 * - Schema Postgres : public.child_school_year + public.child_school_actors (non-HDS).
 * - Feature flag : FEATURES.scolarite.
 *
 * Conventions :
 *   - On stocke uniquement la valeur catégorielle des dispositifs ("pai" =
 *     présence d'un PAI). Le contenu médical d'un PAI n'est JAMAIS stocké ici
 *     — il ira dans le coffre-fort santé HDS (B2) plus tard.
 *   - Les notes sont des notes administratives, pas des observations médicales.
 *     La copy UI doit le rappeler.
 */

export const SCHOOL_TYPES = [
  'creche',
  'maternelle',
  'elementaire',
  'college',
  'lycee',
  'ime',
  'ueea',
  'uema',
  'homeschool',
  'none',
  'other',
] as const;

export type SchoolType = (typeof SCHOOL_TYPES)[number];

export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  creche: 'Crèche',
  maternelle: 'École maternelle',
  elementaire: 'École élémentaire',
  college: 'Collège',
  lycee: 'Lycée',
  ime: 'IME',
  ueea: 'UEEA',
  uema: 'UEMA',
  homeschool: 'Scolarisation à domicile',
  none: 'Hors scolarisation',
  other: 'Autre',
};

export const SCHOOL_DEVICES = [
  'pps',
  'pap',
  'pai',
  'ppre',
  'ulis',
  'segpa',
  'aucun',
] as const;

export type SchoolDevice = (typeof SCHOOL_DEVICES)[number];

export const SCHOOL_DEVICE_LABELS: Record<SchoolDevice, string> = {
  pps: 'PPS',
  pap: 'PAP',
  pai: 'PAI',
  ppre: 'PPRE',
  ulis: 'ULIS',
  segpa: 'SEGPA',
  aucun: 'Aucun dispositif',
};

export const SCHOOL_DEVICE_DESCRIPTIONS: Record<SchoolDevice, string> = {
  pps: 'Projet Personnalisé de Scolarisation',
  pap: 'Plan d\'Accompagnement Personnalisé',
  pai: 'Projet d\'Accueil Individualisé',
  ppre: 'Programme Personnalisé de Réussite Éducative',
  ulis: 'Unité Localisée pour l\'Inclusion Scolaire',
  segpa: 'Section d\'Enseignement Général et Professionnel Adapté',
  aucun: 'Aucun dispositif particulier',
};

export const SCHOOL_ACTOR_ROLES = [
  'enseignant_referent_mdph',
  'medecin_scolaire',
  'psy_en',
  'directeur_etablissement',
  'aesh',
  'educateur_specialise',
  'autre',
] as const;

export type SchoolActorRole = (typeof SCHOOL_ACTOR_ROLES)[number];

export const SCHOOL_ACTOR_ROLE_LABELS: Record<SchoolActorRole, string> = {
  enseignant_referent_mdph: 'Enseignant référent MDPH',
  medecin_scolaire: 'Médecin scolaire',
  psy_en: 'Psychologue Éducation Nationale',
  directeur_etablissement: 'Directeur d\'établissement',
  aesh: 'AESH',
  educateur_specialise: 'Éducateur spécialisé',
  autre: 'Autre',
};

export interface SchoolYearRow {
  id: string;
  child_id: string;
  user_id: string;
  school_year: string;
  school_name: string | null;
  school_type: SchoolType | null;
  school_address: string | null;
  school_postal_code: string | null;
  school_city: string | null;
  level: string | null;
  teacher_name: string | null;
  teacher_email: string | null;
  teacher_phone: string | null;
  devices: SchoolDevice[];
  has_aesh: boolean;
  aesh_hours_per_week: number | null;
  aesh_first_name: string | null;
  last_ess_date: string | null;
  next_ess_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolActorRow {
  id: string;
  child_school_year_id: string;
  user_id: string;
  role: SchoolActorRole;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export const NOTES_MAX_LENGTH = 2000;

export const NOTES_ADMIN_HINT =
  'Notes administratives, ne contiennent pas d\'informations médicales détaillées.';

export const SCOLARITE_PRIVACY_HINT =
  'Cet espace ne stocke pas vos documents médicaux ; le coffre-fort sécurisé arrivera prochainement.';

const SCHOOL_YEAR_REGEX = /^(\d{4})-(\d{4})$/;

/**
 * Valide une année scolaire au format "YYYY-YYYY" avec deux années consécutives.
 */
export function isValidSchoolYear(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = value.match(SCHOOL_YEAR_REGEX);
  if (!match) return false;
  const start = Number(match[1]);
  const end = Number(match[2]);
  return end === start + 1;
}

/**
 * Renvoie la liste des dispositifs reçus en filtrant les valeurs invalides.
 */
export function sanitizeDevices(input: unknown): SchoolDevice[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<SchoolDevice>();
  for (const v of input) {
    if (typeof v === 'string' && (SCHOOL_DEVICES as readonly string[]).includes(v)) {
      seen.add(v as SchoolDevice);
    }
  }
  return Array.from(seen);
}

export function isSchoolType(v: unknown): v is SchoolType {
  return typeof v === 'string' && (SCHOOL_TYPES as readonly string[]).includes(v);
}

export function isSchoolActorRole(v: unknown): v is SchoolActorRole {
  return typeof v === 'string' && (SCHOOL_ACTOR_ROLES as readonly string[]).includes(v);
}

/**
 * Renvoie l'année scolaire en cours au format "YYYY-YYYY" pour une date donnée.
 * Coupure : septembre (rentrée scolaire France).
 */
export function currentSchoolYear(now: Date = new Date()): string {
  const month = now.getMonth(); // 0 = Janvier
  const year = now.getFullYear();
  if (month >= 8) {
    // Septembre ou après : année en cours = N / N+1
    return `${year}-${year + 1}`;
  }
  // Avant septembre : année en cours = N-1 / N
  return `${year - 1}-${year}`;
}

/**
 * Génère une liste d'années scolaires "raisonnable" pour le sélecteur d'ajout.
 * Inclut 5 années passées et 2 années futures autour de la rentrée actuelle.
 */
export function defaultSchoolYearOptions(now: Date = new Date()): string[] {
  const current = currentSchoolYear(now);
  const startYear = Number(current.split('-')[0]);
  const out: string[] = [];
  for (let offset = 2; offset >= -5; offset--) {
    const y = startYear + offset;
    out.push(`${y}-${y + 1}`);
  }
  return out;
}

/**
 * Tri décroissant d'une liste d'années scolaires (plus récente en tête).
 */
export function sortSchoolYearsDesc(years: string[]): string[] {
  return [...years].sort((a, b) => b.localeCompare(a));
}

/**
 * Validation/normalisation d'un payload partiel d'année scolaire.
 * Renvoie null si invalide. Ne renvoie que les champs autorisés.
 */
export function parseSchoolYearPayload(input: unknown): {
  school_year: string;
  school_name: string | null;
  school_type: SchoolType | null;
  school_address: string | null;
  school_postal_code: string | null;
  school_city: string | null;
  level: string | null;
  teacher_name: string | null;
  teacher_email: string | null;
  teacher_phone: string | null;
  devices: SchoolDevice[];
  has_aesh: boolean;
  aesh_hours_per_week: number | null;
  aesh_first_name: string | null;
  last_ess_date: string | null;
  next_ess_date: string | null;
  notes: string | null;
} | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;

  if (!isValidSchoolYear(raw.school_year)) return null;

  const trim = (v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const t = v.trim();
    return t.length > 0 ? t : null;
  };

  const schoolType = isSchoolType(raw.school_type) ? raw.school_type : null;
  const devices = sanitizeDevices(raw.devices);

  let aeshHours: number | null = null;
  if (raw.aesh_hours_per_week !== null && raw.aesh_hours_per_week !== undefined && raw.aesh_hours_per_week !== '') {
    const n = typeof raw.aesh_hours_per_week === 'number'
      ? raw.aesh_hours_per_week
      : Number(raw.aesh_hours_per_week);
    if (Number.isFinite(n) && n >= 0 && n <= 50) {
      aeshHours = Math.round(n * 10) / 10;
    } else {
      return null;
    }
  }

  const validDate = (v: unknown): string | null => {
    if (typeof v !== 'string' || v.trim() === '') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : v;
  };

  const notes = trim(raw.notes);
  if (notes !== null && notes.length > NOTES_MAX_LENGTH) return null;

  return {
    school_year: raw.school_year as string,
    school_name: trim(raw.school_name),
    school_type: schoolType,
    school_address: trim(raw.school_address),
    school_postal_code: trim(raw.school_postal_code),
    school_city: trim(raw.school_city),
    level: trim(raw.level),
    teacher_name: trim(raw.teacher_name),
    teacher_email: trim(raw.teacher_email),
    teacher_phone: trim(raw.teacher_phone),
    devices,
    has_aesh: Boolean(raw.has_aesh),
    aesh_hours_per_week: aeshHours,
    aesh_first_name: trim(raw.aesh_first_name),
    last_ess_date: validDate(raw.last_ess_date),
    next_ess_date: validDate(raw.next_ess_date),
    notes,
  };
}

export function parseSchoolActorPayload(input: unknown): {
  role: SchoolActorRole;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
} | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;

  if (!isSchoolActorRole(raw.role)) return null;

  const trim = (v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const t = v.trim();
    return t.length > 0 ? t : null;
  };

  const name = trim(raw.name);
  if (!name) return null;

  const notes = trim(raw.notes);
  if (notes !== null && notes.length > NOTES_MAX_LENGTH) return null;

  return {
    role: raw.role,
    name,
    email: trim(raw.email),
    phone: trim(raw.phone),
    notes,
  };
}
