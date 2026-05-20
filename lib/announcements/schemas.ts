import { z } from 'zod';

// ENUMS ------------------------------------------------------

export const ACCOMPANIMENT_TYPES = [
  'domicile',
  'cabinet',
  'ecole',
  'creche',
  'exterieur',
  'distanciel',
] as const;

export const DESIRED_PROFESSIONS = [
  'educateur_specialise',
  'aes',
  'ame',
  'psychomotricien',
  'ergotherapeute',
  'orthophoniste',
  'psychologue',
  'aba_therapist',
  'autre',
] as const;

export const TND_CONTEXTS = [
  'tsa',
  'tdah',
  'dys',
  'dyspraxie',
  'haut_potentiel',
  'di',
  'autre',
] as const;

export const PLACE_TYPES = [
  'domicile_famille',
  'cabinet_pro',
  'ecole',
  'creche',
  'exterieur',
  'distanciel',
] as const;

export const START_FLEXIBILITY = [
  'immediate',
  'sous_15j',
  'sous_1mois',
  'flexible',
] as const;

export const ANNOUNCEMENT_STATUS = [
  'draft',
  'pending',
  'published',
  'rejected',
  'filled',
  'expired',
  'archived',
] as const;

export const RESPONSE_STATUS = [
  'sent',
  'read',
  'shortlisted',
  'accepted',
  'declined',
  'withdrawn',
] as const;

export const GENDER_PREFERENCES = ['male', 'female', 'any'] as const;

// Helpers ----------------------------------------------------

const accompanimentType = z.enum(ACCOMPANIMENT_TYPES);
const desiredProfession = z.enum(DESIRED_PROFESSIONS);
const tndContext = z.enum(TND_CONTEXTS);
const placeType = z.enum(PLACE_TYPES);
const startFlex = z.enum(START_FLEXIBILITY);
const genderPref = z.enum(GENDER_PREFERENCES);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date attendu YYYY-MM-DD');

// CREATE -----------------------------------------------------

export const createAnnouncementSchema = z.object({
  child_id: z.string().uuid().optional(),
  title: z.string().min(5).max(120),
  description: z.string().min(50).max(5000),

  accompaniment_types: z.array(accompanimentType).min(1),
  desired_professions: z.array(desiredProfession).min(1),
  tnd_context: z.array(tndContext).min(1),
  place_types: z.array(placeType).min(1),

  location_label: z.string().min(2).max(200),
  city: z.string().min(2).max(100),
  postcode: z.string().regex(/^\d{5}$/).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  min_hours_per_week: z.number().positive().max(80).optional(),
  max_hours_per_week: z.number().positive().max(80).optional(),
  hourly_budget_min: z.number().nonnegative().max(500).optional(),
  hourly_budget_max: z.number().nonnegative().max(500).optional(),

  start_date: isoDate.optional(),
  start_flexibility: startFlex.optional(),

  gender_preference: genderPref.optional(),
  certifications_required: z.array(z.string()).max(20).optional().default([]),
  languages_required: z.array(z.string()).max(20).optional().default([]),

  // draft|pending uniquement à la création
  status: z.enum(['draft', 'pending']).optional(),

  expires_at: z.string().datetime().optional(),
}).refine(
  (d) => d.max_hours_per_week == null || d.min_hours_per_week == null
    || d.max_hours_per_week >= d.min_hours_per_week,
  { message: 'max_hours_per_week doit être >= min_hours_per_week', path: ['max_hours_per_week'] }
).refine(
  (d) => d.hourly_budget_max == null || d.hourly_budget_min == null
    || d.hourly_budget_max >= d.hourly_budget_min,
  { message: 'hourly_budget_max doit être >= hourly_budget_min', path: ['hourly_budget_max'] }
);

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

// UPDATE -----------------------------------------------------

// Champs autorisés en modification par la famille
export const updateAnnouncementSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(50).max(5000).optional(),

  accompaniment_types: z.array(accompanimentType).min(1).optional(),
  desired_professions: z.array(desiredProfession).min(1).optional(),
  tnd_context: z.array(tndContext).min(1).optional(),
  place_types: z.array(placeType).min(1).optional(),

  location_label: z.string().min(2).max(200).optional(),
  city: z.string().min(2).max(100).optional(),
  postcode: z.string().regex(/^\d{5}$/).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  min_hours_per_week: z.number().positive().max(80).nullable().optional(),
  max_hours_per_week: z.number().positive().max(80).nullable().optional(),
  hourly_budget_min: z.number().nonnegative().max(500).nullable().optional(),
  hourly_budget_max: z.number().nonnegative().max(500).nullable().optional(),

  start_date: isoDate.nullable().optional(),
  start_flexibility: startFlex.nullable().optional(),

  gender_preference: genderPref.nullable().optional(),
  certifications_required: z.array(z.string()).max(20).optional(),
  languages_required: z.array(z.string()).max(20).optional(),

  // Seules transitions de statut autorisées en update famille : archived (désactivation),
  // ou pas de changement (le serveur reset à 'pending' en cas de modif de contenu)
  status: z.enum(['archived', 'draft']).optional(),

  expires_at: z.string().datetime().nullable().optional(),
});

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

// FILTERS ----------------------------------------------------

const csvArray = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => {
    if (v == null || v === '') return undefined;
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
    return v;
  }, z.array(item).optional());

const numFromQuery = z.preprocess((v) => {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}, z.number().optional());

export const announcementFiltersSchema = z.object({
  city: z.string().min(1).optional(),
  lat: numFromQuery,
  lng: numFromQuery,
  radius_km: numFromQuery,

  accompaniment_types: csvArray(accompanimentType),
  desired_professions: csvArray(desiredProfession),
  tnd_context: csvArray(tndContext),
  place_types: csvArray(placeType),

  min_hours_per_week: numFromQuery,
  max_hours_per_week: numFromQuery,
  gender_preference: genderPref.optional(),
  start_date_from: isoDate.optional(),

  limit: z.preprocess((v) => {
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(Math.max(n, 1), 50) : undefined;
  }, z.number().int().min(1).max(50).default(20)),

  offset: z.preprocess((v) => {
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(n, 0) : undefined;
  }, z.number().int().min(0).default(0)),
});

export type AnnouncementFiltersInput = z.infer<typeof announcementFiltersSchema>;

// RESPOND ----------------------------------------------------

export const respondAnnouncementSchema = z.object({
  message: z.string().min(20).max(3000),
  proposed_hourly_rate: z.number().positive().max(500).optional(),
});

export type RespondAnnouncementInput = z.infer<typeof respondAnnouncementSchema>;

// UPDATE RESPONSE --------------------------------------------

// La transition est validée côté serveur selon le rôle (famille vs pro)
export const updateResponseSchema = z.object({
  status: z.enum(['read', 'shortlisted', 'accepted', 'declined', 'withdrawn']),
});

export type UpdateResponseInput = z.infer<typeof updateResponseSchema>;

// Champs "contenu" — toute modification force re-modération
export const CONTENT_FIELDS = [
  'title',
  'description',
  'accompaniment_types',
  'desired_professions',
  'tnd_context',
  'place_types',
  'location_label',
  'city',
  'postcode',
  'latitude',
  'longitude',
  'min_hours_per_week',
  'max_hours_per_week',
  'hourly_budget_min',
  'hourly_budget_max',
  'start_date',
  'start_flexibility',
  'gender_preference',
  'certifications_required',
  'languages_required',
] as const;
