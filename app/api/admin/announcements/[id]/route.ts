import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { data: announcement, error } = await supabase
      .from('family_announcements')
      .select(
        `
        *,
        family:family_profiles!family_announcements_family_id_fkey (
          id, user_id, first_name, last_name, phone, location
        )
      `
      )
      .eq('id', params.id)
      .single();

    if (error || !announcement) {
      return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 });
    }

    const family = Array.isArray(announcement.family)
      ? announcement.family[0]
      : announcement.family;

    let familyEmail: string | null = null;
    if (family?.user_id) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(family.user_id);
        familyEmail = userData?.user?.email || null;
      } catch {
        familyEmail = null;
      }
    }

    let moderatorEmail: string | null = null;
    if (announcement.moderated_by) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(
          announcement.moderated_by
        );
        moderatorEmail = userData?.user?.email || null;
      } catch {
        moderatorEmail = null;
      }
    }

    return NextResponse.json({
      announcement,
      family: family
        ? {
            id: family.id,
            first_name: family.first_name,
            last_name: family.last_name,
            phone: family.phone || null,
            location: family.location || null,
            email: familyEmail,
          }
        : null,
      moderator: moderatorEmail ? { email: moderatorEmail } : null,
    });
  } catch (err: any) {
    console.error('Erreur API admin announcement detail:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
