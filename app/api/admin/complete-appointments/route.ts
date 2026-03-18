import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';
import { logAdminAction } from '@/lib/admin-audit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public'
    }
  }
);

export async function POST(request: NextRequest) {
  const { user, error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { appointmentIds } = await request.json();

    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return NextResponse.json({ error: 'appointmentIds requis' }, { status: 400 });
    }

    const results = [];

    for (const id of appointmentIds) {
      // D'abord récupérer le RDV
      const { data: apt } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (!apt) {
        results.push({ id, success: false, error: 'Non trouvé' });
        continue;
      }

      // Mettre à jour directement avec SQL brut via une fonction
      const { error } = await supabaseAdmin.rpc('complete_appointment_bypass', {
        apt_id: id
      });

      if (error) {
        // Si RPC échoue, essayer une autre approche
        results.push({ id, success: false, error: error.message });
      } else {
        results.push({ id, success: true });
      }
    }

    await logAdminAction({
      adminUserId: user!.id,
      adminEmail: user!.email,
      action: 'complete_appointments',
      targetType: 'appointment',
      targetId: appointmentIds.join(','),
      details: { results },
    });

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
