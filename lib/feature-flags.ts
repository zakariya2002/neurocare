/**
 * Feature flags pour le programme d'audit famille 2026.
 *
 * Convention :
 * - Les flags non-HDS sont ON par défaut (toggle OFF explicite via env).
 * - Les flags HDS-sensibles sont OFF par défaut (toggle ON explicite via env).
 *   Ils ne doivent être activés en production qu'après migration de l'infra
 *   sur un hébergeur HDS-certifié (cf. docs/dev/feature-flags-hds.md).
 *
 * Usage côté client :
 *   import { FEATURES } from '@/lib/feature-flags';
 *   if (FEATURES.journalBord) { ... }
 *
 * Usage côté serveur : idem (lecture des `process.env` au build pour
 *   les `NEXT_PUBLIC_*`, ou au runtime pour les autres).
 */

const isOn = (value: string | undefined, defaultOn: boolean) =>
  value === undefined ? defaultOn : value === 'true';

const isOff = (value: string | undefined) => value === 'false';

export const FEATURES = {
  // Non-HDS — ON par défaut
  onboardingPostDiag: !isOff(process.env.NEXT_PUBLIC_FEATURE_ONBOARDING_POSTDIAG),
  rappelsMdph: !isOff(process.env.NEXT_PUBLIC_FEATURE_RAPPELS_MDPH),
  courriersAdmin: !isOff(process.env.NEXT_PUBLIC_FEATURE_COURRIERS_ADMIN),
  justificatifsAnnuels: !isOff(process.env.NEXT_PUBLIC_FEATURE_JUSTIFICATIFS_ANNUELS),
  annuaireExterne: !isOff(process.env.NEXT_PUBLIC_FEATURE_ANNUAIRE_EXTERNE),
  scolarite: !isOff(process.env.NEXT_PUBLIC_FEATURE_SCOLARITE),

  // HDS-sensibles — OFF par défaut, à activer explicitement
  journalBord: isOn(process.env.NEXT_PUBLIC_FEATURE_JOURNAL_BORD, false),
  coffreFortSante: isOn(process.env.NEXT_PUBLIC_FEATURE_COFFRE_FORT_SANTE, false),
} as const;

export type FeatureKey = keyof typeof FEATURES;

/**
 * Liste des flags HDS-sensibles — utilisée pour les contrôles serveur
 * (refus d'accès si le flag est OFF, même si la route est appelée directement).
 */
export const HDS_FEATURES: ReadonlyArray<FeatureKey> = [
  'journalBord',
  'coffreFortSante',
];

export const isHdsFeature = (key: FeatureKey): boolean =>
  HDS_FEATURES.includes(key);
