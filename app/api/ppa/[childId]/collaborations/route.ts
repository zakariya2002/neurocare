import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/ppa/[childId]/collaborations
// Liste les collaborations actives + pending sur cet enfant.
// Auth : famille parente OU inviteur OU invité.
export async function GET(
  _request: NextRequest,
  { params }: { params: { childId: string } }
) {
  const { user, error: authError } = await assertAuth();
  if (authError) return authError;

  const supabase = getSupabase();
  const { childId } = params;

  // Vérifier que l'utilisateur a un lien légitime avec cet enfant
  let allowed = false;

  const { data: family } = await supabase
    .from('family_profiles')
    .select('id')
    .eq('user_id', user!.id)
    .maybeSingle();
  if (family) {
    const { data: child } = await supabase
      .from('child_profiles')
      .select('id')
      .eq('id', childId)
      .eq('family_id', family.id)
      .maybeSingle();
    if (child) allowed = true;
  }

  let myEducatorId: string | null = null;
  if (!allowed) {
    const { data: edu } = await supabase
      .from('educator_profiles')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle();
    if (edu) {
      myEducatorId = edu.id;
      const { data: child } = await supabase
        .from('child_profiles')
        .select('family_id')
        .eq('id', childId)
        .maybeSingle();
      if (child) {
        const { data: appt } = await supabase
          .from('appointments')
          .select('id')
          .eq('educator_id', edu.id)
          .eq('family_id', child.family_id)
          .in('status', ['accepted', 'confirmed', 'in_progress', 'completed'])
          .limit(1)
          .maybeSingle();
        if (appt) allowed = true;
      }
      // Ou si déjà accepté en collaboration
      if (!allowed) {
        const { data: existing } = await supabase
          .from('ppa_collaborations')
          .select('id')
          .eq('child_id', childId)
          .eq('invited_educator_id', edu.id)
          .eq('status', 'accepted')
          .maybeSingle();
        if (existing) allowed = true;
      }
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { data: collabs, error } = await supabase
    .from('ppa_collaborations')
    .select(`
      id, child_id, invited_by, invited_educator_id, permission, status, message,
      invited_at, responded_at, revoked_at, revoked_by,
      inviter:educator_profiles!ppa_collaborations_invited_by_fkey(id, first_name, last_name),
      invitee:educator_profiles!ppa_collaborations_invited_educator_id_fkey(id, first_name, last_name)
    `)
    .eq('child_id', childId)
    .order('invited_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ collaborations: collabs || [], my_educator_id: myEducatorId });
}
