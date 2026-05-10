/**
 * Types pour l'annuaire externe géolocalisé (feature A5).
 *
 * Annuaire public référençant les acteurs publics du parcours TND :
 * PCO, CRA, MDPH, CAMSP. Schema `public.external_directory_entries`.
 */

export type DirectoryType = 'pco' | 'cra' | 'mdph' | 'camsp';

export interface DirectoryEntry {
  id: string;
  type: DirectoryType;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  department_code: string | null;
  region_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  source_label: string | null;
  source_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DirectoryTypeConfig {
  code: DirectoryType;
  label: string;        // PCO
  fullName: string;     // Plateforme de Coordination et d'Orientation TND
  shortDescription: string;
  longDescription: string;
  defaultSourceLabel: string;
  defaultSourceUrl: string;
  /** Mot pluriel utilisé dans les listings (ex: "Les PCO de France") */
  plural: string;
  /** Article défini singulier (ex: "la PCO", "le CRA") */
  article: string;
  /** Couleur Tailwind utilisée pour les badges */
  accent: string;
}

export const DIRECTORY_TYPES: Record<DirectoryType, DirectoryTypeConfig> = {
  pco: {
    code: 'pco',
    label: 'PCO',
    fullName: 'Plateforme de Coordination et d\'Orientation TND',
    plural: 'PCO',
    article: 'la PCO',
    shortDescription:
      'Coordonne le parcours diagnostique des enfants de 0 à 12 ans présentant des suspicions de TND.',
    longDescription:
      'Les Plateformes de Coordination et d\'Orientation (PCO) accompagnent les familles dans le parcours de bilan et d\'intervention précoce. Elles coordonnent les professionnels libéraux (psychologue, psychomotricien, ergothérapeute) avec un forfait précoce pris en charge par l\'Assurance maladie pendant 1 an.',
    defaultSourceLabel: 'handicap.gouv.fr',
    defaultSourceUrl: 'https://handicap.gouv.fr/les-plateformes-de-coordination-et-dorientation-pour-les-troubles-du-neuro-developpement',
    accent: 'bg-teal-100 text-teal-800',
  },
  cra: {
    code: 'cra',
    label: 'CRA',
    fullName: 'Centre Ressources Autisme',
    plural: 'CRA',
    article: 'le CRA',
    shortDescription:
      'Centre régional d\'expertise sur l\'autisme : information, formation, orientation, recherche.',
    longDescription:
      'Les Centres Ressources Autisme (CRA) sont des structures régionales qui accompagnent les personnes autistes, leurs familles et les professionnels. Ils proposent évaluations diagnostiques de second avis, documentation, formations et orientation vers les structures locales.',
    defaultSourceLabel: 'gncra.fr',
    defaultSourceUrl: 'https://gncra.fr',
    accent: 'bg-purple-100 text-purple-800',
  },
  mdph: {
    code: 'mdph',
    label: 'MDPH',
    fullName: 'Maison Départementale des Personnes Handicapées',
    plural: 'MDPH',
    article: 'la MDPH',
    shortDescription:
      'Guichet unique départemental pour l\'évaluation des droits et l\'instruction des dossiers handicap.',
    longDescription:
      'La Maison Départementale des Personnes Handicapées (MDPH) accueille, informe, accompagne et conseille les personnes handicapées et leurs familles. Elle instruit les demandes d\'AEEH, PCH, AAH, RQTH, orientation scolaire (PPS, AESH) et orientation médico-sociale.',
    defaultSourceLabel: 'cnsa.fr',
    defaultSourceUrl: 'https://www.cnsa.fr/vous-etes-une-personne-handicapee-ou-un-proche/les-maisons-departementales-des-personnes-handicapees',
    accent: 'bg-blue-100 text-blue-800',
  },
  camsp: {
    code: 'camsp',
    label: 'CAMSP',
    fullName: 'Centre d\'Action Médico-Sociale Précoce',
    plural: 'CAMSP',
    article: 'le CAMSP',
    shortDescription:
      'Dépistage, diagnostic et prise en charge précoce des enfants de 0 à 6 ans avec déficit ou retard.',
    longDescription:
      'Les Centres d\'Action Médico-Sociale Précoce (CAMSP) accueillent les enfants de 0 à 6 ans présentant ou risquant de présenter un retard de développement, un handicap ou un trouble du neurodéveloppement. Ils assurent dépistage, diagnostic, traitement, rééducation et soutien aux familles, en lien avec la PMI et l\'école maternelle.',
    defaultSourceLabel: 'finess.sante.gouv.fr',
    defaultSourceUrl: 'https://finess.esante.gouv.fr',
    accent: 'bg-amber-100 text-amber-800',
  },
};

export const DIRECTORY_TYPE_CODES: ReadonlyArray<DirectoryType> = [
  'pco', 'cra', 'mdph', 'camsp',
];

export const isDirectoryType = (value: string): value is DirectoryType =>
  (DIRECTORY_TYPE_CODES as ReadonlyArray<string>).includes(value);
