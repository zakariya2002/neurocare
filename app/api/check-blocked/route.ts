import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Vérifier si une famille est bloquée par un éducateur
export async function GET(request: NextRequest) {
  try {
    // Seuls les utilisateurs authentifies peuvent verifier le statut de blocage
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const educatorId = searchParams.get('educatorId');
    const familyId = searchParams.get('familyId');

    if (!educatorId || !familyId) {
      return NextResponse.json({ error: 'educatorId et familyId requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('blocked_families')
      .select('id')
      .eq('educator_id', educatorId)
      .eq('family_id', familyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking blocked status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ isBlocked: !!data });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
