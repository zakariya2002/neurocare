import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agrément SAP - Services à la Personne | NeuroCare',
  description: 'Obtenez votre agrément Services à la Personne (SAP). Guide complet pour les éducateurs spécialisés : démarches, avantages fiscaux pour les familles et conditions.',
  openGraph: {
    title: 'Agrément SAP - Services à la Personne | NeuroCare',
    description: 'Guide complet pour obtenir l\'agrément SAP. Démarches et avantages pour les éducateurs spécialisés.',
    url: 'https://neuro-care.fr/professionnels/agrement-sap',
  },
  alternates: {
    canonical: 'https://neuro-care.fr/professionnels/agrement-sap',
  },
}

export default function SapAccreditationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
