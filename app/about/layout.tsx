import type { Metadata } from 'next'

const TITLE = 'À propos de NeuroCare — Plateforme d\'accompagnement TND'
const DESCRIPTION =
  "NeuroCare connecte les familles concernées par l\'autisme (TSA), le TDAH et les troubles DYS avec des éducateurs, psychologues et thérapeutes certifiés partout en France. Découvrez notre mission, nos valeurs et comment nous vérifions chaque professionnel."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'à propos neurocare',
    'mission neurocare',
    'valeurs neurocare',
    'plateforme autisme France',
    'vérification professionnel TND',
    'équipe neurocare',
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://neuro-care.fr/about',
    type: 'website',
    siteName: 'NeuroCare',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  alternates: {
    canonical: 'https://neuro-care.fr/about',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  url: 'https://neuro-care.fr/about',
  name: TITLE,
  description: DESCRIPTION,
  publisher: {
    '@type': ['Organization', 'MedicalBusiness'],
    name: 'NeuroCare',
    url: 'https://neuro-care.fr',
    logo: 'https://neuro-care.fr/icon-512.png',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
