import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`
    );
    const data = await res.json();

    const addresses = data.features.map((f: any) => {
      const coords = Array.isArray(f.geometry?.coordinates) ? f.geometry.coordinates : [];
      return {
        label: f.properties.label,
        housenumber: f.properties.housenumber || '',
        street: f.properties.street || f.properties.name || '',
        postcode: f.properties.postcode || '',
        city: f.properties.city || '',
        context: f.properties.context || '',
        longitude: typeof coords[0] === 'number' ? coords[0] : null,
        latitude: typeof coords[1] === 'number' ? coords[1] : null,
      };
    });

    return NextResponse.json(addresses);
  } catch {
    return NextResponse.json([]);
  }
}
