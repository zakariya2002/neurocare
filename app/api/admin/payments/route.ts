import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // jours
    const status = searchParams.get('status') || 'all';

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // 1. Rendez-vous avec paiements
    let appointmentsQuery = supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        price,
        status,
        payment_status,
        payment_intent_id,
        platform_commission,
        educator_revenue,
        created_at,
        educator_id,
        family_id
      `)
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (status !== 'all') {
      appointmentsQuery = appointmentsQuery.eq('payment_status', status);
    }

    const { data: appointments, error: appointmentsError } = await appointmentsQuery;

    if (appointmentsError) {
      return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
    }

    // 2. Récupérer les profils éducateurs et familles pour les noms
    const educatorIds = [...new Set(appointments?.map(a => a.educator_id) || [])];
    const familyIds = [...new Set(appointments?.map(a => a.family_id) || [])];

    const [educatorsResult, familiesResult] = await Promise.all([
      educatorIds.length > 0
        ? supabase.from('educator_profiles').select('id, first_name, last_name').in('id', educatorIds)
        : { data: [] },
      familyIds.length > 0
        ? supabase.from('family_profiles').select('id, first_name, last_name').in('id', familyIds)
        : { data: [] },
    ]);

    const educators = Object.fromEntries(
      (educatorsResult.data || []).map(e => [e.id, `${e.first_name} ${e.last_name}`])
    );
    const families = Object.fromEntries(
      (familiesResult.data || []).map(f => [f.id, `${f.first_name} ${f.last_name}`])
    );

    // 3. Calcul des statistiques
    const completedAppointments = appointments?.filter(a =>
      a.payment_status === 'captured' || a.payment_status === 'authorized' || a.status === 'completed'
    ) || [];

    const totalRevenue = completedAppointments.reduce((sum, a) => sum + (a.price || 0), 0);
    const totalCommission = completedAppointments.reduce((sum, a) => sum + (a.platform_commission || 0), 0);
    const totalEducatorRevenue = completedAppointments.reduce((sum, a) => sum + (a.educator_revenue || 0), 0);

    const failedPayments = appointments?.filter(a => a.payment_status === 'failed').length || 0;
    const refundedPayments = appointments?.filter(a => a.payment_status === 'refunded').length || 0;
    const pendingPayments = appointments?.filter(a => a.payment_status === 'authorized').length || 0;

    // 4. Transactions d'abonnements
    const { data: subscriptionTransactions } = await supabase
      .from('payment_transactions')
      .select('id, amount, status, description, created_at, educator_id')
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    const subscriptionRevenue = (subscriptionTransactions || [])
      .filter(t => t.status === 'succeeded')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // 5. Enrichir les rendez-vous avec les noms
    const enrichedAppointments = (appointments || []).map(a => ({
      ...a,
      educator_name: educators[a.educator_id] || 'Inconnu',
      family_name: families[a.family_id] || 'Inconnu',
    }));

    return NextResponse.json({
      stats: {
        totalRevenue,
        totalCommission,
        totalEducatorRevenue,
        subscriptionRevenue,
        totalAppointments: appointments?.length || 0,
        completedAppointments: completedAppointments.length,
        failedPayments,
        refundedPayments,
        pendingPayments,
      },
      appointments: enrichedAppointments,
      subscriptionTransactions: subscriptionTransactions || [],
    });

  } catch (error: any) {
    console.error('Admin payments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
