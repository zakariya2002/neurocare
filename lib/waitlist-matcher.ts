/**
 * Waitlist matcher : déclenche les notifications email aux familles en liste d'attente
 * dont les critères correspondent à un nouveau créneau qui se libère.
 *
 * Appelé depuis :
 * - app/api/appointments/[id]/cancel/route.ts (à l'annulation d'un RDV)
 * - components/scheduling/useSchedulingData.ts (à la création d'un slot — via /api/waitlist/match)
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface SlotInfo {
  educator_id: string;
  date: string;       // YYYY-MM-DD
  start_time: string; // HH:MM(:SS)
  end_time: string;   // HH:MM(:SS)
}

interface TimeRange { start: string; end: string }

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function normTime(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Notifie les familles en liste d'attente quand un créneau correspond à leurs critères.
 * @returns nombre de notifications envoyées
 */
export async function matchWaitlistOnSlotAvailable(slotInfo: SlotInfo): Promise<number> {
  try {
    const slotDate = new Date(slotInfo.date + 'T00:00:00');
    if (isNaN(slotDate.getTime())) return 0;

    const dayOfWeek = DAY_NAMES[slotDate.getDay()];
    const slotStart = normTime(slotInfo.start_time);
    const slotEnd = normTime(slotInfo.end_time);

    // Récupère les entries actives sur cet éducateur
    const { data: entries, error } = await supabase
      .from('waitlist_entries')
      .select('id, family_id, preferred_days, preferred_time_range, notified_count')
      .eq('educator_id', slotInfo.educator_id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error || !entries || entries.length === 0) return 0;

    // Filtre par critères
    const matched = entries.filter(entry => {
      const days: string[] = entry.preferred_days || [];
      if (days.length > 0 && !days.includes(dayOfWeek)) return false;

      const range = entry.preferred_time_range as TimeRange | null;
      if (range && range.start && range.end) {
        if (!rangesOverlap({ start: slotStart, end: slotEnd }, { start: range.start, end: range.end })) {
          return false;
        }
      }
      return true;
    });

    if (matched.length === 0) return 0;

    // Récupère les infos éducateur
    const { data: educator } = await supabase
      .from('educator_profiles')
      .select('id, first_name, last_name, profession, city')
      .eq('id', slotInfo.educator_id)
      .single();

    if (!educator) return 0;

    const educatorName = `${educator.first_name || ''} ${educator.last_name || ''}`.trim() || 'le professionnel';
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(slotDate);

    const ctaUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neuro-care.fr'}/educator/${educator.id}`;

    let sentCount = 0;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'NeuroCare <admin@neuro-care.fr>';

    for (const entry of matched) {
      try {
        const { data: userInfo } = await supabase.auth.admin.getUserById(entry.family_id);
        const email = userInfo?.user?.email;
        if (!email) continue;

        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `📅 Un créneau s'est libéré chez ${educatorName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
              <h2 style="color: #027e7e;">📅 Un créneau correspondant à vos critères s'est libéré</h2>

              <p>Bonjour,</p>

              <p>Un nouveau créneau correspondant à votre demande en liste d'attente vient de s'ouvrir :</p>

              <div style="background: #f0fafa; border-left: 4px solid #027e7e; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Professionnel :</strong> ${escapeHtml(educatorName)}${educator.profession ? ` (${escapeHtml(educator.profession)})` : ''}</p>
                <p style="margin: 0 0 8px 0;"><strong>📅 Date :</strong> ${escapeHtml(formattedDate)}</p>
                <p style="margin: 0 0 8px 0;"><strong>🕐 Horaire :</strong> ${escapeHtml(slotStart)} – ${escapeHtml(slotEnd)}</p>
                ${educator.city ? `<p style="margin: 0;"><strong>📍 Ville :</strong> ${escapeHtml(educator.city)}</p>` : ''}
              </div>

              <p style="margin: 24px 0;">
                <a href="${ctaUrl}" style="display: inline-block; background: #027e7e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Voir le profil et réserver
                </a>
              </p>

              <p style="color: #6b7280; font-size: 14px;">
                ⚠️ Les créneaux peuvent partir vite. Réservez rapidement si celui-ci vous convient.
              </p>

              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

              <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                Vous recevez cet email car vous êtes en liste d'attente sur le profil de ${escapeHtml(educatorName)}.<br/>
                Vous pouvez quitter la liste d'attente à tout moment depuis votre espace famille.
              </p>
            </div>
          `,
        });

        // Update notified_count
        await supabase
          .from('waitlist_entries')
          .update({
            notified_count: (entry.notified_count || 0) + 1,
            last_notified_at: new Date().toISOString(),
          })
          .eq('id', entry.id);

        sentCount++;
      } catch (emailErr) {
        console.error(`Waitlist notification failed for entry ${entry.id}:`, emailErr);
      }
    }

    return sentCount;
  } catch (err) {
    console.error('matchWaitlistOnSlotAvailable error:', err);
    return 0;
  }
}
