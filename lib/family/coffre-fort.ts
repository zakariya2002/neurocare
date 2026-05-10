/**
 * Coffre-fort de documents santé/scolarité (B2) — types, validation,
 * vocabulaires, helpers MIME et chemin storage.
 *
 * Schema   : health.* (HDS-required).
 * Feature  : FEATURES.coffreFortSante (off par défaut).
 *
 * Conventions :
 * - Le binaire vit dans le bucket privé `health-vault-documents`.
 *   Format de chemin : {user_id}/{child_id}/{uuid}-{slug-filename}.{ext}
 * - Toute lecture pro passe par un signed URL côté server (jamais d'URL publique).
 * - Validation MIME et taille côté server (10 Mo max, PDF / JPG / PNG).
 */

// ===========================================================================
// Vocabulaires contrôlés
// ===========================================================================

export const DOC_TYPES = [
  'mdph',
  'medical',
  'scolarite_medical',
  'administratif',
  'identite',
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  mdph: 'MDPH',
  medical: 'Médical',
  scolarite_medical: 'Scolarité (médical)',
  administratif: 'Administratif',
  identite: 'Identité enfant',
};

export const DOC_TYPE_DESCRIPTIONS: Record<DocType, string> = {
  mdph: 'Notification MDPH, Cerfa, GEVA-A, courriers, recours.',
  medical: 'Ordonnances, comptes-rendus de bilan (orthophonie, psychomot, ergo, psy, ABA), courriers médecin.',
  scolarite_medical: 'PPS, PAP, PAI, GEVA-Sco signés (contiennent des données médicales).',
  administratif: 'Attestations CAF, CESU, justificatifs aides, factures pro hors plateforme.',
  identite: 'Carte d\'identité, carte vitale, justificatif de domicile.',
};

export const DOC_TYPE_COLORS: Record<DocType, { bg: string; border: string; text: string }> = {
  mdph: { bg: 'rgba(79, 70, 229, 0.1)', border: 'rgba(79, 70, 229, 0.3)', text: '#4f46e5' },
  medical: { bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.3)', text: '#dc2626' },
  scolarite_medical: { bg: 'rgba(58, 158, 158, 0.1)', border: 'rgba(58, 158, 158, 0.3)', text: '#3a9e9e' },
  administratif: { bg: 'rgba(2, 126, 126, 0.08)', border: 'rgba(2, 126, 126, 0.3)', text: '#027e7e' },
  identite: { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.3)', text: '#4b5563' },
};

/** Sous-types proposés (libre — l'utilisateur peut aussi taper). */
export const DOC_SUBTYPES: Record<DocType, ReadonlyArray<string>> = {
  mdph: [
    'Notification MDPH',
    'Certificat médical Cerfa',
    'GEVA-A',
    'Courrier MDPH',
    'Recours',
  ],
  medical: [
    'Ordonnance',
    'Compte-rendu orthophonie',
    'Compte-rendu psychomotricité',
    'Compte-rendu ergothérapie',
    'Compte-rendu psychologique',
    'Compte-rendu ABA',
    'Courrier médecin',
    'Bilan',
  ],
  scolarite_medical: [
    'PPS signé',
    'PAP signé',
    'PAI',
    'GEVA-Sco signé',
  ],
  administratif: [
    'Attestation CAF',
    'CESU',
    'Justificatif d\'aide',
    'Facture professionnel',
  ],
  identite: [
    'Carte d\'identité',
    'Carte vitale',
    'Justificatif de domicile',
  ],
};

// ===========================================================================
// MIME / taille / nom de fichier
// ===========================================================================

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
export const STORAGE_BUCKET = 'health-vault-documents';

export const ACCEPTED_FILE_EXTENSIONS = '.pdf,.jpg,.jpeg,.png';

export const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
};

