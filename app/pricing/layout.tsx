import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs Éducateurs | NeuroCare',
  description: 'NeuroCare est gratuit pour les éducateurs spécialisés et professionnels du neurodéveloppement : inscription, profil, gestion des RDV et messagerie inclus. Commission de 12% uniquement sur les RDV réservés via la plateforme.',
  openGraph: {
    title: 'Tarifs Éducateurs | NeuroCare',
    description: 'Inscription gratuite pour les éducateurs spécialisés : profil, gestion des RDV et messagerie inclus. Commission de 12% uniquement sur les RDV réservés.',
    url: 'https://neuro-care.fr/pricing',
  },
  alternates: {
    canonical: 'https://neuro-care.fr/pricing',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
