import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Cache mémoire des géocodages effectués pendant la durée de vie du process serveur.
// Évite de re-frapper api-adresse.data.gouv.fr à chaque requête pour les mêmes villes.
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
  // Lecture depuis la même source que le listing public — garantit la cohérence
  // (verification_badge, suspended_until, etc.) sans dépendre de colonnes incertaines.
  const { data: rows, error } = await supabase
    .from('public_educator_profiles')
    .select(
      'id, first_name, last_name, location, profession_type, hourly_rate, avatar_url, rating, total_reviews, verification_badge, suspended_until, profile_visible',
    )
    // Phase 1 (visibility-unverified-pros) : on n'exige plus verification_badge
    // sur la carte. Filtres suspension + masquage faits côté JS plus bas.
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
  };

  // Filtres défensifs : exclusion des suspendus + des pros masqués par admin.
  const visible = (rows || []).filter((r: Row & { profile_visible?: boolean | null }) => {
    if (!r.location) return false;
    if (r.profile_visible === false) return false;
    if (r.suspended_until) {
      const until = new Date(r.suspended_until).getTime();
      if (!Number.isFinite(until)) return false;
      if (until > now) return false;
    }
    return true;
  });

  // Géocode jusqu'à 50 pros par appel (cache mémoire entre les appels — donc à
  // la 2e requête ça va beaucoup plus vite). Throttle léger pour api-adresse.
  const items: any[] = [];
  let geocoded = 0;
  for (const row of visible) {
    if (geocoded >= 50) break;
    const cached = geocodeCache.get(row.location!);
    const coords = cached !== undefined ? cached : await geocodeFR(row.location!);
    if (cached === undefined) {
      geocoded++;
      await new Promise((r) => setTimeout(r, 60));
    }
    if (!coords) continue;
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

  return NextResponse.json({
    items,
    total: items.length,
    visibleTotal: visible.length,
    geocodedThisCall: geocoded,
    remainingToBackfill: Math.max(0, visible.length - items.length - geocoded),
  });
}
