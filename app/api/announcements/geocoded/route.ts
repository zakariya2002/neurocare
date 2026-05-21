import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Cache mémoire des géocodages (mêmes villes réutilisées).
const geocodeCache = new Map<string, { latitude: number; longitude: number } | null>();

async function geocodeFR(query: string): Promise<{ latitude: number; longitude: number } | null> {
  if (geocodeCache.has(query)) return geocodeCache.get(query)!;
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'NeuroCare/1.0' } });
    if (!res.ok) {
      geocodeCache.set(query, null);
      return null;
    }
    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature?.geometry?.coordinates) {
      geocodeCache.set(query, null);
      return null;
    }
    const [lon, lat] = feature.geometry.coordinates as [number, number];
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      geocodeCache.set(query, null);
      return null;
    }
    const result = { latitude: lat, longitude: lon };
    geocodeCache.set(query, result);
    return result;
  } catch {
    geocodeCache.set(query, null);
    return null;
  }
}

export async function GET() {
  // Annonces publiées et non expirées
  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from('family_announcements')
    .select(
      'id, title, city, location_label, latitude, longitude, accompaniment_types, tnd_context, place_types, hours_per_week, person_age, gender_preference, start_date, start_date_flexibility, published_at, created_at, expires_at, status',
    )
    .eq('status', 'published');

  if (error) {
    console.error('[/api/announcements/geocoded] supabase error:', error);
    return NextResponse.json({ items: [], total: 0, error: error.message }, { status: 200 });
  }

  type Row = {
    id: string;
    title: string;
    city: string | null;
    location_label: string | null;
    latitude: number | null;
    longitude: number | null;
    accompaniment_types: string[] | null;
    tnd_context: string[] | null;
    place_types: string[] | null;
    hours_per_week: number | null;
    person_age: number | null;
    gender_preference: string | null;
    start_date: string | null;
    start_date_flexibility: string | null;
    published_at: string | null;
    created_at: string | null;
    expires_at: string | null;
  };

  const visible = (rows || []).filter((r: Row) => !r.expires_at || r.expires_at > nowIso);

  const items: any[] = [];
  let geocoded = 0;
  for (const row of visible) {
    let lat = row.latitude;
    let lng = row.longitude;

    // Géocode à la volée si lat/lng manquants mais location/city disponibles
    if ((lat == null || lng == null) && (row.location_label || row.city)) {
      if (geocoded >= 50) continue;
      const q = row.location_label || row.city!;
      const cached = geocodeCache.get(q);
      const coords = cached !== undefined ? cached : await geocodeFR(q);
      if (cached === undefined) {
        geocoded++;
        await new Promise((r) => setTimeout(r, 60));
      }
      if (!coords) continue;
      lat = coords.latitude;
      lng = coords.longitude;
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') continue;

    items.push({
      id: row.id,
      title: row.title,
      city: row.city,
      latitude: lat,
      longitude: lng,
      accompaniment_types: row.accompaniment_types || [],
      tnd_context: row.tnd_context || [],
      place_types: row.place_types || [],
      hours_per_week: row.hours_per_week,
      person_age: row.person_age,
      gender_preference: row.gender_preference,
      start_date: row.start_date,
      start_date_flexibility: row.start_date_flexibility,
      published_at: row.published_at,
      created_at: row.created_at,
    });
  }

  return NextResponse.json({
    items,
    total: items.length,
    visibleTotal: visible.length,
    geocodedThisCall: geocoded,
  });
}
