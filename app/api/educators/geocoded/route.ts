import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface EducatorRow {
  id: string;
  first_name: string;
  last_name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  profession_type: string | null;
  hourly_rate: number | null;
  avatar_url: string | null;
  rating: number | null;
  total_reviews: number | null;
}

// Géocode via l'API gov française (api-adresse.data.gouv.fr) — meilleure pour les villes FR.
async function geocodeFR(query: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'NeuroCare/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature?.geometry?.coordinates) return null;
    const [lon, lat] = feature.geometry.coordinates as [number, number];
    if (typeof lat !== 'number' || typeof lon !== 'number') return null;
    return { latitude: lat, longitude: lon };
  } catch {
    return null;
  }
}

export async function GET() {
  // On expose uniquement les pros publiquement listables (vérifiés et actifs).
  // Si le statut "verified" n'est pas disponible, on retombe sur verification_badge.
  const { data: rows, error } = await supabase
    .from('educator_profiles')
    .select(
      'id, first_name, last_name, location, latitude, longitude, profession_type, hourly_rate, avatar_url, rating, total_reviews, verification_badge, verification_status, is_suspended',
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type FullRow = EducatorRow & {
    verification_badge: boolean | null;
    verification_status: string | null;
    is_suspended: boolean | null;
  };

  // Critère permissif : un pro est visible sur la carte s'il n'est pas suspendu.
  // (verified n'est pas obligatoire ici — la carte sert à découvrir les pros,
  // la vérification reste indiquée séparément par le badge dans la fiche.)
  const visible: FullRow[] = (rows || []).filter((r: FullRow) => !r.is_suspended);

  // Backfill : géocode les villes manquantes (en série pour respecter le rate limit).
  // Limité à 30 géocodages par appel — couvre la 1re visite sur un dataset modeste
  // sans trop allonger la réponse (~2,4s max).
  const toBackfill = visible
    .filter((r) => r.location && (r.latitude == null || r.longitude == null))
    .slice(0, 30);

  for (const row of toBackfill) {
    const coords = await geocodeFR(row.location!);
    if (coords) {
      // Met à jour la DB
      await supabase
        .from('educator_profiles')
        .update({ latitude: coords.latitude, longitude: coords.longitude })
        .eq('id', row.id);
      row.latitude = coords.latitude;
      row.longitude = coords.longitude;
    }
    // Met aussi à jour la ligne en mémoire pour qu'elle apparaisse sur la carte dès cet appel
    if (coords) {
      row.latitude = coords.latitude;
      row.longitude = coords.longitude;
    }
    // throttle léger pour respecter le rate limit api-adresse (~50 req/s officiellement)
    await new Promise((r) => setTimeout(r, 80));
  }

  // Retourne uniquement les pros géolocalisés
  const items = visible
    .filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number')
    .map((r) => ({
      id: r.id,
      first_name: r.first_name,
      last_name: r.last_name,
      location: r.location,
      latitude: r.latitude,
      longitude: r.longitude,
      profession_type: r.profession_type,
      hourly_rate: r.hourly_rate,
      avatar_url: r.avatar_url,
      rating: r.rating,
      total_reviews: r.total_reviews,
    }));

  return NextResponse.json({
    items,
    total: items.length,
    geocodedThisCall: toBackfill.length,
    remainingToBackfill: visible.filter(
      (r) => r.location && (r.latitude == null || r.longitude == null),
    ).length - toBackfill.length,
  });
}
