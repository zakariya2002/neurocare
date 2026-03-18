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
    const filter = searchParams.get('filter') || 'pending';

    const avatarsList: any[] = [];

    // Educator avatars
    let educatorQuery = supabase
      .from('educator_profiles')
      .select('id, user_id, first_name, last_name, avatar_url, avatar_moderation_status, avatar_moderation_reason, created_at')
      .not('avatar_url', 'is', null);

    if (filter !== 'all') {
      educatorQuery = educatorQuery.eq('avatar_moderation_status', filter);
    }

    const { data: educators } = await educatorQuery;
    if (educators) {
      avatarsList.push(...educators.map(edu => ({ ...edu, profile_type: 'educator' })));
    }

    // Family avatars
    let familyQuery = supabase
      .from('family_profiles')
      .select('id, user_id, first_name, last_name, avatar_url, avatar_moderation_status, avatar_moderation_reason, created_at')
      .not('avatar_url', 'is', null);

    if (filter !== 'all') {
      familyQuery = familyQuery.eq('avatar_moderation_status', filter);
    }

    const { data: families } = await familyQuery;
    if (families) {
      avatarsList.push(...families.map(fam => ({ ...fam, profile_type: 'family' })));
    }

    // Sort by date
    avatarsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ avatars: avatarsList });
  } catch (error: any) {
    console.error('Erreur API avatars:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
