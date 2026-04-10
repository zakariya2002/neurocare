import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quel sport pour un enfant autiste ou TDAH ? 7 activités adaptées | NeuroCare',
  description: 'Natation, escalade, arts martiaux… Découvrez les 7 sports les plus adaptés aux enfants TSA et TDAH. Bienfaits prouvés + conseils pour choisir et adapter la pratique.',
  keywords: ['sport enfant autiste', 'activité physique TDAH', 'sport adapté TSA', 'sport enfant TND'],
  openGraph: {
    title: 'Quel sport pour un enfant autiste ou TDAH ? 7 activités adaptées',
    description: 'Les 7 sports les plus adaptés aux enfants TSA et TDAH. Bienfaits prouvés et conseils pratiques.',
    url: 'https://neuro-care.fr/blog/activite-physique',
    type: 'article',
  },
  alternates: {
    canonical: 'https://neuro-care.fr/blog/activite-physique',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
