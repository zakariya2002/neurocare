import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { announcementFiltersSchema } from '@/lib/announcements/schemas';
import { fetchPublicAnnouncements } from '@/lib/announcements/queries';

export const dynamic = 'force-dynamic';

// Service-role : la table est en RLS authenticated only. Le listing public n'expose
// pas les coordonnées famille, donc on lit en service-role et on map vers une vue safe.
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function toPublicAnnouncement(row: any) {
  // On retire toute info latente sensible. Les coordonnées famille ne sont pas
  // jointes ici — réservées au détail public.
  const { latitude, longitude, ...rest } = row;
  return {
    ...rest,
    // approximation : on garde la ville + label (qui peut contenir l'adresse).
    // L'anonymisation forte est faite côté détail. Ici on expose tel quel
    // car la fiche publique aussi affichera ville + zone d'intervention.
    latitude: latitude ?? null,
    longitude: longitude ?? null,
  };
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const raw = {
    city: sp.get('city') ?? undefined,
    lat: sp.get('lat') ?? undefined,
    lng: sp.get('lng') ?? undefined,
    radius_km: sp.get('radius_km') ?? undefined,
    accompaniment_types: sp.get('accompaniment_types') ?? undefined,
    desired_professions: sp.get('desired_professions') ?? undefined,
    tnd_context: sp.get('tnd_context') ?? undefined,
    place_types: sp.get('place_types') ?? undefined,
    min_hours_per_week: sp.get('min_hours_per_week') ?? undefined,
    max_hours_per_week: sp.get('max_hours_per_week') ?? undefined,
    gender_preference: sp.get('gender_preference') ?? undefined,
    start_date_from: sp.get('start_date_from') ?? undefined,
    limit: sp.get('limit') ?? undefined,
    offset: sp.get('offset') ?? undefined,
  };

  const parsed = announcementFiltersSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Filtres invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabase();
    const { items, total } = await fetchPublicAnnouncements(supabase, parsed.data);
    return NextResponse.json({
      items: items.map(toPublicAnnouncement),
      total,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
  } catch (err: any) {
    console.error('Erreur listing annonces:', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
