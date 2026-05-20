import { Resend } from 'resend';
import { buildAnnouncementPublishedEmail } from '@/lib/email-templates/announcement-published';
import { buildAnnouncementRejectedEmail } from '@/lib/email-templates/announcement-rejected';
import { buildAnnouncementNewResponseEmail } from '@/lib/email-templates/announcement-new-response';
import { buildAnnouncementExpirySoonEmail } from '@/lib/email-templates/announcement-expiry-soon';

// NOTE: ces types proviendront de `@/types` une fois la Phase 1-2 mergée
// (migration `20260520_family_announcements.sql` + types index.ts).
// Pour l'instant on les redéclare localement pour passer la compilation isolée.
// TODO: remplacer par `import type { FamilyAnnouncement, AnnouncementResponse } from '@/types';`
export interface FamilyAnnouncement {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'pending_moderation' | 'published' | 'rejected' | 'expired' | 'fulfilled';
  rejection_reason?: string | null;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AnnouncementResponse {
  id: string;
  announcement_id: string;
  educator_id: string;
  message: string;
  proposed_hourly_rate?: number | null;
  created_at?: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'NeuroCare <admin@neuro-care.fr>';

function truncate(input: string, max = 200): string {
  const firstLine = (input || '').split(/\r?\n/)[0]?.trim() ?? '';
  if (firstLine.length <= max) return firstLine;
  return firstLine.slice(0, max).trimEnd() + '…';
}

function lastInitial(lastName: string): string {
  const trimmed = (lastName || '').trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '';
}

export async function sendAnnouncementPublished(
  announcement: FamilyAnnouncement,
  familyEmail: string,
  familyFirstName: string
): Promise<void> {
  try {
    const { subject, html, text } = buildAnnouncementPublishedEmail({
      announcementId: announcement.id,
      title: announcement.title,
      familyFirstName,
    });
    const { error } = await resend.emails.send({
      from: FROM,
      to: [familyEmail],
      subject,
      html,
      text,
    });
    if (error) {
      console.error('[email annonce publiée] Resend error:', error);
    }
  } catch (err) {
    console.error('[email annonce publiée] exception:', err);
  }
}

export async function sendAnnouncementRejected(
  announcement: FamilyAnnouncement,
  familyEmail: string,
  familyFirstName: string
): Promise<void> {
  try {
    const { subject, html, text } = buildAnnouncementRejectedEmail({
      announcementId: announcement.id,
      title: announcement.title,
      rejectionReason: announcement.rejection_reason || 'Aucune raison précisée.',
      familyFirstName,
    });
    const { error } = await resend.emails.send({
      from: FROM,
      to: [familyEmail],
      subject,
      html,
      text,
    });
    if (error) {
      console.error('[email annonce refusée] Resend error:', error);
    }
  } catch (err) {
    console.error('[email annonce refusée] exception:', err);
  }
}

export async function sendAnnouncementNewResponse(
  announcement: FamilyAnnouncement,
  response: AnnouncementResponse,
  educator: { first_name: string; last_name: string },
  familyEmail: string,
  familyFirstName: string
): Promise<void> {
  try {
    const { subject, html, text } = buildAnnouncementNewResponseEmail({
      announcementId: announcement.id,
      title: announcement.title,
      educatorFirstName: educator.first_name,
      educatorLastInitial: lastInitial(educator.last_name),
      messageExcerpt: truncate(response.message, 200),
      proposedHourlyRate: response.proposed_hourly_rate ?? null,
      familyFirstName,
    });
    const { error } = await resend.emails.send({
      from: FROM,
      to: [familyEmail],
      subject,
      html,
      text,
    });
    if (error) {
      console.error('[email nouvelle réponse] Resend error:', error);
    }
  } catch (err) {
    console.error('[email nouvelle réponse] exception:', err);
  }
}

export async function sendAnnouncementExpirySoon(
  announcement: FamilyAnnouncement,
  familyEmail: string,
  familyFirstName: string,
  responseCount = 0
): Promise<void> {
  try {
    const { subject, html, text } = buildAnnouncementExpirySoonEmail({
      announcementId: announcement.id,
      title: announcement.title,
      responseCount,
      familyFirstName,
    });
    const { error } = await resend.emails.send({
      from: FROM,
      to: [familyEmail],
      subject,
      html,
      text,
    });
    if (error) {
      console.error('[email expiration J-7] Resend error:', error);
    }
  } catch (err) {
    console.error('[email expiration J-7] exception:', err);
  }
}
