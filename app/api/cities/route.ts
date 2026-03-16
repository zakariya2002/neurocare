import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&type=municipality&limit=5`
    );
    const data = await res.json();

    const cities = data.features.map((f: any) => ({
      city: f.properties.city || f.properties.name,
      postcode: f.properties.postcode || '',
      context: f.properties.context || '',
    }));

    return NextResponse.json(cities);
  } catch {
    return NextResponse.json([]);
  }
}
