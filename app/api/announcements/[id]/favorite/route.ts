import { NextRequest, NextResponse } from 'next/server';
import { getRouteSupabase } from '@/lib/announcements/supabase-server';

export const dynamic = 'force-dynamic';

async function getEducatorId(supabase: Awaited<ReturnType<typeof getRouteSupabase>>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { error: 'Non authentifié' as const, status: 401 as const };

  const { data: educator } = await supabase
    .from('educator_profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!educator) return { error: 'Profil pro introuvable' as const, status: 403 as const };

  return { educatorId: educator.id as string };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await getRouteSupabase();
  const auth = await getEducatorId(supabase);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Vérifie que l'annonce existe et est publiée
  const { data: announcement } = await supabase
    .from('family_announcements')
    .select('id, status')
    .eq('id', params.id)
    .maybeSingle();

  if (!announcement) {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });
  }

  const { error } = await supabase
    .from('educator_announcement_favorites')
    .insert({ educator_id: auth.educatorId, announcement_id: params.id });

  if (error) {
    // Doublon = considéré comme idempotent → succès
    if ((error as any).code === '23505') {
      return NextResponse.json({ favorited: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ favorited: true }, { status: 201 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await getRouteSupabase();
  const auth = await getEducatorId(supabase);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { error } = await supabase
    .from('educator_announcement_favorites')
    .delete()
    .eq('educator_id', auth.educatorId)
    .eq('announcement_id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ favorited: false });
}
