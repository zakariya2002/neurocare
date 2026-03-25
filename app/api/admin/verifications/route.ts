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
    const filter = searchParams.get('filter') || 'all';

    let query = supabase
      .from('educator_profiles')
      .select('id, first_name, last_name, verification_status, created_at, user_id, profession_type')
      .order('created_at', { ascending: false });

    if (filter === 'all') {
      // Montrer tous les éducateurs en attente d'action (y compris les nouveaux inscrits)
      query = query.or('verification_status.is.null,verification_status.in.(pending_documents,documents_submitted,documents_verified,interview_scheduled)');
    } else if (filter === 'pending_documents') {
      // Nouveaux inscrits sans documents
      query = query.or('verification_status.is.null,verification_status.eq.pending_documents');
    } else {
      query = query.eq('verification_status', filter);
    }

    const { data: profiles, error: profilesError } = await query;
    if (profilesError) throw profilesError;

    const educatorsWithDetails = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
        const { count } = await supabase
          .from('verification_documents')
          .select('*', { count: 'exact', head: true })
          .eq('educator_id', profile.id);

        return {
          ...profile,
          email: userData?.user?.email || 'N/A',
          documents_count: count || 0,
          profession_type: profile.profession_type || 'educator'
        };
      })
    );

    return NextResponse.json({ educators: educatorsWithDetails });
  } catch (error: any) {
    console.error('Erreur API verifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
