import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { id, profile_type, action, reason } = await request.json();

    if (!id || !profile_type || !action) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const table = profile_type === 'educator' ? 'educator_profiles' : 'family_profiles';

    if (action === 'approve') {
      const { error } = await supabase
        .from(table)
        .update({ avatar_moderation_status: 'approved', avatar_moderation_reason: null })
        .eq('id', id);
      if (error) throw error;
    } else if (action === 'reject') {
      const { error } = await supabase
        .from(table)
        .update({ avatar_moderation_status: 'rejected', avatar_moderation_reason: reason, avatar_url: null })
        .eq('id', id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
