import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { assertAdmin } from '@/lib/assert-admin';
import { logAdminAction } from '@/lib/admin-audit';
import {
  buildAnnounceVisibilityProsEmail,
  ANNOUNCE_VISIBILITY_SUBJECT,
} from '@/lib/email-templates/announce-visibility-pros';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'NeuroCare Pro <admin@neuro-care.fr>';

/**
 * GET /api/admin/announce-visibility-pros
 * Dry-run : retourne la liste des destinataires sans envoyer.
 */
export async function GET() {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  const recipients = await getUnverifiedProRecipients();
  return NextResponse.json({
    total: recipients.length,
    recipients: recipients.map((r) => ({ email: r.email, prenom: r.prenom })),
  });
}

/**
 * POST /api/admin/announce-visibility-pros
 * Envoie l'email d'annonce de visibilité à TOUS les pros non vérifiés actifs.
 * Retourne un compte-rendu (succès / échecs / total).
 */
export async function POST(_request: NextRequest) {
  const { user, error: authError } = await assertAdmin();
  if (authError) return authError;

  const recipients = await getUnverifiedProRecipients();

  if (recipients.length === 0) {
    return NextResponse.json({
      success: true,
      sent: 0,
      failed: 0,
      total: 0,
      message: 'Aucun professionnel non vérifié à notifier.',
    });
  }

  let sent = 0;
  let failed = 0;
  const failures: { email: string; error: string }[] = [];

  // Envoi séquentiel avec throttle léger pour respecter le quota Resend (~10 req/s).
  for (const r of recipients) {
    try {
      const { subject, html, text } = buildAnnounceVisibilityProsEmail(r.prenom || 'Bonjour');
      const { error } = await resend.emails.send({
        from: FROM,
        to: [r.email],
        subject,
        html,
        text,
      });
      if (error) {
        failed++;
        failures.push({ email: r.email, error: error.message || 'unknown' });
      } else {
        sent++;
      }
    } catch (err: any) {
      failed++;
      failures.push({ email: r.email, error: err?.message || 'exception' });
    }
    await new Promise((r) => setTimeout(r, 110));
  }

  await logAdminAction({
    adminUserId: user!.id,
    adminEmail: user!.email,
    action: 'announce_visibility_pros',
    targetType: 'campaign',
    targetId: 'visibility-announce',
    details: { sent, failed, total: recipients.length },
  });

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: recipients.length,
    subject: ANNOUNCE_VISIBILITY_SUBJECT,
    failures: failures.slice(0, 20),
  });
}

async function getUnverifiedProRecipients() {
  const nowIso = new Date().toISOString();

  // 1. Pros non vérifiés et non suspendus.
  const { data: profiles, error } = await supabase
    .from('educator_profiles')
    .select('id, user_id, first_name, verification_badge, suspended_until')
    .eq('verification_badge', false);

  if (error) {
    console.error('[announce-visibility-pros] educator query error:', error);
    return [];
  }

  const candidates = (profiles || []).filter((p) => {
    if (!p.user_id) return false;
    if (p.suspended_until) {
      const until = new Date(p.suspended_until).getTime();
      if (Number.isFinite(until) && until > Date.parse(nowIso)) return false;
    }
    return true;
  });

  // 2. Récupérer les emails via auth.admin (en parallèle, par lots).
  const recipients: { email: string; prenom: string }[] = [];
  const BATCH = 20;
  for (let i = 0; i < candidates.length; i += BATCH) {
    const slice = candidates.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map(async (p) => {
        try {
          const { data } = await supabase.auth.admin.getUserById(p.user_id);
          const email = data?.user?.email;
          if (!email) return null;
          return { email, prenom: p.first_name || '' };
        } catch {
          return null;
        }
      }),
    );
    for (const r of results) if (r) recipients.push(r);
  }

  return recipients;
}
