/**
 * Onboarding post-diagnostic (A1) — helpers et types partagés.
 *
 * - Schema Postgres : public.family_onboarding_progress (non-HDS).
 * - Feature flag : FEATURES.onboardingPostDiag.
 *
 * Conventions :
 *   - Chaque "étape" est un JSONB avec un champ `completed: boolean`.
 *   - Les autres champs sont optionnels (toutes les questions du wizard sont skippables).
 *   - L'étape est considérée "remplie" dès lors que `completed` vaut true,
 *     que l'utilisateur ait répondu ou skipé.
 */

export const ONBOARDING_STEP_KEYS = [
  'doctor',
  'mdph',
  'pco_fip',
  'school',
  'aids',
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEP_KEYS)[number];

export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEP_KEYS.length;

// ----- Étape 1 : Médecin référent / pédiatre -----
export interface OnboardingStepDoctor {
  name?: string | null;
  city?: string | null;
  phone?: string | null;
  completed: boolean;
}

// ----- Étape 2 : MDPH -----
export type MdphStatus = 'never' | 'in_progress' | 'granted' | 'denied';

export interface OnboardingStepMdph {
  status?: MdphStatus | null;
  expires_at?: string | null; // YYYY-MM-DD
  department?: string | null;
  completed: boolean;
}

// ----- Étape 3 : PCO / FIP -----
export type YesNoUnknown = 'yes' | 'no' | 'unknown';

export interface OnboardingStepPcoFip {
  pco_oriented?: YesNoUnknown | null;
  fip_active?: 'yes' | 'no' | null;
  fip_started_at?: string | null; // YYYY-MM-DD
  completed: boolean;
}

// ----- Étape 4 : École -----
export type SchoolType =
  | 'creche'
  | 'maternelle'
  | 'elementaire'
  | 'college'
  | 'lycee'
  | 'ime'
  | 'ueea_uema'
  | 'home'
  | 'none';

export type SchoolDevice = 'pps' | 'pap' | 'none' | 'unknown';

export interface OnboardingStepSchool {
  school_type?: SchoolType | null;
  device?: SchoolDevice | null;
  has_aesh?: boolean | null;
  completed: boolean;
}

// ----- Étape 5 : Aides connues -----
export type AidCode =
  | 'aeeh'
  | 'pch'
  | 'cesu'
  | 'complement_aeeh'
  | 'none'
  | 'other';

export interface OnboardingStepAids {
  aids?: AidCode[] | null;
  completed: boolean;
}

