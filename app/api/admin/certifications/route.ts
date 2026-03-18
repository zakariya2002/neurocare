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
      .from('certifications')
      .select(`
        *,
        educator:educator_profiles!inner(
          id,
          first_name,
          last_name,
          user_id
        )
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('verification_status', filter);
    }

    const { data, error } = await query;
    if (error) throw error;

    const certsWithEmails = await Promise.all(
      (data || []).map(async (cert: any) => {
        const { data: userData } = await supabase.auth.admin.getUserById(cert.educator.user_id);
        return {
          ...cert,
          educator: {
            ...cert.educator,
            email: userData?.user?.email || 'N/A'
          }
        };
      })
    );

    // Duplicates
    let duplicates: any[] = [];
    try {
      const { data: dupes } = await supabase.from('diploma_duplicates_alert').select('*');
      duplicates = dupes || [];
    } catch { /* view may not exist */ }

    return NextResponse.json({ certifications: certsWithEmails, duplicates });
  } catch (error: any) {
    console.error('Erreur API certifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
