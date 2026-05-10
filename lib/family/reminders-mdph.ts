/**
 * Rappels administratifs MDPH (A2) — helpers et types partagés.
 *
 * - Schema Postgres : public.family_admin_reminders (non-HDS).
 * - Feature flag : FEATURES.rappelsMdph.
 *
 * Le ton des relances change selon le seuil :
 *   J-90 → informatif    ("votre dossier expire dans 3 mois")
 *   J-60 → encourageant  ("c'est le bon moment de préparer le renouvellement")
 *   J-30 → urgent doux   ("il reste 1 mois, déposez votre dossier")
 *   J-7  → urgent fort   ("il reste 1 semaine, attention à la rupture de droits")
 */

export const REMINDER_TYPES = [
  'mdph_renew',
  'aeeh_expire',
  'pch_expire',
  'fip_end',
  'pps_renew',
  'autre',
] as const;

export type ReminderType = (typeof REMINDER_TYPES)[number];

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  mdph_renew: 'Renouvellement MDPH',
  aeeh_expire: 'Fin de droits AEEH',
  pch_expire: 'Fin de droits PCH',
  fip_end: 'Fin du Forfait d’intervention précoce',
  pps_renew: 'Renouvellement PPS',
  autre: 'Autre échéance',
};

// Seuils de relance, du plus grand au plus petit (matches l'ordre logique)
export const REMINDER_THRESHOLDS = [90, 60, 30, 7] as const;
export type ReminderThreshold = (typeof REMINDER_THRESHOLDS)[number];

