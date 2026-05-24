import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://neuro-care.fr'

// Server-side Supabase client (public data, no cookies needed)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface EducatorBasicInfo {
  id: string
  first_name: string
  last_name: string
  bio: string | null
  location: string | null
  specializations: string[] | null
  profession_type: string | null
  hourly_rate: number | null
  avatar_url: string | null
}

async function fetchEducator(id: string): Promise<EducatorBasicInfo | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('public_educator_profiles')
    .select('id, first_name, last_name, bio, location, specializations, profession_type, hourly_rate, avatar_url')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as EducatorBasicInfo
}

// ─── Metadata generation ─────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const educator = await fetchEducator(params.id)

  // Fallback metadata when educator is not found
  if (!educator) {
    return {
      title: 'Profil professionnel — NeuroCare',
      description:
        'Consultez le profil de ce professionnel spécialisé en autisme sur NeuroCare.',
      alternates: {
        canonical: `${BASE_URL}/educator/${params.id}`,
      },
    }
  }

  const fullName = `${educator.first_name} ${educator.last_name.toUpperCase()}`
  const city = educator.location || ''
  const title = `${fullName} — Éducateur autisme${city ? ` ${city}` : ''} | NeuroCare`

  // Description: first 160 chars of bio + booking CTA
  const bioSnippet = educator.bio
    ? educator.bio.slice(0, 160).replace(/\s+\S*$/, '') // trim to last full word
    : `Professionnel spécialisé en autisme et troubles du neurodéveloppement`
  const description = `${bioSnippet}, Réservez en ligne sur NeuroCare`

  // Keywords from profession_type, specializations, location
  const keywords: string[] = []
  if (educator.profession_type) keywords.push(educator.profession_type)
  if (educator.specializations) keywords.push(...educator.specializations)
  if (city) {
    keywords.push(city)
    keywords.push(`éducateur autisme ${city}`)
  }
  keywords.push('autisme', 'TND', 'NeuroCare')

  // OpenGraph image: educator avatar or default
  const ogImage = educator.avatar_url || `${BASE_URL}/og-default.png`

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/educator/${educator.id}`,
      siteName: 'NeuroCare',
      type: 'profile',
      images: [
        {
          url: ogImage,
          width: 400,
          height: 400,
          alt: `Photo de ${fullName}`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${BASE_URL}/educator/${educator.id}`,
    },
  }
}

// ─── Layout with JSON-LD structured data ─────────────────────────
export default async function EducatorProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const educator = await fetchEducator(params.id)

  if (!educator) {
    return <>{children}</>
  }

  const fullName = `${educator.first_name} ${educator.last_name.toUpperCase()}`
  const profileUrl = `${BASE_URL}/educator/${educator.id}`

  // Person schema
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName,
    givenName: educator.first_name,
    familyName: educator.last_name,
    url: profileUrl,
    ...(educator.avatar_url && { image: educator.avatar_url }),
    ...(educator.bio && { description: educator.bio }),
    ...(educator.location && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: educator.location,
        addressCountry: 'FR',
      },
    }),
    jobTitle: educator.profession_type || 'Éducateur spécialisé',
  }

  // ProfessionalService schema
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `${fullName} — Accompagnement autisme`,
    url: profileUrl,
    provider: {
      '@type': 'Person',
      name: fullName,
    },
    ...(educator.bio && { description: educator.bio }),
    ...(educator.location && {
      areaServed: {
        '@type': 'City',
        name: educator.location,
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: educator.location,
        addressCountry: 'FR',
      },
    }),
    ...(educator.hourly_rate && {
      priceRange: `${educator.hourly_rate}€/h`,
    }),
    ...(educator.specializations &&
      educator.specializations.length > 0 && {
        knowsAbout: educator.specializations,
      }),
    ...(educator.avatar_url && { image: educator.avatar_url }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd),
        }}
      />
      {children}
    </>
  )
}
