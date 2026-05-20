import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { anonymizeAnnouncement } from '@/lib/announcements/queries';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabase();

  const { data: announcement, error } = await supabase
    .from('family_announcements')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!announcement) {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });
  }

  // Visible publiquement seulement si publiée + non expirée
  const expired =
    announcement.expires_at && new Date(announcement.expires_at) <= new Date();
  if (announcement.status !== 'published' || expired) {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });
  }

  // Incrément view_count (atomique côté SQL)
  await supabase
    .from('family_announcements')
    .update({ view_count: (announcement.view_count ?? 0) + 1 })
    .eq('id', params.id);

  // Récupérer info famille minimale
  const { data: family } = await supabase
    .from('family_profiles')
    .select('first_name, last_name')
    .eq('id', announcement.family_id)
    .maybeSingle();

  // Anonymisation : on retire les champs sensibles
  const { family_id, child_id, ...safe } = announcement;
  const anonymized = anonymizeAnnouncement(safe, family);

  return NextResponse.json(anonymized);
}
