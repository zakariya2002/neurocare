import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';
import { sendCollaborationFamilyNotice } from '@/lib/email-collaboration';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/ppa/collaborations/[id]/revoke
// Auth : inviteur ou parent (famille)
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await assertAuth();
  if (authError) return authError;

  const supabase = getSupabase();

  const { data: collab } = await supabase
    .from('ppa_collaborations')
    .select('id, status, invited_by, invited_educator_id, child_id, permission')
    .eq('id', params.id)
    .maybeSingle();

  if (!collab) return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 });
  if (!['pending', 'accepted'].includes(collab.status)) {
    return NextResponse.json({ error: `Déjà ${collab.status}` }, { status: 400 });
  }

  // Vérifier qui révoque
  let revokedBy: 'family' | 'inviter' | null = null;

  const { data: family } = await supabase
    .from('family_profiles')
    .select('id, first_name, user_id')
    .eq('user_id', user!.id)
    .maybeSingle();
  if (family) {
    const { data: child } = await supabase
      .from('child_profiles')
      .select('id, first_name, family_id')
      .eq('id', collab.child_id)
      .maybeSingle();
    if (child && child.family_id === family.id) revokedBy = 'family';
  }

  if (!revokedBy) {
    const { data: edu } = await supabase
      .from('educator_profiles')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle();
    if (edu && edu.id === collab.invited_by) revokedBy = 'inviter';
  }

  if (!revokedBy) {
    return NextResponse.json({ error: 'Vous ne pouvez pas révoquer cette collaboration' }, { status: 403 });
  }

  const { error: upErr } = await supabase
    .from('ppa_collaborations')
    .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: revokedBy })
    .eq('id', params.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Notifier la famille de la révocation (si non révoquée par elle)
  if (revokedBy !== 'family') {
    try {
      const { data: child } = await supabase
        .from('child_profiles')
        .select('first_name, family_id')
        .eq('id', collab.child_id)
        .maybeSingle();
      if (child) {
        const { data: fam } = await supabase
          .from('family_profiles')
          .select('user_id, first_name')
          .eq('id', child.family_id)
          .maybeSingle();
        if (fam) {
          const { data: famUser } = await supabase.auth.admin.getUserById(fam.user_id);
          const { data: invitee } = await supabase
            .from('educator_profiles')
            .select('first_name, last_name')
            .eq('id', collab.invited_educator_id)
            .maybeSingle();
          if (famUser?.user?.email && invitee) {
            await sendCollaborationFamilyNotice({
              to: famUser.user.email,
              familyFirstName: fam.first_name || '',
              childFirstName: child.first_name,
              educatorFullName: `${invitee.first_name || ''} ${invitee.last_name || ''}`.trim(),
              event: 'revoked',
              permission: collab.permission as 'read' | 'write',
            });
          }
        }
      }
    } catch (e) {
      console.error('[ppa-revoke] email error', e);
    }
  }

  return NextResponse.json({ success: true });
}