export interface OnboardingProgressRow {
  id: string;
  user_id: string;
  child_id: string;
  step_doctor: OnboardingStepDoctor | null;
  step_mdph: OnboardingStepMdph | null;
  step_pco_fip: OnboardingStepPcoFip | null;
  step_school: OnboardingStepSchool | null;
  step_aids: OnboardingStepAids | null;
  dismissed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingSummary {
  childId: string;
  completedCount: number;
  totalSteps: number;
  isComplete: boolean;
  isDismissed: boolean;
  steps: {
    doctor: OnboardingStepDoctor | null;
    mdph: OnboardingStepMdph | null;
    pco_fip: OnboardingStepPcoFip | null;
    school: OnboardingStepSchool | null;
    aids: OnboardingStepAids | null;
  };
}

export function summarizeProgress(row: OnboardingProgressRow | null, childId: string): OnboardingSummary {
  const steps = {
    doctor: row?.step_doctor ?? null,
    mdph: row?.step_mdph ?? null,
    pco_fip: row?.step_pco_fip ?? null,
    school: row?.step_school ?? null,
    aids: row?.step_aids ?? null,
  };
  const completedCount = (Object.values(steps).filter((s) => s?.completed) as unknown[]).length;
  return {
    childId,
    completedCount,
    totalSteps: ONBOARDING_TOTAL_STEPS,
    isComplete: completedCount >= ONBOARDING_TOTAL_STEPS || !!row?.completed_at,
    isDismissed: !!row?.dismissed_at,
    steps,
  };
}

// ---------- Validation manuelle (pas de zod dans le repo) ----------

const isString = (v: unknown): v is string => typeof v === 'string';
const isOptionalString = (v: unknown): v is string | null | undefined =>
  v === undefined || v === null || isString(v);
const isOptionalBool = (v: unknown): v is boolean | null | undefined =>
  v === undefined || v === null || typeof v === 'boolean';

const isMdphStatus = (v: unknown): v is MdphStatus =>
  v === 'never' || v === 'in_progress' || v === 'granted' || v === 'denied';

const isYesNoUnknown = (v: unknown): v is YesNoUnknown =>
  v === 'yes' || v === 'no' || v === 'unknown';

const isYesNo = (v: unknown): v is 'yes' | 'no' =>
  v === 'yes' || v === 'no';

const SCHOOL_TYPES: SchoolType[] = [
  'creche', 'maternelle', 'elementaire', 'college', 'lycee',
  'ime', 'ueea_uema', 'home', 'none',
];
const isSchoolType = (v: unknown): v is SchoolType =>
  isString(v) && (SCHOOL_TYPES as string[]).includes(v);

const SCHOOL_DEVICES: SchoolDevice[] = ['pps', 'pap', 'none', 'unknown'];
const isSchoolDevice = (v: unknown): v is SchoolDevice =>
  isString(v) && (SCHOOL_DEVICES as string[]).includes(v);

const AID_CODES: AidCode[] = ['aeeh', 'pch', 'cesu', 'complement_aeeh', 'none', 'other'];
const isAidCode = (v: unknown): v is AidCode =>
  isString(v) && (AID_CODES as string[]).includes(v);

// ISO date YYYY-MM-DD (souple : on accepte aussi un timestamp ISO complet).
const isOptionalIsoDate = (v: unknown): v is string | null | undefined => {
  if (v === undefined || v === null) return true;
  if (!isString(v)) return false;
  // Accepte YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss(.sss)?(Z|+HH:mm)?
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/.test(v);
};

function asObject(v: unknown): Record<string, unknown> | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

export function parseStepDoctor(input: unknown): OnboardingStepDoctor | null {
  const obj = asObject(input);
  if (!obj) return null;
  const { name, city, phone, completed } = obj;
  if (!isOptionalString(name) || !isOptionalString(city) || !isOptionalString(phone)) {
    return null;
  }
  return {
    name: typeof name === 'string' ? name.trim() || null : null,
    city: typeof city === 'string' ? city.trim() || null : null,
    phone: typeof phone === 'string' ? phone.trim() || null : null,
    completed: completed === true,
  };
}

export function parseStepMdph(input: unknown): OnboardingStepMdph | null {
  const obj = asObject(input);
  if (!obj) return null;
  const { status, expires_at, department, completed } = obj;
  if (status !== undefined && status !== null && !isMdphStatus(status)) return null;
  if (!isOptionalIsoDate(expires_at)) return null;
  if (!isOptionalString(department)) return null;
  return {
    status: (status as MdphStatus | null | undefined) ?? null,
    expires_at: typeof expires_at === 'string' ? expires_at : null,
    department: typeof department === 'string' ? department.trim() || null : null,
    completed: completed === true,
  };
}

export function parseStepPcoFip(input: unknown): OnboardingStepPcoFip | null {
  const obj = asObject(input);
  if (!obj) return null;
  const { pco_oriented, fip_active, fip_started_at, completed } = obj;
  if (pco_oriented !== undefined && pco_oriented !== null && !isYesNoUnknown(pco_oriented)) return null;
  if (fip_active !== undefined && fip_active !== null && !isYesNo(fip_active)) return null;
  if (!isOptionalIsoDate(fip_started_at)) return null;
  return {
    pco_oriented: (pco_oriented as YesNoUnknown | null | undefined) ?? null,
    fip_active: (fip_active as 'yes' | 'no' | null | undefined) ?? null,
    fip_started_at: typeof fip_started_at === 'string' ? fip_started_at : null,
    completed: completed === true,
  };
}

export function parseStepSchool(input: unknown): OnboardingStepSchool | null {
  const obj = asObject(input);
  if (!obj) return null;
  const { school_type, device, has_aesh, completed } = obj;
  if (school_type !== undefined && school_type !== null && !isSchoolType(school_type)) return null;
  if (device !== undefined && device !== null && !isSchoolDevice(device)) return null;
  if (!isOptionalBool(has_aesh)) return null;
  return {
    school_type: (school_type as SchoolType | null | undefined) ?? null,
    device: (device as SchoolDevice | null | undefined) ?? null,
    has_aesh: typeof has_aesh === 'boolean' ? has_aesh : null,
    completed: completed === true,
  };
}

export function parseStepAids(input: unknown): OnboardingStepAids | null {
  const obj = asObject(input);
  if (!obj) return null;
  const { aids, completed } = obj;
  let safeAids: AidCode[] | null = null;
  if (Array.isArray(aids)) {
    const filtered = aids.filter(isAidCode);
    // Dédoublonner
    safeAids = Array.from(new Set(filtered));
  } else if (aids === null || aids === undefined) {
    safeAids = null;
  } else {
    return null;
  }
  return {
    aids: safeAids,
    completed: completed === true,
  };
}

export const STEP_PARSERS: Record<OnboardingStepKey, (v: unknown) => unknown | null> = {
  doctor: parseStepDoctor,
  mdph: parseStepMdph,
  pco_fip: parseStepPcoFip,
  school: parseStepSchool,
  aids: parseStepAids,
};

export const STEP_COLUMN: Record<OnboardingStepKey, string> = {
  doctor: 'step_doctor',
  mdph: 'step_mdph',
  pco_fip: 'step_pco_fip',
  school: 'step_school',
  aids: 'step_aids',
};

// ---------- Recommandations ("checklist personnalisée") ----------

export interface OnboardingRecommendation {
  id: string;
  label: string;
  href: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Génère la liste de CTA personnalisés à partir de la progression.
 * Référence : pages futures A2 (rappels MDPH), A3 (modèles courriers), A5 (annuaire).
 */
export function buildRecommendations(summary: OnboardingSummary): OnboardingRecommendation[] {
  const recs: OnboardingRecommendation[] = [];
  const { steps } = summary;

  // MDPH
  if (steps.mdph?.status === 'never') {
    recs.push({
      id: 'mdph-letter',
      label: 'Préparer mon dossier MDPH',
      href: '/dashboard/family/courriers',
      reason: 'Le dossier MDPH ouvre l\'accès à de nombreuses aides (AEEH, PCH, AESH).',
      priority: 'high',
    });
  } else if (steps.mdph?.status === 'in_progress') {
    recs.push({
      id: 'mdph-followup',
      label: 'Suivre mon dossier MDPH',
      href: '/dashboard/family/courriers',
      reason: 'Vous pouvez relancer la MDPH si le délai est dépassé.',
      priority: 'medium',
    });
  } else if (steps.mdph?.status === 'granted' && steps.mdph.expires_at) {
    recs.push({
      id: 'mdph-renewal',
      label: 'Anticiper le renouvellement MDPH',
      href: '/dashboard/family/courriers',
      reason: `Vos droits expirent le ${steps.mdph.expires_at}. Le renouvellement se prépare 6 mois à l'avance.`,
      priority: 'medium',
    });
  }

  // PCO / FIP
  if (steps.pco_fip?.pco_oriented === 'no' || steps.pco_fip?.pco_oriented === 'unknown') {
    recs.push({
      id: 'pco-info',
      label: 'En savoir plus sur les PCO',
      href: '/dashboard/family/aides',
      reason: 'Les Plateformes de Coordination et d\'Orientation accélèrent le bilan complet.',
      priority: 'medium',
    });
  }

  // École
  if (steps.school?.device === 'none' || steps.school?.device === 'unknown') {
    recs.push({
      id: 'school-pps',
      label: 'Comprendre PPS / PAP',
      href: '/dashboard/family/aides',
      reason: 'Un projet personnalisé peut faciliter la scolarité de votre enfant.',
      priority: 'medium',
    });
  }
  if (steps.school?.has_aesh === false && steps.school?.school_type
    && !['home', 'none', 'ime'].includes(steps.school.school_type)) {
    recs.push({
      id: 'school-aesh',
      label: 'Demander une AESH',
      href: '/dashboard/family/courriers',
      reason: 'Une AESH peut accompagner votre enfant en classe ordinaire.',
      priority: 'low',
    });
  }

  // Aides
  const aids = steps.aids?.aids ?? [];
  const noAids = aids.length === 0 || (aids.length === 1 && aids[0] === 'none');
  if (noAids && summary.completedCount >= 3) {
    recs.push({
      id: 'aids-overview',
      label: 'Découvrir les aides disponibles',
      href: '/dashboard/family/aides',
      reason: 'Plusieurs aides existent : AEEH, PCH, CESU. Un panorama est disponible.',
      priority: 'medium',
    });
  }

  return recs;
}

// ---------- Métadonnées d'affichage (utilisées par les composants) ----------

export const STEP_META: Record<OnboardingStepKey, { order: number; title: string; subtitle: string }> = {
  doctor: {
    order: 1,
    title: 'Médecin référent',
    subtitle: 'Pédiatre, médecin traitant ou spécialiste qui suit votre enfant.',
  },
  mdph: {
    order: 2,
    title: 'MDPH',
    subtitle: 'Maison Départementale des Personnes Handicapées : où en êtes-vous ?',
  },
  pco_fip: {
    order: 3,
    title: 'PCO / FIP',
    subtitle: 'Plateforme de Coordination et Forfait d\'Intervention Précoce.',
  },
  school: {
    order: 4,
    title: 'École',
    subtitle: 'Structure de scolarisation et dispositifs d\'accompagnement.',
  },
  aids: {
    order: 5,
    title: 'Aides connues',
    subtitle: 'Quelles aides sociales ou financières percevez-vous ?',
  },
};

export const ORDERED_STEPS: OnboardingStepKey[] = (Object.keys(STEP_META) as OnboardingStepKey[])
  .sort((a, b) => STEP_META[a].order - STEP_META[b].order);
