import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '"Trouver le bon éducateur a tout changé pour notre fils autiste" | NeuroCare',
  description: "Émilie et Thomas racontent comment ils ont trouvé un éducateur spécialisé pour Théo (TSA + TDAH) et l'impact sur son autonomie, sa communication et leur quotidien.",
  keywords: ['témoignage famille autisme', 'trouver éducateur autisme', 'parcours diagnostic TSA', 'accompagnement enfant autiste'],
  openGraph: {
    title: '"Trouver le bon éducateur a tout changé pour notre fils autiste"',
    description: "Témoignage d'Émilie et Thomas, parents de Théo diagnostiqué TSA et TDAH.",
    url: 'https://neuro-care.fr/blog/temoignage-famille',
    type: 'article',
    images: [{ url: 'https://neuro-care.fr/images/articles/temoignage-famille.jpg', width: 1200, height: 630, alt: 'Témoignage famille NeuroCare' }],
  },
  alternates: { canonical: 'https://neuro-care.fr/blog/temoignage-famille' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
