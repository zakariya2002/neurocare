import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { updateAnnouncementSchema, CONTENT_FIELDS } from '@/lib/announcements/schemas';
import { geocodeLabel } from '@/lib/announcements/queries';

export const dynamic = 'force-dynamic';

const NON_DELETABLE_STATUSES = new Set(['published', 'filled']);

type Announcement = Record<string, any>;

async function loadOwnedAnnouncement(
  supabase: SupabaseClient,
  userId: string,
  announcementId: string
): Promise<{ announcement: Announcement } | { error: NextResponse }> {
  const { data: family } = await supabase
    .from('family_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!family) return { error: NextResponse.json({ error: 'Profil famille introuvable' }, { status: 403 }) };

  const { data: announcement, error } = await supabase
    .from('family_announcements')
    .select('*')
    .eq('id', announcementId)
    .eq('family_id', (family as any).id)
    .maybeSingle();

  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!announcement) return { error: NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 }) };

  return { announcement: announcement as Announcement };
}

// GET — détail de mon annonce + réponses
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const loaded = await loadOwnedAnnouncement(supabase, session.user.id, params.id);
  if ('error' in loaded) return loaded.error;

  const { data: responses, error: respErr } = await supabase
    .from('announcement_responses')
    .select(`
      *,
      educator:educator_profiles (
        id, first_name, last_name, avatar_url, profile_image_url,
        location, profession_type, years_of_experience, hourly_rate,
        rating, total_reviews, verification_badge, gender, languages
      )
    `)
    .eq('announcement_id', params.id)
    .order('created_at', { ascending: false });

  if (respErr) {
    return NextResponse.json({ error: respErr.message }, { status: 500 });
  }

  return NextResponse.json({
    announcement: loaded.announcement,
    responses: responses ?? [],
  });
}

// PATCH — édition (force re-modération si contenu modifié)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const loaded = await loadOwnedAnnouncement(supabase, session.user.id, params.id);
  if ('error' in loaded) return loaded.error;
  const current = loaded.announcement;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = updateAnnouncementSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation échouée', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const update: Record<string, any> = { ...input };

  // Géocodage si location_label changé sans coords
  if (
    input.location_label &&
    input.location_label !== current.location_label &&
    input.latitude == null &&
    input.longitude == null
  ) {
    const geo = await geocodeLabel(input.location_label);
    if (geo) {
      update.latitude = geo.latitude;
      update.longitude = geo.longitude;
      if (!input.city && geo.city) update.city = geo.city;
      if (!input.postcode && geo.postcode) update.postcode = geo.postcode;
    }
  }

  // Détection modification de contenu
  const contentChanged = CONTENT_FIELDS.some((field) => {
    if (!(field in input)) return false;
    const newVal = (input as any)[field];
    const oldVal = (current as any)[field];
    return JSON.stringify(newVal) !== JSON.stringify(oldVal);
  });

  // Règle : si contenu change ET annonce pas en draft → repasse en pending
  if (contentChanged && current.status !== 'draft') {
    update.status = 'pending';
    update.rejected_reason = null;
  }

  // Si statut demandé explicitement = 'archived' (désactivation) → on respecte
  if (input.status === 'archived') {
    update.status = 'archived';
  }
  // Si statut demandé = 'draft' depuis pending/rejected, on autorise
  if (input.status === 'draft' && ['pending', 'rejected', 'archived'].includes(current.status)) {
    update.status = 'draft';
  }

  const { data, error } = await supabase
    .from('family_announcements')
    .update(update)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — suppression (refuse si published/filled)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const loaded = await loadOwnedAnnouncement(supabase, session.user.id, params.id);
  if ('error' in loaded) return loaded.error;

  if (NON_DELETABLE_STATUSES.has(loaded.announcement.status)) {
    return NextResponse.json(
      {
        error: "Désactiver l'annonce avant suppression",
        hint: "PATCH avec status='archived' puis supprimer.",
      },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from('family_announcements')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
