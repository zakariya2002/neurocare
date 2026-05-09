import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const { data: educator } = await supabase
      .from('educator_profiles')
      .select('id')
      .eq('user_id', user!.id)
      .single();
    if (!educator) {
      return NextResponse.json({ error: 'Profil éducateur introuvable' }, { status: 404 });
    }

    const now = new Date();
    const start = new Date(now.getTime() - 29 * 86400_000);
    const startISO = start.toISOString();

    const { data: rows } = await supabase
      .from('profile_views')
      .select('created_at')
      .eq('educator_id', educator.id)
      .gte('created_at', startISO);

    const buckets: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400_000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }

    for (const r of rows || []) {
      const key = (r.created_at as string).slice(0, 10);
      if (key in buckets) buckets[key] += 1;
    }

    const daily = Object.entries(buckets).map(([date, count]) => ({ date, count }));
    return NextResponse.json({ daily });
  } catch (e: any) {
    console.error('analytics profile-views error:', e);
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 });
  }
}
