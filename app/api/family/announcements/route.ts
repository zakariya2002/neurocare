import { NextRequest, NextResponse } from 'next/server';
import { getRouteSupabase } from '@/lib/announcements/supabase-server';
import { createAnnouncementSchema } from '@/lib/announcements/schemas';
import { geocodeLabel } from '@/lib/announcements/queries';

export const dynamic = 'force-dynamic';

// POST — création (status par défaut = pending ; status=draft autorisé)
export async function POST(request: NextRequest) {
  const supabase = await getRouteSupabase();
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
  let latitude = input.latitude ?? null;
  let longitude = input.longitude ?? null;
  let city = input.city;
  let postal_code = input.postal_code ?? null;

  if ((latitude == null || longitude == null) && input.location_label) {
    const geo = await geocodeLabel(input.location_label);
    if (geo) {
      latitude = latitude ?? geo.latitude;
      longitude = longitude ?? geo.longitude;
      if (!city && geo.city) city = geo.city;
      if (!postal_code && geo.postal_code) postal_code = geo.postal_code;
    }
  }

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
    person_age: input.person_age ?? null,
    gender_preference: input.gender_preference ?? 'any',
    location_label: input.location_label,
    city,
    postal_code,
    latitude,
    longitude,
    radius_km: input.radius_km ?? 10,
    hours_per_week: input.hours_per_week ?? null,
    schedule_preferences: input.schedule_preferences ?? null,
    start_date: input.start_date ?? null,
    start_date_flexibility: input.start_date_flexibility ?? 'flexible',
    status,
  };

  const { data, error } = await supabase
    .from('family_announcements')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('[POST /api/family/announcements]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ announcement: data }, { status: 201 });
}

// GET — liste de mes annonces (tous statuts)
export async function GET() {
  const supabase = await getRouteSupabase();
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
    .select('*')
    .eq('family_id', family.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /api/family/announcements]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
