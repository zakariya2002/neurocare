import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: 'Profil professionnel - NeuroCare',
    description: 'Consultez le profil de ce professionnel spécialisé en autisme sur NeuroCare.',
    openGraph: {
      title: 'Profil professionnel - NeuroCare',
      description: 'Consultez le profil de ce professionnel spécialisé en autisme sur NeuroCare.',
      url: `https://neuro-care.fr/educator/${params.id}`,
    },
    alternates: {
      canonical: `https://neuro-care.fr/educator/${params.id}`,
    },
  }
}

export default function EducatorProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