export interface FamilyAdminReminderRow {
  id: string;
  user_id: string;
  child_id: string;
  type: ReminderType;
  expires_at: string;            // YYYY-MM-DD
  label: string | null;
  notes: string | null;
  last_notified_seuil: 0 | 90 | 60 | 30 | 7;
  last_notified_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ───────────────────────────────────────────────────────────
// Calcul d'urgence pour l'UI
// ───────────────────────────────────────────────────────────

export type ReminderUrgency = 'expired' | 'red' | 'orange' | 'green' | 'dismissed';

export function daysUntil(expiresAt: string, today: Date = new Date()): number {
  // Travailler en UTC pour éviter les soucis DST
  const [y, m, d] = expiresAt.split('-').map(Number);
  if (!y || !m || !d) return Number.NaN;
  const target = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

export function urgencyOf(reminder: Pick<FamilyAdminReminderRow, 'expires_at' | 'dismissed_at'>): ReminderUrgency {
  if (reminder.dismissed_at) return 'dismissed';
  const days = daysUntil(reminder.expires_at);
  if (Number.isNaN(days)) return 'green';
  if (days < 0) return 'expired';
  if (days < 30) return 'red';
  if (days <= 90) return 'orange';
  return 'green';
}

export function urgencyClasses(u: ReminderUrgency): { dot: string; badge: string; label: string } {
  switch (u) {
    case 'expired':
      return { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Expiré' };
    case 'red':
      return { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200', label: 'Urgent' };
    case 'orange':
      return { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 border-amber-200', label: 'À préparer' };
    case 'green':
      return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'OK' };
    case 'dismissed':
      return { dot: 'bg-gray-300', badge: 'bg-gray-50 text-gray-500 border-gray-200', label: 'Traité' };
  }
}

// ───────────────────────────────────────────────────────────
// Logique cron : choisir le seuil à notifier
// ───────────────────────────────────────────────────────────

/**
 * Retourne le seuil à notifier maintenant pour un rappel donné, ou null
 * si rien à faire.
 *
 * On notifie uniquement si :
 * - le rappel n'est pas dismissed
 * - daysUntil(expires_at) > 0 (sinon expiré, rien à rappeler)
 * - daysUntil <= un seuil non encore notifié
 *
 * On retourne le seuil le PLUS GRAND non encore notifié atteint, pour ne
 * pas envoyer plusieurs emails si le cron a sauté plusieurs jours.
 */
export function nextThresholdToNotify(
  reminder: Pick<FamilyAdminReminderRow, 'expires_at' | 'dismissed_at' | 'last_notified_seuil'>,
  today: Date = new Date()
): ReminderThreshold | null {
  if (reminder.dismissed_at) return null;
  const days = daysUntil(reminder.expires_at, today);
  if (Number.isNaN(days) || days <= 0) return null;

  // Seuils non encore notifiés (strictement plus petits que last_notified_seuil
  // OU si last_notified_seuil = 0, tous les seuils)
  const last = reminder.last_notified_seuil ?? 0;

  // Trouver les seuils déclenchables = days <= seuil
  // Et seuil < last (car on diminue le seuil au fil du temps)
  // Cas spécial : si last = 0, on accepte tous les seuils.
  const candidates = REMINDER_THRESHOLDS.filter((s) => {
    if (days > s) return false;
    if (last === 0) return true;
    return s < last;
  });

  // Retourner le plus grand candidat (le plus "doux" qui s'applique)
  if (candidates.length === 0) return null;
  return candidates[0]; // REMINDER_THRESHOLDS est trié desc
}

// ───────────────────────────────────────────────────────────
// Copy bienveillante par seuil
// ───────────────────────────────────────────────────────────

export interface ReminderCopy {
  subject: string;
  preheader: string;
  headline: string;
  intro: string;
  closing: string;
  pushTitle: string;
  pushBody: string;
}

export function buildReminderCopy(
  reminder: Pick<FamilyAdminReminderRow, 'type' | 'expires_at' | 'label'>,
  threshold: ReminderThreshold,
  childFirstName: string | null
): ReminderCopy {
  const typeLabel = REMINDER_TYPE_LABELS[reminder.type];
  const customLabel = reminder.label?.trim();
  const subjectLine = customLabel ? `${typeLabel} — ${customLabel}` : typeLabel;
  const child = childFirstName ? ` pour ${childFirstName}` : '';
  const expiresAtFr = formatDateFr(reminder.expires_at);

  if (threshold === 90) {
    return {
      subject: `${typeLabel}${child} : 3 mois pour préparer`,
      preheader: `Vos droits expirent le ${expiresAtFr}.`,
      headline: 'Une échéance à anticiper',
      intro: `Bonjour, vos droits "${subjectLine}"${child} arrivent à échéance le ${expiresAtFr}, soit dans environ 3 mois. C'est le moment idéal pour rassembler les pièces et solliciter, si besoin, vos professionnels accompagnants pour les bilans à joindre au dossier.`,
      closing: 'Anticiper évite la rupture de droits. Vous avez le temps, mais autant s’y mettre dès maintenant.',
      pushTitle: `Échéance dans 3 mois : ${typeLabel}`,
      pushBody: `${subjectLine}${child} expire le ${expiresAtFr}. Pensez à préparer le dossier.`,
    };
  }

  if (threshold === 60) {
    return {
      subject: `${typeLabel}${child} : 2 mois avant l'échéance`,
      preheader: `Vos droits expirent le ${expiresAtFr}.`,
      headline: 'Il est temps de déposer',
      intro: `Bonjour, vos droits "${subjectLine}"${child} expirent le ${expiresAtFr}, dans environ 2 mois. Si ce n'est pas déjà fait, c'est le bon moment pour déposer le dossier de renouvellement (les MDPH ont parfois des délais d'instruction longs).`,
      closing: 'Vous pouvez consulter votre centre de rappels pour suivre l’avancée.',
      pushTitle: `Échéance dans 2 mois : ${typeLabel}`,
      pushBody: `${subjectLine}${child} expire le ${expiresAtFr}. Déposez le dossier.`,
    };
  }

  if (threshold === 30) {
    return {
      subject: `${typeLabel}${child} : 1 mois — attention à la rupture de droits`,
      preheader: `Échéance le ${expiresAtFr}.`,
      headline: 'Plus qu’un mois',
      intro: `Bonjour, l'échéance "${subjectLine}"${child} approche : le ${expiresAtFr}, soit dans environ 1 mois. Si le dossier n'est pas encore déposé, faites-le sans attendre pour éviter une rupture de droits (perte temporaire d'AEEH, PCH, etc.).`,
      closing: 'En cas de retard de la MDPH, conservez l’accusé de dépôt comme preuve.',
      pushTitle: `Échéance dans 1 mois : ${typeLabel}`,
      pushBody: `${subjectLine}${child} expire le ${expiresAtFr}. À traiter.`,
    };
  }

  // J-7
  return {
    subject: `${typeLabel}${child} : 7 jours — action requise`,
    preheader: `Échéance le ${expiresAtFr}.`,
    headline: 'Échéance dans une semaine',
    intro: `Bonjour, "${subjectLine}"${child} arrive à échéance le ${expiresAtFr}, soit dans 7 jours. Si la démarche n'a pas été engagée, contactez votre MDPH ou le service concerné dès aujourd'hui pour limiter le risque de rupture de droits.`,
    closing: 'Si le dossier est déjà déposé, vous pouvez marquer ce rappel comme traité.',
    pushTitle: `Urgent — ${typeLabel} dans 7 jours`,
    pushBody: `${subjectLine}${child} expire le ${expiresAtFr}.`,
  };
}

export function formatDateFr(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(dt);
}

// ───────────────────────────────────────────────────────────
// Validation côté serveur
// ───────────────────────────────────────────────────────────

export interface ReminderInput {
  child_id: string;
  type: ReminderType;
  expires_at: string;            // YYYY-MM-DD
  label?: string | null;
  notes?: string | null;
}

export function parseReminderInput(body: unknown): { ok: true; value: ReminderInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Body invalide' };
  const o = body as Record<string, unknown>;

  const child_id = typeof o.child_id === 'string' ? o.child_id : null;
  if (!child_id) return { ok: false, error: 'child_id manquant' };

  const type = typeof o.type === 'string' ? o.type : null;
  if (!type || !(REMINDER_TYPES as readonly string[]).includes(type)) {
    return { ok: false, error: 'Type d’échéance invalide' };
  }

  const expires_at = typeof o.expires_at === 'string' ? o.expires_at : null;
  if (!expires_at || !/^\d{4}-\d{2}-\d{2}$/.test(expires_at)) {
    return { ok: false, error: 'Date d’expiration invalide (format AAAA-MM-JJ requis)' };
  }

  const label = typeof o.label === 'string' && o.label.trim().length > 0
    ? o.label.trim().slice(0, 200)
    : null;
  const notes = typeof o.notes === 'string' && o.notes.trim().length > 0
    ? o.notes.trim().slice(0, 2000)
    : null;

  return {
    ok: true,
    value: { child_id, type: type as ReminderType, expires_at, label, notes },
  };
}
