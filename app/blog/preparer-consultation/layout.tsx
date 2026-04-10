import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Première consultation TND : comment bien préparer votre enfant ? | NeuroCare',
  description: 'Votre enfant a un premier RDV avec un éducateur ou psychologue ? 5 étapes concrètes pour le préparer, réduire son stress et tirer le maximum de cette consultation.',
  keywords: ['première consultation autisme', 'préparer rdv psychologue enfant', 'consultation TDAH enfant', 'premier rendez-vous éducateur'],
  openGraph: {
    title: 'Première consultation TND : comment bien préparer votre enfant ?',
    description: '5 étapes concrètes pour préparer votre enfant à sa première consultation avec un professionnel TND.',
    url: 'https://neuro-care.fr/blog/preparer-consultation',
    type: 'article',
    images: [{ url: 'https://neuro-care.fr/images/articles/consultation.jpg', width: 1200, height: 630, alt: 'Préparer une consultation' }],
  },
  alternates: { canonical: 'https://neuro-care.fr/blog/preparer-consultation' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
