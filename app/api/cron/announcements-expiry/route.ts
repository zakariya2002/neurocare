import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAnnouncementExpirySoon } from '@/lib/emails/announcements';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ExpiringRow {
  id: string;
  family_id: string;
  title: string;
  status: string;
  rejection_reason: string | null;
  expires_at: string | null;
  family: {
    first_name: string | null;
    user_id: string;
    user: { email: string | null } | null;
  } | null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let expiredCount = 0;
  let expiryWarningsSent = 0;
  const errors: string[] = [];

  // 1. Expirations : annonces publiées dont expires_at est passé
  try {
    const { data: expired, error: expiredError } = await supabase
      .from('family_announcements')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'published')
      .lte('expires_at', new Date().toISOString())
      .select('id');

    if (expiredError) {
      console.error('[cron annonces] erreur expiration:', expiredError);
      errors.push(`expired: ${expiredError.message}`);
    } else {
      expiredCount = expired?.length ?? 0;
    }
  } catch (err) {
    console.error('[cron annonces] exception expiration:', err);
    errors.push(`expired: ${(err as Error).message}`);
  }

  // 2. Rappels J-7 : fenêtre 6.5–7.5 jours pour éviter doublons
  try {
    const now = Date.now();
    const lowerBound = new Date(now + 6.5 * 24 * 60 * 60 * 1000).toISOString();
    const upperBound = new Date(now + 7.5 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiringSoon, error: warnError } = await supabase
      .from('family_announcements')
      .select(
        `
        id,
        family_id,
        title,
        status,
        rejection_reason,
        expires_at,
        family:family_profiles!inner(
          first_name,
          user_id
        )
      `
      )
      .eq('status', 'published')
      .gte('expires_at', lowerBound)
      .lte('expires_at', upperBound)
      .limit(200);

    if (warnError) {
      console.error('[cron annonces] erreur sélection J-7:', warnError);
      errors.push(`warn: ${warnError.message}`);
    } else {
      const rows = (expiringSoon ?? []) as unknown as Array<{
        id: string;
        family_id: string;
        title: string;
        status: string;
        rejection_reason: string | null;
        expires_at: string | null;
        family: { first_name: string | null; user_id: string } | null;
      }>;

      for (const row of rows) {
        if (!row.family) continue;

        // Email via auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          row.family.user_id
        );
        if (userError || !userData?.user?.email) {
          console.error('[cron annonces] email famille introuvable pour', row.family.user_id, userError);
          continue;
        }

        // Comptage des réponses
        const { count: responseCount } = await supabase
          .from('announcement_responses')
          .select('id', { count: 'exact', head: true })
          .eq('announcement_id', row.id);

        try {
          await sendAnnouncementExpirySoon({
            to: userData.user.email,
            firstName: row.family.first_name || '',
            announcement: { id: row.id, title: row.title },
            responseCount: responseCount ?? 0,
          });
          expiryWarningsSent++;
        } catch (err) {
          console.error('[cron annonces] échec envoi J-7 pour', row.id, err);
        }
      }
    }
  } catch (err) {
    console.error('[cron annonces] exception rappels J-7:', err);
    errors.push(`warn: ${(err as Error).message}`);
  }

  console.log(
    `[cron annonces-expiry] expired=${expiredCount} warnings_sent=${expiryWarningsSent} errors=${errors.length}`
  );

  return NextResponse.json({
    expired_count: expiredCount,
    expiry_warnings_sent: expiryWarningsSent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
