import { Resend } from 'resend';
import type { FamilyAnnouncement, AnnouncementResponse } from '@/types';
import { buildAnnouncementPublishedEmail } from '@/lib/email-templates/announcement-published';
import { buildAnnouncementRejectedEmail } from '@/lib/email-templates/announcement-rejected';
import { buildAnnouncementNewResponseEmail } from '@/lib/email-templates/announcement-new-response';
import { buildAnnouncementExpirySoonEmail } from '@/lib/email-templates/announcement-expiry-soon';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'NeuroCare <admin@neuro-care.fr>';

type AnnouncementBase = Pick<FamilyAnnouncement, 'id' | 'title'>;
type AnnouncementWithReason = AnnouncementBase & Pick<FamilyAnnouncement, 'rejection_reason'>;
type ResponseForEmail = Pick<AnnouncementResponse, 'message' | 'proposed_hourly_rate'>;

export interface PublishedEmailOpts {
  to: string;
  firstName: string;
  announcement: AnnouncementBase;
}

export interface RejectedEmailOpts {
  to: string;
  firstName: string;
  announcement: AnnouncementWithReason;
}

export interface NewResponseEmailOpts {
  to: string;
  firstName: string;
  announcement: AnnouncementBase;
  response: ResponseForEmail;
  educator: { first_name: string; last_name: string };
}

export interface ExpirySoonEmailOpts {
  to: string;
  firstName: string;
  announcement: AnnouncementBase;
  responseCount?: number;
}

function truncate(input: string, max = 200): string {
  const firstLine = (input || '').split(/\r?\n/)[0]?.trim() ?? '';
  if (firstLine.length <= max) return firstLine;
  return firstLine.slice(0, max).trimEnd() + '…';
}

function lastInitial(lastName: string): string {
  const trimmed = (lastName || '').trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '';
}

export async function sendAnnouncementPublished(opts: PublishedEmailOpts): Promise<void> {
  try {
    const { subject, html, text } = buildAnnouncementPublishedEmail({
      announcementId: opts.announcement.id,
      title: opts.announcement.title,
      familyFirstName: opts.firstName,
    });
    const { error } = await resend.emails.send({
      from: FROM,
      to: [opts.to],
      subject,
      html,
      text,
    });
    if (error) console.error('[email annonce publiée] Resend error:', error);
  } catch (err) {
    console.error('[email annonce publiée] exception:', err);
  }
}

export async function sendAnnouncementRejected(opts: RejectedEmailOpts): Promise<void> {
  try {
    const { subject, html, text } = buildAnnouncementRejectedEmail({
      announcementId: opts.announcement.id,
      title: opts.announcement.title,
      rejectionReason: opts.announcement.rejection_reason || 'Aucune raison précisée.',
      familyFirstName: opts.firstName,
    });
    const { error } = await resend.emails.send({
      from: FROM,
      to: [opts.to],
      subject,
      html,
      text,
    });
    if (error) console.error('[email annonce refusée] Resend error:', error);
  } catch (err) {
    console.error('[email annonce refusée] exception:', err);
  }
}

export async function sendAnnouncementNewResponse(opts: NewResponseEmailOpts): Promise<void> {
  try {
    const { subject, html, text } = buildAnnouncementNewResponseEmail({
      announcementId: opts.announcement.id,
      title: opts.announcement.title,
      educatorFirstName: opts.educator.first_name,
      educatorLastInitial: lastInitial(opts.educator.last_name),
      messageExcerpt: truncate(opts.response.message, 200),
      proposedHourlyRate: opts.response.proposed_hourly_rate ?? null,
      familyFirstName: opts.firstName,
    });
    const { error } = await resend.emails.send({
      from: FROM,
      to: [opts.to],
      subject,
      html,
      text,
    });
    if (error) console.error('[email nouvelle réponse] Resend error:', error);
  } catch (err) {
    console.error('[email nouvelle réponse] exception:', err);
  }
}

export async function sendAnnouncementExpirySoon(opts: ExpirySoonEmailOpts): Promise<void> {
  try {
    const { subject, html, text } = buildAnnouncementExpirySoonEmail({
      announcementId: opts.announcement.id,
      title: opts.announcement.title,
      responseCount: opts.responseCount ?? 0,
      familyFirstName: opts.firstName,
    });
    const { error } = await resend.emails.send({
      from: FROM,
      to: [opts.to],
      subject,
      html,
      text,
    });
    if (error) console.error('[email expiration J-7] Resend error:', error);
  } catch (err) {
    console.error('[email expiration J-7] exception:', err);
  }
}
