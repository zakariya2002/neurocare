import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createAnnouncementSchema } from '@/lib/announcements/schemas';
import { geocodeLabel } from '@/lib/announcements/queries';

export const dynamic = 'force-dynamic';

// POST /api/family/announcements — création d'une annonce
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: family, error: famErr } = await supabase
    .from('family_profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .single();

  if (famErr || !family) {
    return NextResponse.json({ error: 'Profil famille introuvable' }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = createAnnouncementSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation échouée', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // Géocodage si lat/lng absents
  let latitude = input.latitude;
  let longitude = input.longitude;
  let city = input.city;
  let postcode = input.postcode;

  if ((latitude == null || longitude == null) && input.location_label) {
    const geo = await geocodeLabel(input.location_label);
    if (geo) {
      latitude = latitude ?? geo.latitude;
      longitude = longitude ?? geo.longitude;
      if (!city && geo.city) city = geo.city;
      if (!postcode && geo.postcode) postcode = geo.postcode;
    }
  }

  // status forcé : la famille ne peut publier directement
  const status = input.status === 'draft' ? 'draft' : 'pending';

  const insertPayload = {
    family_id: family.id,
    child_id: input.child_id ?? null,
    title: input.title,
    description: input.description,
    accompaniment_types: input.accompaniment_types,
    desired_professions: input.desired_professions,
    tnd_context: input.tnd_context,
    place_types: input.place_types,
    location_label: input.location_label,
    city,
    postcode: postcode ?? null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    min_hours_per_week: input.min_hours_per_week ?? null,
    max_hours_per_week: input.max_hours_per_week ?? null,
    hourly_budget_min: input.hourly_budget_min ?? null,
    hourly_budget_max: input.hourly_budget_max ?? null,
    start_date: input.start_date ?? null,
    start_flexibility: input.start_flexibility ?? null,
    gender_preference: input.gender_preference ?? null,
    certifications_required: input.certifications_required ?? [],
    languages_required: input.languages_required ?? [],
    expires_at: input.expires_at ?? null,
    status,
  };

  const { data, error } = await supabase
    .from('family_announcements')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('Erreur création annonce:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// GET /api/family/announcements — liste de mes annonces (tous statuts)
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: family } = await supabase
    .from('family_profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .single();

  if (!family) {
    return NextResponse.json({ error: 'Profil famille introuvable' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('family_announcements')
    .select('*, responses:announcement_responses(count)')
    .eq('family_id', family.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
