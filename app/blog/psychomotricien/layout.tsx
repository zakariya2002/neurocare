import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Psychomotricien pour enfant autiste : rôle, séances et bienfaits | NeuroCare',
  description: 'Quand consulter un psychomotricien pour votre enfant TSA ou TDAH ? Déroulement des séances, tarifs, remboursement et comment trouver un psychomotricien spécialisé.',
  keywords: ['psychomotricien autisme', 'psychomotricien TDAH enfant', 'séance psychomotricité TSA', 'trouver psychomotricien'],
  openGraph: {
    title: 'Psychomotricien pour enfant autiste : rôle, séances et bienfaits',
    description: 'Déroulement des séances, tarifs et comment trouver un psychomotricien spécialisé TND.',
    url: 'https://neuro-care.fr/blog/psychomotricien',
    type: 'article',
    images: [{ url: 'https://neuro-care.fr/images/articles/psychomotricien.jpg', width: 1200, height: 630, alt: 'Le métier de psychomotricien' }],
  },
  alternates: { canonical: 'https://neuro-care.fr/blog/psychomotricien' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
