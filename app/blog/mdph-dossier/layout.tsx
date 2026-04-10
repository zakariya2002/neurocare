import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dossier MDPH : guide complet 2026 pour les familles TND | NeuroCare',
  description: 'Comment constituer un dossier MDPH pour votre enfant autiste ou TDAH ? Checklist des documents, délais, erreurs à éviter et modèle de projet de vie. Guide mis à jour 2026.',
  keywords: ['dossier MDPH autisme', 'MDPH TDAH enfant', 'aide MDPH TND', 'constituer dossier MDPH', 'AEEH autisme'],
  openGraph: {
    title: 'Dossier MDPH : guide complet 2026 pour les familles TND',
    description: 'Checklist, délais, erreurs à éviter. Guide complet et mis à jour pour constituer votre dossier MDPH.',
    url: 'https://neuro-care.fr/blog/mdph-dossier',
    type: 'article',
    images: [{ url: 'https://neuro-care.fr/images/articles/mdph.jpg', width: 1200, height: 630, alt: 'Constituer son dossier MDPH' }],
  },
  alternates: { canonical: 'https://neuro-care.fr/blog/mdph-dossier' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
