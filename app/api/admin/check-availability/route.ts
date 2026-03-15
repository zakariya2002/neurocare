import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const educator_id = searchParams.get('educator_id');

    if (!educator_id) {
      return NextResponse.json({ error: 'educator_id requis' }, { status: 400 });
    }

    // Récupérer les disponibilités hebdomadaires
    const { data: weeklySlots, error: weeklyError } = await supabase
      .from('weekly_availability')
      .select('*')
      .eq('educator_id', educator_id)
      .eq('is_active', true);

    if (weeklyError) {
      return NextResponse.json({ error: weeklyError.message }, { status: 500 });
    }

    // Récupérer les rendez-vous existants
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('educator_id', educator_id)
      .in('status', ['pending', 'confirmed']);

    if (appointmentsError) {
      return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
    }

    return NextResponse.json({
      educator_id,
      weeklySlots: weeklySlots || [],
      weeklySlots_count: weeklySlots?.length || 0,
      appointments: appointments || [],
      appointments_count: appointments?.length || 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
