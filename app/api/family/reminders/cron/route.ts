/**
 * CRON Rappels MDPH (A2) — invoqué quotidiennement par Vercel Cron.
 *
 * Auth : header `Authorization: Bearer ${CRON_SECRET}` (pattern existant
 * cf. app/api/cron/send-sms-reminders/route.ts). Pas de vérification de
 * feature flag ici car le cron est lui-même planifié — le feature flag
 * empêche déjà l'UI famille de créer des rappels. Le cron n'a donc rien
 * à faire si la table est vide.
 *
 * Pour chaque rappel non dismissed dont expires_at > now() :
 *   - calcule le seuil J-90 / J-60 / J-30 / J-7 atteint
 *   - si >= 1 seuil non encore notifié atteint :
 *       - envoie un email transactionnel via Resend (lib/email-templates)
 *       - tente un Web Push aux endpoints de l'utilisateur
 *       - met à jour last_notified_seuil + last_notified_at
 *
 * Le client utilisé est SUPER USER (SUPABASE_SERVICE_ROLE_KEY) afin
 * d'opérer sur tous les utilisateurs sans dépendre de session cookie.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  emailLayout,
  emailHeader,
  emailBody,
  emailButton,
  emailInfoBox,
  emailWarningBox,
  emailSignature,
  emailColors,
} from '@/lib/email-templates/base';
import {
  buildReminderCopy,
  formatDateFr,
  nextThresholdToNotify,
  REMINDER_TYPE_LABELS,
  type FamilyAdminReminderRow,
  type ReminderThreshold,
} from '@/lib/family/reminders-mdph';
import { sendWebPush, type PushSubscriptionShape } from '@/lib/web-push';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NeuroCare <noreply@neuro-care.fr>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr';

interface ReminderJoined extends FamilyAdminReminderRow {
  child: { first_name: string | null } | { first_name: string | null }[] | null;
}

function buildReminderEmailHtml(args: {
  copy: ReturnType<typeof buildReminderCopy>;
  threshold: ReminderThreshold;
  expiresAt: string;
  typeLabel: string;
  childFirstName: string | null;
}): string {
  const { copy, threshold, expiresAt, typeLabel, childFirstName } = args;

  const expiresAtFr = formatDateFr(expiresAt);
  const childLine = childFirstName
    ? `<p style="margin: 0 0 8px; font-size: 14px; color: ${emailColors.textLight};">Enfant concerné : <strong>${childFirstName}</strong></p>`
    : '';

  const box = threshold <= 30
    ? emailWarningBox(`Échéance le ${expiresAtFr}. Évitez la rupture de droits en agissant rapidement.`)
    : emailInfoBox(`Échéance le ${expiresAtFr}. Vous avez encore le temps, mais autant anticiper.`);

  return emailLayout(
    `
      ${emailHeader(copy.headline, typeLabel)}
      ${emailBody(`
        <p style="margin: 0 0 20px; font-size: 16px; color: ${emailColors.text}; line-height: 1.6;">
          ${copy.intro}
        </p>
        ${childLine}
        ${box}
        <p style="margin: 0 0 16px; font-size: 14px; color: ${emailColors.textLight}; line-height: 1.6;">
          ${copy.closing}
        </p>
        ${emailButton('Voir mes rappels', `${APP_URL}/dashboard/family/rappels`)}
        ${emailSignature()}
      `)}
    `,
    { preheader: copy.preheader }
  );
}

export async function GET(request: Request) {
  // Auth : Vercel Cron envoie "Authorization: Bearer <CRON_SECRET>"
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Supabase service credentials missing' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const { data: reminders, error } = await supabase
    .from('family_admin_reminders')
    .select(`
      id,
      user_id,
      child_id,
      type,
      expires_at,
      label,
      notes,
      last_notified_seuil,
      last_notified_at,
      dismissed_at,
      created_at,
      updated_at,
      child:child_profiles!child_id(first_name)
    `)
    .is('dismissed_at', null)
    .gte('expires_at', todayIso)
    .limit(500);

  if (error) {
    console.error('[cron reminders-mdph] DB error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (reminders ?? []) as unknown as ReminderJoined[];

  let processed = 0;
  let emailsSent = 0;
  let emailsFailed = 0;
  let pushesSent = 0;
  let pushesSkipped = 0;
  let pushesExpired = 0;

  // Cache user → email pour éviter de rappeler getUserById à chaque rappel.
  const userEmailCache = new Map<string, string | null>();

  // Cache user → subscriptions pour le push
  const userSubsCache = new Map<string, PushSubscriptionShape[]>();

  for (const r of list) {
    processed++;
    const threshold = nextThresholdToNotify(r, today);
    if (threshold === null) continue;

    // Récupérer l'email de l'utilisateur
    let email: string | null;
    if (userEmailCache.has(r.user_id)) {
      email = userEmailCache.get(r.user_id) ?? null;
    } else {
      const { data: u } = await supabase.auth.admin.getUserById(r.user_id);
      email = u?.user?.email ?? null;
      userEmailCache.set(r.user_id, email);
    }
    if (!email) {
      // Pas d'email : on saute, pas d'update last_notified_seuil pour
      // permettre une retentative si l'utilisateur ajoute une adresse.
      continue;
    }

    const childData = Array.isArray(r.child) ? r.child[0] : r.child;
    const childFirstName = childData?.first_name ?? null;

    const copy = buildReminderCopy(
      { type: r.type, expires_at: r.expires_at, label: r.label },
      threshold,
      childFirstName
    );

    // Email
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: copy.subject,
        html: buildReminderEmailHtml({
          copy,
          threshold,
          expiresAt: r.expires_at,
          typeLabel: REMINDER_TYPE_LABELS[r.type],
          childFirstName,
        }),
      });
      emailsSent++;
    } catch (e) {
      console.error('[cron reminders-mdph] email error', { reminderId: r.id, error: e });
      emailsFailed++;
      // Si l'email plante on n'avance pas le seuil, retentative demain.
      continue;
    }

    // Web Push (best effort, n'empêche pas l'avancement du seuil)
    let subs = userSubsCache.get(r.user_id);
    if (!subs) {
      const { data: subRows } = await supabase
        .from('family_push_subscriptions')
        .select('id, user_id, endpoint, keys')
        .eq('user_id', r.user_id);
      subs = (subRows ?? []) as PushSubscriptionShape[];
      userSubsCache.set(r.user_id, subs);
    }

    for (const sub of subs) {
      const result = await sendWebPush(sub, {
        title: copy.pushTitle,
        body: copy.pushBody,
        url: '/dashboard/family/rappels',
        tag: `reminder-${r.id}`,
      });
      if (result.sent) {
        pushesSent++;
      } else if (result.expired) {
        pushesExpired++;
        await supabase.from('family_push_subscriptions').delete().eq('id', sub.id);
      } else {
        pushesSkipped++;
      }
    }

    // Avancer le seuil notifié
    await supabase
      .from('family_admin_reminders')
      .update({
        last_notified_seuil: threshold,
        last_notified_at: new Date().toISOString(),
      })
      .eq('id', r.id);
  }

  return NextResponse.json({
    processed,
    emailsSent,
    emailsFailed,
    pushesSent,
    pushesSkipped,
    pushesExpired,
  });
}
