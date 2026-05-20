import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';
import { logAdminAction } from '@/lib/admin-audit';
// dépend de Phase 6 — module fourni en parallèle
import {
  sendAnnouncementPublished,
  sendAnnouncementRejected,
} from '@/lib/emails/announcements';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REJECT_REASON_MIN = 20;

type ModerationAction = 'publish' | 'reject';

interface ModerationBody {
  action: ModerationAction;
  reason?: string;
}

function validateBody(raw: unknown): { ok: true; body: ModerationBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Corps de requête invalide' };
  }
  const obj = raw as Record<string, unknown>;
  const action = obj.action;
  if (action !== 'publish' && action !== 'reject') {
    return { ok: false, error: 'Action invalide (publish ou reject attendu)' };
  }
  if (action === 'reject') {
    const reason = typeof obj.reason === 'string' ? obj.reason.trim() : '';
    if (reason.length < REJECT_REASON_MIN) {
      return {
        ok: false,
        error: `La raison du refus doit comporter au moins ${REJECT_REASON_MIN} caractères`,
      };
    }
    return { ok: true, body: { action, reason } };
  }
  return { ok: true, body: { action } };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error: authError } = await assertAdmin();
  if (authError) return authError;

  const announcementId = params.id;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const validation = validateBody(rawBody);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const body = validation.body;

  // Récupération de l'annonce + famille pour le mail
  const { data: existing, error: fetchError } = await supabase
    .from('family_announcements')
    .select(`
      id, status, title, family_id,
      family:family_profiles!family_announcements_family_id_fkey (
        id, user_id, first_name, last_name
      )
    `)
    .eq('id', announcementId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });
  }

  if (existing.status !== 'pending') {
    return NextResponse.json(
      { error: `Annonce déjà modérée (statut actuel : ${existing.status})` },
      { status: 409 }
    );
  }

  const nowIso = new Date().toISOString();
  const updatePayload: Record<string, unknown> =
    body.action === 'publish'
      ? {
          status: 'published',
          moderated_by: user!.id,
          moderated_at: nowIso,
          rejection_reason: null,
        }
      : {
          status: 'rejected',
          moderated_by: user!.id,
          moderated_at: nowIso,
          rejection_reason: body.reason!,
        };

  const { data: updated, error: updateError } = await supabase
    .from('family_announcements')
    .update(updatePayload)
    .eq('id', announcementId)
    .select('*')
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }

  // Audit log (fire-and-forget)
  logAdminAction({
    adminUserId: user!.id,
    adminEmail: user!.email,
    action: `announcement_${body.action}`,
    targetType: 'family_announcement',
    targetId: announcementId,
    details: body.action === 'reject' ? { reason: body.reason } : {},
  });

  // Récupération de l'email famille pour la notification
  const family = Array.isArray(existing.family) ? existing.family[0] : existing.family;
  let familyEmail: string | null = null;
  if (family?.user_id) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(family.user_id);
      familyEmail = userData?.user?.email || null;
    } catch {
      familyEmail = null;
    }
  }

  // Envoi de l'email de notification (Phase 6) — fire-and-forget
  if (familyEmail && family) {
    try {
      if (body.action === 'publish') {
        await sendAnnouncementPublished({
          to: familyEmail,
          firstName: family.first_name,
          announcement: { id: announcementId, title: updated.title },
        });
      } else {
        await sendAnnouncementRejected({
          to: familyEmail,
          firstName: family.first_name,
          announcement: {
            id: announcementId,
            title: updated.title,
            rejection_reason: body.reason!,
          },
        });
      }
    } catch (mailError) {
      // Ne pas faire échouer la modération si le mail rate
      console.error('Échec envoi email annonce:', mailError);
    }
  }

  return NextResponse.json({ announcement: updated });
}
