import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyEducatorOwnership(userId: string, educatorId: string) {
  const { data } = await supabase
    .from('educator_profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('id', educatorId)
    .single();
  return !!data;
}

// GET - Récupérer les familles bloquées par un éducateur
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const educatorId = searchParams.get('educatorId');

    if (!educatorId) {
      return NextResponse.json({ error: 'educatorId requis' }, { status: 400 });
    }

    // Vérifier que l'utilisateur est bien cet éducateur
    if (!(await verifyEducatorOwnership(user!.id, educatorId))) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('blocked_families')
      .select(`
        id,
        family_id,
        reason,
        blocked_at,
        family:family_profiles(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('educator_id', educatorId)
      .order('blocked_at', { ascending: false });

    if (error) {
      console.error('Error fetching blocked families:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ blockedFamilies: data });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Bloquer une famille
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const body = await request.json();
    const { educatorId, familyId, reason } = body;

    if (!educatorId || !familyId) {
      return NextResponse.json(
        { error: 'educatorId et familyId requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est bien cet éducateur
    if (!(await verifyEducatorOwnership(user!.id, educatorId))) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier si déjà bloqué
    const { data: existing } = await supabase
      .from('blocked_families')
      .select('id')
      .eq('educator_id', educatorId)
      .eq('family_id', familyId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Cette famille est déjà bloquée' },
        { status: 400 }
      );
    }

    // Bloquer la famille
    const { data, error } = await supabase
      .from('blocked_families')
      .insert({
        educator_id: educatorId,
        family_id: familyId,
        reason: reason || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error blocking family:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Annuler les rendez-vous en attente avec cette famille
    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('educator_id', educatorId)
      .eq('family_id', familyId)
      .in('status', ['pending', 'confirmed']);

    return NextResponse.json({ success: true, blocked: data });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Débloquer une famille
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const educatorId = searchParams.get('educatorId');
    const familyId = searchParams.get('familyId');

    if (!educatorId || !familyId) {
      return NextResponse.json(
        { error: 'educatorId et familyId requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est bien cet éducateur
    if (!(await verifyEducatorOwnership(user!.id, educatorId))) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { error } = await supabase
      .from('blocked_families')
      .delete()
      .eq('educator_id', educatorId)
      .eq('family_id', familyId);

    if (error) {
      console.error('Error unblocking family:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
