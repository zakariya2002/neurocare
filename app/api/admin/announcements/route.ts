import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';
import type { AnnouncementStatus } from '@/types';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_STATUSES: AnnouncementStatus[] = [
  'pending',
  'published',
  'rejected',
  'expired',
  'filled',
];

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const statusParam = (searchParams.get('status') || 'pending') as AnnouncementStatus;
  const status = ALLOWED_STATUSES.includes(statusParam) ? statusParam : 'pending';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    // Compteur global "en attente" pour le header
    const { count: pendingCount } = await supabase
      .from('family_announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: announcements, count, error } = await supabase
      .from('family_announcements')
      .select(
        `
        id, title, description, city, status, created_at,
        family:family_profiles!family_announcements_family_id_fkey (
          id, user_id, first_name, last_name
        )
      `,
        { count: 'exact' }
      )
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const enriched = await Promise.all(
      (announcements || []).map(async (a) => {
        const family = Array.isArray(a.family) ? a.family[0] : a.family;
        let email: string | null = null;
        if (family?.user_id) {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(family.user_id);
            email = userData?.user?.email || null;
          } catch {
            email = null;
          }
        }
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          city: a.city,
          status: a.status,
          created_at: a.created_at,
          family: {
            first_name: family?.first_name || '',
            last_name: family?.last_name || '',
            email,
          },
        };
      })
    );

    return NextResponse.json({
      announcements: enriched,
      page,
      pageSize: PAGE_SIZE,
      total: count ?? 0,
      pendingCount: pendingCount ?? 0,
    });
  } catch (err: any) {
    console.error('Erreur API admin announcements list:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
