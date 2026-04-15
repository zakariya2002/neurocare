import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs Professionnels | NeuroCare',
  description: 'NeuroCare est gratuit pour les professionnels du neurodéveloppement : inscription, profil, gestion des RDV et messagerie inclus. Commission de 12% uniquement sur les RDV réservés via la plateforme.',
  openGraph: {
    title: 'Tarifs Professionnels | NeuroCare',
    description: 'Inscription gratuite pour les professionnels du neurodéveloppement : profil, gestion des RDV et messagerie inclus. Commission de 12% uniquement sur les RDV réservés.',
    url: 'https://neuro-care.fr/pro/pricing',
  },
  alternates: {
    canonical: 'https://neuro-care.fr/pro/pricing',
  },
}

export default function ProPricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
