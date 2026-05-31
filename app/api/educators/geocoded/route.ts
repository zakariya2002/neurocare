import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Quota de NOUVEAUX géocodages par appel pour ne pas saturer api-adresse.
// Les villes déjà en cache DB ne comptent pas — elles sont servies instantanément.
const MAX_NEW_GEOCODES_PER_CALL = 50;
const GEOCODE_THROTTLE_MS = 60;

type GeocodeResult = { latitude: number; longitude: number } | null;

async function geocodeFR(query: string): Promise<GeocodeResult> {
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'NeuroCare/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0];
    const coords = feature?.geometry?.coordinates;
    if (!Array.isArray(coords)) return null;
    const [lon, lat] = coords as [number, number];
    if (typeof lat !== 'number' || typeof lon !== 'number') return null;
    return { latitude: lat, longitude: lon };
  } catch {
    return null;
  }
}

export async function GET() {
  // 1. Lecture des pros visibles depuis la vue publique.
  const { data: rows, error } = await supabase
    .from('public_educator_profiles')
    .select(
      'id, first_name, last_name, location, profession_type, hourly_rate, avatar_url, rating, total_reviews, verification_badge, suspended_until, profile_visible',
    )
    .not('location', 'is', null);

  if (error) {
    console.error('[/api/educators/geocoded] supabase error:', error);
    return NextResponse.json({ items: [], total: 0, error: error.message }, { status: 200 });
  }

  const now = Date.now();
  type Row = {
    id: string;
    first_name: string;
    last_name: string;
    location: string | null;
    profession_type: string | null;
    hourly_rate: number | null;
    avatar_url: string | null;
    rating: number | null;
    total_reviews: number | null;
    verification_badge: boolean | null;
    suspended_until: string | null;
    profile_visible?: boolean | null;
  };

  const visible = (rows || []).filter((r: Row) => {
    if (!r.location) return false;
    if (r.profile_visible === false) return false;
    if (r.suspended_until) {
      const until = new Date(r.suspended_until).getTime();
      if (!Number.isFinite(until)) return false;
      if (until > now) return false;
    }
    return true;
  });

  // 2. Lecture batch du cache DB pour toutes les villes concernées (1 seule requête).
  const uniqueLocations = Array.from(new Set(visible.map((r) => r.location!)));
  const dbCache = new Map<string, GeocodeResult>();

  if (uniqueLocations.length > 0) {
    const { data: cached, error: cacheErr } = await supabase
      .from('geocode_cache')
      .select('query, latitude, longitude, not_found')
      .in('query', uniqueLocations);

    if (cacheErr) {
      console.error('[/api/educators/geocoded] cache read error:', cacheErr);
    } else {
      for (const c of cached || []) {
        dbCache.set(
          c.query,
          c.not_found || c.latitude == null || c.longitude == null
            ? null
            : { latitude: c.latitude, longitude: c.longitude },
        );
      }
    }
  }

  // 3. Construction des items + géocodage des manquants (jusqu'à MAX_NEW_GEOCODES_PER_CALL).
  const items: any[] = [];
  let geocodedThisCall = 0;
  const toUpsert: Array<{
    query: string;
    latitude: number | null;
    longitude: number | null;
    not_found: boolean;
    updated_at: string;
  }> = [];

  for (const row of visible) {
    const loc = row.location!;
    let coords = dbCache.get(loc);

    // Cas : ville absente du cache → géocodage à la volée (rate-limited).
    if (coords === undefined) {
      if (geocodedThisCall >= MAX_NEW_GEOCODES_PER_CALL) continue;
      coords = await geocodeFR(loc);
      geocodedThisCall++;
      // On mémorise localement pour les autres pros qui partagent cette ville
      // dans la même boucle.
      dbCache.set(loc, coords);
      toUpsert.push({
        query: loc,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        not_found: !coords,
        updated_at: new Date().toISOString(),
      });
      await new Promise((r) => setTimeout(r, GEOCODE_THROTTLE_MS));
    }

    if (!coords) continue; // null = not_found, on n'affiche pas le marker
    items.push({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      location: row.location,
      latitude: coords.latitude,
      longitude: coords.longitude,
      profession_type: row.profession_type,
      hourly_rate: row.hourly_rate,
      avatar_url: row.avatar_url,
      rating: row.rating,
      total_reviews: row.total_reviews,
    });
  }

  // 4. Persistance des nouveaux géocodages en best-effort (n'attend pas l'écriture).
  if (toUpsert.length > 0) {
    const { error: upsertErr } = await supabase
      .from('geocode_cache')
      .upsert(toUpsert, { onConflict: 'query' });
    if (upsertErr) {
      console.error('[/api/educators/geocoded] cache upsert error:', upsertErr);
    }
  }

  return NextResponse.json({
    items,
    total: items.length,
    visibleTotal: visible.length,
    geocodedThisCall,
    remainingToBackfill: Math.max(0, visible.length - items.length - geocodedThisCall),
  });
}
