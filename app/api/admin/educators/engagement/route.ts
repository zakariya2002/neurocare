import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/admin/educators/engagement
 * Liste tous les pros avec leur volume de sollicitations :
 *   - nb_conversations  : nombre de conversations reçues (messages d'une famille)
 *   - nb_appointments   : nombre de RDV reçus (toutes statuts)
 *   - last_activity     : dernière interaction connue (conv ou RDV)
 */
export async function GET() {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  // 1) Profils pros
  const { data: pros, error: prosErr } = await supabase
    .from('educator_profiles')
    .select('id, first_name, last_name, location, profession_type, verification_badge, suspended_until, profile_visible, created_at')
    .order('created_at', { ascending: false });

  if (prosErr) {
    console.error('[engagement] pros error:', prosErr);
    return NextResponse.json({ error: prosErr.message }, { status: 500 });
  }
  if (!pros || pros.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const ids = pros.map((p) => p.id);

  // 2) Conversations groupées par educator_id
  const { data: convs, error: convErr } = await supabase
    .from('conversations')
    .select('id, educator_id, created_at, updated_at')
    .in('educator_id', ids);
  if (convErr) console.error('[engagement] conv error:', convErr);

  const convByPro = new Map<string, { count: number; last: number }>();
  for (const c of convs || []) {
    const cur = convByPro.get(c.educator_id) || { count: 0, last: 0 };
    cur.count++;
    const ts = new Date(c.updated_at || c.created_at).getTime();
    if (ts > cur.last) cur.last = ts;
    convByPro.set(c.educator_id, cur);
  }

  // 3) Appointments groupés par educator_id
  const { data: appts, error: aptErr } = await supabase
    .from('appointments')
    .select('id, educator_id, created_at, status')
    .in('educator_id', ids);
  if (aptErr) console.error('[engagement] appt error:', aptErr);

  const aptByPro = new Map<string, { count: number; last: number }>();
  for (const a of appts || []) {
    const cur = aptByPro.get(a.educator_id) || { count: 0, last: 0 };
    cur.count++;
    const ts = new Date(a.created_at).getTime();
    if (ts > cur.last) cur.last = ts;
    aptByPro.set(a.educator_id, cur);
  }

  // 4) Assemblage
  const items = pros.map((p) => {
    const conv = convByPro.get(p.id) || { count: 0, last: 0 };
    const apt = aptByPro.get(p.id) || { count: 0, last: 0 };
    const lastTs = Math.max(conv.last, apt.last);
    return {
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      location: p.location,
      profession_type: p.profession_type,
      verification_badge: p.verification_badge,
      profile_visible: p.profile_visible,
      suspended: !!p.suspended_until && new Date(p.suspended_until).getTime() > Date.now(),
      created_at: p.created_at,
      nb_conversations: conv.count,
      nb_appointments: apt.count,
      total_solicitations: conv.count + apt.count,
      last_activity: lastTs > 0 ? new Date(lastTs).toISOString() : null,
    };
  });

  return NextResponse.json({ items });
}
