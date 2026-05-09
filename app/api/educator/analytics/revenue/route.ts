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
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const startISO = start.toISOString().slice(0, 10);

    const { data: rows } = await supabase
      .from('appointments')
      .select('appointment_date, educator_revenue, price, location_type, status')
      .eq('educator_id', educator.id)
      .gte('appointment_date', startISO);

    const buckets: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets[key] = 0;
    }

    for (const r of rows || []) {
      if (r.status !== 'completed') continue;
      const d = new Date(r.appointment_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in buckets) {
        buckets[key] += (r.educator_revenue ?? r.price ?? 0) / 100;
      }
    }

    for (const r of rows || []) {
      const t = r.location_type || 'other';
      locationCounts[t] = (locationCounts[t] || 0) + 1;
    }

    const monthly = Object.entries(buckets).map(([month, amount]) => ({
      month,
      amount: Math.round(amount),
    }));

    return NextResponse.json({
      monthly,
      byLocation: locationCounts,
    });
  } catch (e: any) {
    console.error('analytics revenue error:', e);
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 });
  }
}
