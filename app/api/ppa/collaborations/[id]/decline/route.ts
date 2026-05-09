import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';
import { sendCollaborationResponseEmail } from '@/lib/email-collaboration';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/ppa/collaborations/[id]/decline
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await assertAuth();
  if (authError) return authError;

  const supabase = getSupabase();

  const { data: edu } = await supabase
    .from('educator_profiles')
    .select('id, first_name, last_name')
    .eq('user_id', user!.id)
    .maybeSingle();
  if (!edu) return NextResponse.json({ error: 'Profil éducateur introuvable' }, { status: 403 });

  const { data: collab } = await supabase
    .from('ppa_collaborations')
    .select('id, status, invited_by, invited_educator_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!collab) return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 });
  if (collab.invited_educator_id !== edu.id) {
    return NextResponse.json({ error: 'Cette invitation ne vous concerne pas' }, { status: 403 });
  }
  if (collab.status !== 'pending') {
    return NextResponse.json({ error: `Statut courant : ${collab.status}` }, { status: 400 });
  }

  const { error: upErr } = await supabase
    .from('ppa_collaborations')
    .update({ status: 'declined', responded_at: new Date().toISOString() })
    .eq('id', params.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Notifier inviteur
  try {
    const { data: inviter } = await supabase
      .from('educator_profiles')
      .select('user_id, first_name')
      .eq('id', collab.invited_by)
      .maybeSingle();
    if (inviter) {
      const { data: inviterUser } = await supabase.auth.admin.getUserById(inviter.user_id);
      if (inviterUser?.user?.email) {
        await sendCollaborationResponseEmail({
          to: inviterUser.user.email,
          recipientFirstName: inviter.first_name || '',
          inviteeFullName: `${edu.first_name || ''} ${edu.last_name || ''}`.trim(),
          accepted: false,
        });
      }
    }
  } catch (e) {
    console.error('[ppa-decline] email error', e);
  }

  return NextResponse.json({ success: true });
}
