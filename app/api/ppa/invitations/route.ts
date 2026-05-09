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

// GET /api/ppa/invitations
// Retourne les invitations + collaborations actives + envoyées de l'éducateur connecté.
export async function GET(_req: NextRequest) {
  const { user, error: authError } = await assertAuth();
  if (authError) return authError;

  const supabase = getSupabase();

  const { data: edu } = await supabase
    .from('educator_profiles')
    .select('id')
    .eq('user_id', user!.id)
    .maybeSingle();
  if (!edu) return NextResponse.json({ error: 'Profil éducateur introuvable' }, { status: 403 });

  const select = `
    id, child_id, invited_by, invited_educator_id, permission, status, message,
    invited_at, responded_at, revoked_at, revoked_by,
    inviter:educator_profiles!ppa_collaborations_invited_by_fkey(id, first_name, last_name),
    invitee:educator_profiles!ppa_collaborations_invited_educator_id_fkey(id, first_name, last_name),
    child:child_profiles!child_id(id, first_name)
  `;

  const [received, sent] = await Promise.all([
    supabase
      .from('ppa_collaborations')
      .select(select)
      .eq('invited_educator_id', edu.id)
      .order('invited_at', { ascending: false }),
    supabase
      .from('ppa_collaborations')
      .select(select)
      .eq('invited_by', edu.id)
      .order('invited_at', { ascending: false }),
  ]);

  if (received.error) return NextResponse.json({ error: received.error.message }, { status: 500 });
  if (sent.error) return NextResponse.json({ error: sent.error.message }, { status: 500 });

  return NextResponse.json({
    received: received.data || [],
    sent: sent.data || [],
  });
}
