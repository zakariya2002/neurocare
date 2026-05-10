/**
 * Web Push helper (A2 Rappels MDPH).
 *
 * Cette implémentation est un stub : la dépendance `web-push` n'est pas
 * encore installée dans le repo (cf. package.json). Pour l'activer en
 * production :
 *
 *   1. `npm install web-push @types/web-push`
 *   2. Générer une paire de clés VAPID :
 *        `npx web-push generate-vapid-keys`
 *   3. Ajouter aux variables d'env (Vercel + .env.local) :
 *        VAPID_PUBLIC_KEY=...
 *        VAPID_PRIVATE_KEY=...
 *        VAPID_SUBJECT=mailto:admin@neuro-care.fr
 *        NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   (même valeur que VAPID_PUBLIC_KEY)
 *   4. Décommenter le bloc dynamic-import ci-dessous (la lib web-push est
 *      Node-only, ne pas l'importer en top-level).
 *
 * En attendant, `sendWebPush` log la tentative et renvoie { sent: false,
 * skipped: true, reason: 'web-push not configured' } — le cron continue de
 * fonctionner et la partie email est envoyée normalement.
 *
 * TODO(A2-push) : remplacer le stub par l'implémentation réelle.
 */

export interface PushSubscriptionShape {
  id: string;
  user_id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushResult {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  expired?: boolean;            // 410 Gone — supprimer la subscription
  error?: string;
}

function isConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  );
}

export function getPublicVapidKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ?? process.env.VAPID_PUBLIC_KEY
    ?? null;
}

/**
 * Envoie une notification push à un endpoint donné.
 *
 * Tant que la lib `web-push` n'est pas installée, on stub : on log et on
 * renvoie skipped=true. Le cron ne plante pas, la partie email reste
 * fonctionnelle. Voir la doc en tête de fichier pour l'activation réelle.
 */
export async function sendWebPush(
  subscription: PushSubscriptionShape,
  payload: PushPayload
): Promise<PushResult> {
  if (!isConfigured()) {
    console.warn('[web-push] VAPID non configurée, push ignoré pour endpoint=%s', subscription.endpoint.slice(0, 60));
    return { sent: false, skipped: true, reason: 'web-push not configured' };
  }

  // === Bloc à décommenter une fois la lib `web-push` installée ===
  //
  // try {
  //   const webpush = (await import('web-push')).default;
  //   webpush.setVapidDetails(
  //     process.env.VAPID_SUBJECT!,
  //     process.env.VAPID_PUBLIC_KEY!,
  //     process.env.VAPID_PRIVATE_KEY!,
  //   );
  //   await webpush.sendNotification(
  //     {
  //       endpoint: subscription.endpoint,
  //       keys: subscription.keys,
  //     },
  //     JSON.stringify(payload),
  //     { TTL: 60 * 60 * 24 } // 24h
  //   );
  //   return { sent: true };
  // } catch (err: any) {
  //   const status = err?.statusCode ?? err?.status;
  //   if (status === 410 || status === 404) {
  //     return { sent: false, expired: true, error: 'subscription expired' };
  //   }
  //   return { sent: false, error: err?.message ?? 'unknown error' };
  // }

  // En attendant l'install : stub
  console.warn('[web-push] stub — install `web-push` pour activer (endpoint=%s)', subscription.endpoint.slice(0, 60));
  return { sent: false, skipped: true, reason: 'web-push lib not installed' };
}
