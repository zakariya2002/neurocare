import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getRouteSupabase } from '@/lib/announcements/supabase-server';
import { buildNewMessageNotificationEmail } from '@/lib/email-templates/new-message-notification';

export const dynamic = 'force-dynamic';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'NeuroCare <admin@neuro-care.fr>';

/**
 * POST /api/notifications/new-message
 * Body: { conversationId, kind?: 'new_message' | 'new_request', preview? }
 *
 * Envoie une notif email au destinataire d'une conversation après l'envoi
 * d'un message ou la création d'une demande. Best-effort : ne bloque pas
 * le flux utilisateur si l'envoi échoue, ne renvoie pas l'erreur côté client.
 *
 * Sécurité : vérifie que l'appelant est bien participant à la conversation
 * (sender ou recipient) avant d'envoyer.
 */
export async function POST(request: NextRequest) {
  try {
    const { conversationId, kind = 'new_message', preview } = await request.json();
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId requis' }, { status: 400 });
    }

    // Auth utilisateur
    const supabase = await getRouteSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const callerUserId = session.user.id;

    // Conversation + profils des deux parties (service_role pour bypass RLS)
    const { data: conv, error: convErr } = await adminClient
      .from('conversations')
      .select(`
        id,
        status,
        educator_id,
        family_id,
        educator_profiles!educator_id ( id, user_id, first_name ),
        family_profiles!family_id ( id, user_id, first_name )
      `)
      .eq('id', conversationId)
      .maybeSingle();

    if (convErr) {
      console.error('[notif new-message] conv error:', convErr);
      return NextResponse.json({ ok: false }, { status: 200 });
    }
    if (!conv) {
      return NextResponse.json({ ok: false, reason: 'conversation introuvable' }, { status: 200 });
    }

    const edu = Array.isArray(conv.educator_profiles)
      ? conv.educator_profiles[0]
      : (conv.educator_profiles as any);
    const fam = Array.isArray(conv.family_profiles)
      ? conv.family_profiles[0]
      : (conv.family_profiles as any);

    if (!edu?.user_id || !fam?.user_id) {
      return NextResponse.json({ ok: false, reason: 'profil incomplet' }, { status: 200 });
    }

    // Identifier sender / recipient en fonction de l'appelant
    let recipientUserId: string;
    let recipientFirstName: string;
    let senderFirstName: string;
    let senderRole: 'family' | 'educator';

    if (callerUserId === fam.user_id) {
      recipientUserId = edu.user_id;
      recipientFirstName = edu.first_name || 'Bonjour';
      senderFirstName = fam.first_name || 'Une famille';
      senderRole = 'family';
    } else if (callerUserId === edu.user_id) {
      recipientUserId = fam.user_id;
      recipientFirstName = fam.first_name || 'Bonjour';
      senderFirstName = edu.first_name || 'Le professionnel';
      senderRole = 'educator';
    } else {
      return NextResponse.json({ ok: false, reason: 'non-participant' }, { status: 403 });
    }

    // Email du destinataire
    const { data: userData } = await adminClient.auth.admin.getUserById(recipientUserId);
    const recipientEmail = userData?.user?.email;
    if (!recipientEmail) {
      return NextResponse.json({ ok: false, reason: 'email destinataire indisponible' }, { status: 200 });
    }

    // Envoi
    const { subject, html, text } = buildNewMessageNotificationEmail({
      recipientFirstName,
      senderFirstName,
      senderRole,
      preview: typeof preview === 'string' ? preview : undefined,
      kind: kind === 'new_request' ? 'new_request' : 'new_message',
    });

    const { error: sendErr } = await resend.emails.send({
      from: FROM,
      to: [recipientEmail],
      subject,
      html,
      text,
    });

    if (sendErr) {
      console.error('[notif new-message] resend error:', sendErr);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notif new-message] exception:', err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