export function isAllowedMime(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

export function extensionFor(mime: string): string {
  switch (mime) {
    case 'application/pdf':
      return 'pdf';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    default:
      return 'bin';
  }
}

/** Nettoie un nom de fichier pour usage dans un chemin storage. */
export function sanitizeFilename(name: string): string {
  const trimmed = name.trim().toLowerCase();
  // Retire l'extension d'origine pour la rajouter de façon contrôlée par mime
  const dot = trimmed.lastIndexOf('.');
  const base = dot > 0 ? trimmed.slice(0, dot) : trimmed;
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug.length > 0 ? slug : 'document';
}

/** Format : `{userId}/{childId}/{uuid}-{slug}.{ext}` (sans le bucket). */
export function buildStoragePath(opts: {
  userId: string;
  childId: string;
  uuid: string;
  filename: string;
  mime: string;
}): string {
  const slug = sanitizeFilename(opts.filename);
  const ext = extensionFor(opts.mime);
  return `${opts.userId}/${opts.childId}/${opts.uuid}-${slug}.${ext}`;
}

// ===========================================================================
// Types DB-aligned
// ===========================================================================

export const ACCESS_LEVELS = ['read', 'download'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  read: 'Lecture seule',
  download: 'Lecture et téléchargement',
};

export const AUDIT_ACTIONS = [
  'view',
  'download',
  'signed_url',
  'share_grant',
  'share_revoke',
  'update',
  'delete',
  'create',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  view: 'Consultation',
  download: 'Téléchargement',
  signed_url: 'Lien sécurisé généré',
  share_grant: 'Partage accordé',
  share_revoke: 'Partage révoqué',
  update: 'Modification',
  delete: 'Suppression',
  create: 'Ajout',
};

export interface ChildDocumentRow {
  id: string;
  child_id: string;
  user_id: string;
  doc_type: DocType;
  doc_subtype: string | null;
  title: string;
  description: string | null;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  issued_at: string | null;
  expires_at: string | null;
  issuer_name: string | null;
  tags: string[];
  ocr_extracted_text: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChildDocumentShareRow {
  id: string;
  document_id: string;
  shared_with_user_id: string;
  access_level: AccessLevel;
  granted_by: string;
  expires_at: string | null;
  created_at: string;
}

export interface ChildDocumentAccessLogRow {
  id: string;
  document_id: string;
  user_id: string;
  action: AuditAction;
  ip: string | null;
  user_agent: string | null;
  occurred_at: string;
}

// ===========================================================================
// Validation payloads
// ===========================================================================

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 1000;
export const SUBTYPE_MAX = 80;
export const ISSUER_MAX = 200;
export const TAG_MAX_LEN = 40;
export const TAG_MAX_COUNT = 12;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const trimStr = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
};

const isDocType = (v: unknown): v is DocType =>
  typeof v === 'string' && (DOC_TYPES as readonly string[]).includes(v);

const isAccessLevel = (v: unknown): v is AccessLevel =>
  typeof v === 'string' && (ACCESS_LEVELS as readonly string[]).includes(v);

export function isIsoDate(v: unknown): v is string {
  if (typeof v !== 'string' || !DATE_REGEX.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

function sanitizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of input) {
    const t = trimStr(v);
    if (!t) continue;
    if (t.length > TAG_MAX_LEN) continue;
    const lower = t.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(t);
    if (out.length >= TAG_MAX_COUNT) break;
  }
  return out;
}

export interface DocumentMetadataPayload {
  doc_type: DocType;
  doc_subtype: string | null;
  title: string;
  description: string | null;
  issued_at: string | null;
  expires_at: string | null;
  issuer_name: string | null;
  tags: string[];
}

/**
 * Parse / valide les métadonnées d'un document (création ou mise à jour).
 * Retourne null si invalide. La partie binaire (file) est validée séparément.
 */
export function parseDocumentMetadataPayload(
  input: unknown
): DocumentMetadataPayload | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;

  if (!isDocType(raw.doc_type)) return null;

  const title = trimStr(raw.title);
  if (!title || title.length > TITLE_MAX) return null;

  const description = trimStr(raw.description);
  if (description !== null && description.length > DESCRIPTION_MAX) return null;

  const doc_subtype = trimStr(raw.doc_subtype);
  if (doc_subtype !== null && doc_subtype.length > SUBTYPE_MAX) return null;

  const issuer_name = trimStr(raw.issuer_name);
  if (issuer_name !== null && issuer_name.length > ISSUER_MAX) return null;

  const issued_at = raw.issued_at === null || raw.issued_at === undefined || raw.issued_at === ''
    ? null
    : isIsoDate(raw.issued_at) ? (raw.issued_at as string) : undefined;
  if (issued_at === undefined) return null;

  const expires_at = raw.expires_at === null || raw.expires_at === undefined || raw.expires_at === ''
    ? null
    : isIsoDate(raw.expires_at) ? (raw.expires_at as string) : undefined;
  if (expires_at === undefined) return null;

  return {
    doc_type: raw.doc_type as DocType,
    doc_subtype,
    title,
    description,
    issued_at,
    expires_at,
    issuer_name,
    tags: sanitizeTags(raw.tags),
  };
}

