import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Éducateur autisme près de chez vous — Recherche gratuite',
  description: 'Trouvez un éducateur autisme, psychologue TDAH ou orthophoniste DYS certifié près de chez vous. Filtrez par ville, spécialité (ABA, TEACCH, PECS) et disponibilités. 100% gratuit.',
  keywords: [
    'éducateur autisme près de chez moi',
    'trouver éducateur autisme',
    'psychologue TDAH enfant',
    'orthophoniste DYS',
    'éducateur spécialisé autisme',
    'accompagnement TSA',
    'professionnel TND ville',
  ],
  openGraph: {
    title: 'Trouvez votre éducateur autisme certifié — NeuroCare',
    description: 'Éducateurs autisme, psychologues TDAH, orthophonistes DYS certifiés. Recherche par ville et spécialité. Réservation en ligne gratuite.',
    url: 'https://neuro-care.fr/recherche',
  },
  alternates: {
    canonical: 'https://neuro-care.fr/recherche',
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
