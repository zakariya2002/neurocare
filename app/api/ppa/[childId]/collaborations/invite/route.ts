import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';
import { sendCollaborationInviteEmail } from '@/lib/email-collaboration';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/ppa/[childId]/collaborations/invite
// Body: { educator_email: string, permission?: 'read'|'write', message?: string }
export async function POST(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  const { user, error: authError } = await assertAuth();
  if (authError) return authError;

  const { childId } = params;
  const body = await request.json();
  const { educator_email, permission = 'read', message } = body as {
    educator_email?: string;
    permission?: 'read' | 'write';
    message?: string;
  };

  if (!educator_email) {
    return NextResponse.json({ error: 'educator_email requis' }, { status: 400 });
  }
  if (permission !== 'read' && permission !== 'write') {
    return NextResponse.json({ error: 'permission invalide' }, { status: 400 });
  }

  const supabase = getSupabase();

  // 1. Inviter doit être un éducateur ayant accès à cet enfant (via appointment)
  const { data: inviterProfile } = await supabase
    .from('educator_profiles')
    .select('id, first_name, last_name')
    .eq('user_id', user!.id)
    .maybeSingle();

  if (!inviterProfile) {
    return NextResponse.json({ error: 'Profil éducateur introuvable' }, { status: 403 });
  }

  const { data: child } = await supabase
    .from('child_profiles')
    .select('id, first_name, family_id')
    .eq('id', childId)
    .maybeSingle();

  if (!child) {
    return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 });
  }

  // Vérifier que l'inviter a bien un appointment avec cet enfant
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id')
    .eq('educator_id', inviterProfile.id)
    .eq('family_id', child.family_id)
    .in('status', ['accepted', 'confirmed', 'in_progress', 'completed'])
    .limit(1)
    .maybeSingle();

  if (!appointment) {
    return NextResponse.json(
      { error: 'Vous devez avoir un rendez-vous avec cet enfant pour inviter un confrère' },
      { status: 403 }
    );
  }

  // 2. Trouver l'éducateur invité par email (via auth.users)
  const normalizedEmail = educator_email.trim().toLowerCase();
  const { data: usersList, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    return NextResponse.json({ error: 'Recherche utilisateur échouée' }, { status: 500 });
  }
  const matchedUser = usersList.users.find(
    (u) => (u.email || '').toLowerCase() === normalizedEmail
  );
  if (!matchedUser) {
    return NextResponse.json(
      { error: 'Aucun professionnel NeuroCare avec cet email' },
      { status: 404 }
    );
  }

  const { data: invitedProfile } = await supabase
    .from('educator_profiles')
    .select('id, first_name, last_name')
    .eq('user_id', matchedUser.id)
    .maybeSingle();

  if (!invitedProfile) {
    return NextResponse.json(
      { error: 'Cet utilisateur n\'est pas un professionnel NeuroCare' },
      { status: 404 }
    );
  }

  if (invitedProfile.id === inviterProfile.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous inviter vous-même' }, { status: 400 });
  }

  // 3. Vérifier qu'il n'existe pas déjà une invitation active
  const { data: existing } = await supabase
    .from('ppa_collaborations')
    .select('id, status')
    .eq('child_id', childId)
    .eq('invited_educator_id', invitedProfile.id)
    .in('status', ['pending', 'accepted'])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `Une collaboration ${existing.status === 'pending' ? 'est en attente' : 'est déjà active'} avec ce professionnel` },
      { status: 409 }
    );
  }

  // 4. Créer l'invitation
  const { data: invitation, error: insertErr } = await supabase
    .from('ppa_collaborations')
    .insert({
      child_id: childId,
      invited_by: inviterProfile.id,
      invited_educator_id: invitedProfile.id,
      permission,
      message: message?.trim() || null,
      status: 'pending',
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // 5. Email à l'invité
  try {
    await sendCollaborationInviteEmail({
      to: matchedUser.email!,
      inviteeFirstName: invitedProfile.first_name || '',
      inviterFullName: `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim(),
      childFirstName: child.first_name,
      permission,
      message: message?.trim(),
    });
  } catch (e) {
    console.error('[ppa-invite] email error', e);
  }

  return NextResponse.json({ success: true, invitation });
}
