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
      .select('id, rating, total_reviews')
      .eq('user_id', user!.id)
      .single();

    if (!educator) {
      return NextResponse.json({ error: 'Profil éducateur introuvable' }, { status: 404 });
    }

    const educatorId = educator.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const last30Start = new Date(now.getTime() - 30 * 86400_000).toISOString();
    const prev30Start = new Date(now.getTime() - 60 * 86400_000).toISOString();

    // Revenus mois en cours
    const { data: monthApts } = await supabase
      .from('appointments')
      .select('educator_revenue, price')
      .eq('educator_id', educatorId)
      .eq('status', 'completed')
      .gte('appointment_date', monthStart.slice(0, 10));
    const revenueMonthCents = (monthApts || []).reduce(
      (sum, a: any) => sum + (a.educator_revenue ?? a.price ?? 0),
      0
    );

    // Revenus 30j vs 30j précédents
    const { data: last30Apts } = await supabase
      .from('appointments')
      .select('educator_revenue, price, appointment_date')
      .eq('educator_id', educatorId)
      .eq('status', 'completed')
      .gte('appointment_date', last30Start.slice(0, 10));
    const { data: prev30Apts } = await supabase
      .from('appointments')
      .select('educator_revenue, price')
      .eq('educator_id', educatorId)
      .eq('status', 'completed')
      .gte('appointment_date', prev30Start.slice(0, 10))
      .lt('appointment_date', last30Start.slice(0, 10));
    const sumCents = (rows: any[]) =>
      rows.reduce((s, a) => s + (a.educator_revenue ?? a.price ?? 0), 0);
    const last30Cents = sumCents(last30Apts || []);
    const prev30Cents = sumCents(prev30Apts || []);
    const revenueDeltaPct =
      prev30Cents > 0 ? ((last30Cents - prev30Cents) / prev30Cents) * 100 : last30Cents > 0 ? 100 : 0;

    // Vues profil 30j
    const { count: views30 } = await supabase
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('educator_id', educatorId)
      .gte('created_at', last30Start);

    // RDV créés 30j (peu importe le status — pour conversion)
    const { count: appts30 } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('educator_id', educatorId)
      .gte('appointment_date', last30Start.slice(0, 10));

    const conversionPct = views30 && views30 > 0 ? ((appts30 || 0) / views30) * 100 : 0;

    // Séances mois en cours
    const { count: sessionsMonth } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('educator_id', educatorId)
      .eq('status', 'completed')
      .gte('appointment_date', monthStart.slice(0, 10));

    return NextResponse.json({
      revenueMonth: revenueMonthCents / 100,
      revenue30: last30Cents / 100,
      revenuePrev30: prev30Cents / 100,
      revenueDeltaPct: Math.round(revenueDeltaPct * 10) / 10,
      profileViews30: views30 || 0,
      conversionPct: Math.round(conversionPct * 10) / 10,
      sessionsMonth: sessionsMonth || 0,
      avgRating: educator.rating || 0,
      totalReviews: educator.total_reviews || 0,
    });
  } catch (e: any) {
    console.error('analytics summary error:', e);
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 });
  }
}
