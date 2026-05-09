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

// POST /api/ppa/collaborations/[id]/leave
// L'invité quitte une collaboration acceptée.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error: authError } = await assertAuth();
  if (authError) return authError;

  const supabase = getSupabase();

  const { data: edu } = await supabase
    .from('educator_profiles')
    .select('id')
    .eq('user_id', user!.id)
    .maybeSingle();
  if (!edu) return NextResponse.json({ error: 'Profil éducateur introuvable' }, { status: 403 });

  const { data: collab } = await supabase
    .from('ppa_collaborations')
    .select('id, status, invited_educator_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!collab) return NextResponse.json({ error: 'Collaboration introuvable' }, { status: 404 });
  if (collab.invited_educator_id !== edu.id) {
    return NextResponse.json({ error: 'Cette collaboration ne vous concerne pas' }, { status: 403 });
  }
  if (collab.status !== 'accepted') {
    return NextResponse.json({ error: `Statut courant : ${collab.status}` }, { status: 400 });
  }

  const { error: upErr } = await supabase
    .from('ppa_collaborations')
    .update({ status: 'left', revoked_at: new Date().toISOString(), revoked_by: 'invitee' })
    .eq('id', params.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
