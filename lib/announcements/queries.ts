import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnnouncementFiltersInput } from './schemas';

// ----------------------------------------------------------------
// Géocodage via data.gouv.fr
// ----------------------------------------------------------------

export async function geocodeLabel(label: string): Promise<{
  latitude: number;
  longitude: number;
  city: string;
  postcode: string | null;
  label: string;
} | null> {
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(label)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feat = data.features?.[0];
    if (!feat) return null;
    const [lng, lat] = feat.geometry.coordinates;
    return {
      latitude: lat,
      longitude: lng,
      city: feat.properties.city || feat.properties.name || '',
      postcode: feat.properties.postcode || null,
      label: feat.properties.label || label,
    };
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------
// Haversine — distance en km entre 2 points (calcul JS)
// ----------------------------------------------------------------

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// ----------------------------------------------------------------
// Listing public — applique les filtres + tri + pagination
// ----------------------------------------------------------------

export async function fetchPublicAnnouncements(
  supabase: SupabaseClient,
  filters: AnnouncementFiltersInput
) {
  let query = supabase
    .from('family_announcements')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (filters.city) {
    query = query.ilike('city', filters.city);
  }

  if (filters.accompaniment_types?.length) {
    query = query.overlaps('accompaniment_types', filters.accompaniment_types);
  }
  if (filters.desired_professions?.length) {
    query = query.overlaps('desired_professions', filters.desired_professions);
  }
  if (filters.tnd_context?.length) {
    query = query.overlaps('tnd_context', filters.tnd_context);
  }
  if (filters.place_types?.length) {
    query = query.overlaps('place_types', filters.place_types);
  }

  if (filters.min_hours_per_week != null) {
    query = query.gte('min_hours_per_week', filters.min_hours_per_week);
  }
  if (filters.max_hours_per_week != null) {
    query = query.lte('max_hours_per_week', filters.max_hours_per_week);
  }
  if (filters.gender_preference) {
    query = query.eq('gender_preference', filters.gender_preference);
  }
  if (filters.start_date_from) {
    query = query.gte('start_date', filters.start_date_from);
  }

  const hasGeo =
    filters.lat != null && filters.lng != null && filters.radius_km != null;

  // Si géofiltre actif : on récupère une page plus large pour filtrer en JS
  // (acceptable au volume actuel, à remplacer par PostGIS si volumétrie explose)
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;

  if (hasGeo) {
    // Heuristique : bornes approximatives sur lat/lng pour pré-filtrer
    const km = filters.radius_km!;
    const latDelta = km / 111;
    const lngDelta = km / (111 * Math.cos((filters.lat! * Math.PI) / 180));
    query = query
      .gte('latitude', filters.lat! - latDelta)
      .lte('latitude', filters.lat! + latDelta)
      .gte('longitude', filters.lng! - lngDelta)
      .lte('longitude', filters.lng! + lngDelta)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
  }

  // Tri DB
  query = query.order('published_at', { ascending: false, nullsFirst: false });

  // Sans geo, on applique limit/offset directement en DB
  if (!hasGeo) {
    query = query.range(offset, offset + limit - 1);
  } else {
    // On laisse plus large pour le tri JS post-filtre
    query = query.range(0, Math.min(offset + limit + 200, 500));
  }

  const { data, error, count } = await query;
  if (error) throw error;
  if (!data) return { items: [], total: 0 };

  if (hasGeo) {
    const withDist = data
      .map((row: any) => ({
        ...row,
        distance_km: haversineKm(
          filters.lat!,
          filters.lng!,
          row.latitude,
          row.longitude
        ),
      }))
      .filter((r: any) => r.distance_km <= filters.radius_km!)
      .sort((a: any, b: any) => a.distance_km - b.distance_km);

    return {
      items: withDist.slice(offset, offset + limit),
      total: withDist.length,
    };
  }

  return { items: data, total: count ?? data.length };
}

// ----------------------------------------------------------------
// Anonymisation d'une annonce pour le détail public
// ----------------------------------------------------------------

export function anonymizeAnnouncement(
  announcement: any,
  family: { first_name?: string | null; last_name?: string | null } | null
) {
  const initialLast = family?.last_name?.trim()?.[0]?.toUpperCase() ?? '';
  return {
    ...announcement,
    family: family
      ? {
          first_name: family.first_name ?? '',
          last_name_initial: initialLast ? `${initialLast}.` : '',
        }
      : null,
    // On retire les coordonnées précises potentiellement présentes
  };
}
