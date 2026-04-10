import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Harcèlement scolaire et autisme : comment protéger votre enfant ? | NeuroCare',
  description: "Les enfants TSA et TDAH sont 3x plus ciblés par le harcèlement scolaire. Signes à repérer, démarches auprès de l'école et accompagnement professionnel. Guide complet.",
  keywords: ['harcèlement scolaire autisme', 'harcèlement TDAH école', 'protéger enfant autiste école', 'harcèlement TND'],
  openGraph: {
    title: 'Harcèlement scolaire et autisme : comment protéger votre enfant ?',
    description: "Signes à repérer, démarches auprès de l'école et accompagnement professionnel.",
    url: 'https://neuro-care.fr/blog/harcelement-scolaire',
    type: 'article',
  },
  alternates: { canonical: 'https://neuro-care.fr/blog/harcelement-scolaire' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