export interface SharePayload {
  shared_with_user_id: string;
  access_level: AccessLevel;
  expires_at: string | null;
}

export function parseSharePayload(input: unknown): SharePayload | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const userId = trimStr(raw.shared_with_user_id);
  if (!userId) return null;
  // Format UUID basique
  if (!/^[0-9a-f-]{32,40}$/i.test(userId)) return null;
  if (!isAccessLevel(raw.access_level)) return null;
  let expires_at: string | null = null;
  if (raw.expires_at !== null && raw.expires_at !== undefined && raw.expires_at !== '') {
    if (typeof raw.expires_at !== 'string') return null;
    const d = new Date(raw.expires_at);
    if (Number.isNaN(d.getTime())) return null;
    expires_at = d.toISOString();
  }
  return {
    shared_with_user_id: userId,
    access_level: raw.access_level,
    expires_at,
  };
}

// ===========================================================================
// Échéances
// ===========================================================================

export const EXPIRY_WARNING_DAYS = 90;

export type ExpiryStatus = 'ok' | 'soon' | 'expired' | 'none';

export function expiryStatus(expires_at: string | null): ExpiryStatus {
  if (!expires_at) return 'none';
  const now = new Date();
  const exp = new Date(`${expires_at}T00:00:00`);
  if (Number.isNaN(exp.getTime())) return 'none';
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= EXPIRY_WARNING_DAYS) return 'soon';
  return 'ok';
}

export function expiryDaysLeft(expires_at: string | null): number | null {
  if (!expires_at) return null;
  const exp = new Date(`${expires_at}T00:00:00`);
  if (Number.isNaN(exp.getTime())) return null;
  return Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

// ===========================================================================
// Affichage taille
// ===========================================================================

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function formatFrenchDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(`${iso.length === 10 ? `${iso}T00:00:00` : iso}`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatFrenchDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ===========================================================================
// Agrégation par type (vue header)
// ===========================================================================

export interface VaultAggregate {
  total: number;
  byType: Record<DocType, number>;
  expiringSoon: number;
  expired: number;
}

export function aggregateDocuments(docs: ReadonlyArray<ChildDocumentRow>): VaultAggregate {
  const byType = DOC_TYPES.reduce<Record<DocType, number>>((acc, t) => {
    acc[t] = 0;
    return acc;
  }, {} as Record<DocType, number>);
  let expiringSoon = 0;
  let expired = 0;
  for (const d of docs) {
    if (byType[d.doc_type] !== undefined) byType[d.doc_type]++;
    const status = expiryStatus(d.expires_at);
    if (status === 'soon') expiringSoon++;
    else if (status === 'expired') expired++;
  }
  return {
    total: docs.length,
    byType,
    expiringSoon,
    expired,
  };
}

// ===========================================================================
// Bandeau HDS (copy partagée)
// ===========================================================================

export const HDS_DEV_BANNER =
  'Cette section sera hébergée sur infrastructure HDS-certifiée avant la mise en production.';

export const PRIVACY_REASSURANCE =
  'Vos documents sont stockés en privé, chiffrés au repos. Vous contrôlez qui peut les consulter, document par document.';
