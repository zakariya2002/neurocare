import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forum | NeuroCare',
  description: 'Rejoignez le forum NeuroCare. Échangez avec d\'autres familles et professionnels, partagez vos expériences et trouvez du soutien dans votre parcours.',
  openGraph: {
    title: 'Forum | NeuroCare',
    description: 'Rejoignez le forum NeuroCare. Échangez avec d\'autres familles et professionnels.',
    url: 'https://neuro-care.fr/community',
  },
  alternates: {
    canonical: 'https://neuro-care.fr/community',
  },
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
