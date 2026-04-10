import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Parent d'enfant autiste : 6 conseils pour éviter l'épuisement | NeuroCare",
  description: "Vous êtes parent d'un enfant TSA, TDAH ou DYS et vous vous sentez épuisé ? 6 conseils concrets pour prendre du répit, trouver du soutien et éviter le burn-out parental.",
  keywords: ['parent épuisé autisme', 'burn-out parental TDAH', 'répit parent aidant', 'soutien famille autisme'],
  openGraph: {
    title: "Parent d'enfant autiste : 6 conseils pour éviter l'épuisement",
    description: '6 conseils concrets pour les parents aidants. Répit, soutien et prévention du burn-out.',
    url: 'https://neuro-care.fr/blog/bien-etre-aidants',
    type: 'article',
    images: [{ url: 'https://neuro-care.fr/images/articles/bien-etre-aidants.jpg', width: 1200, height: 630, alt: 'Bien-être des parents aidants' }],
  },
  alternates: { canonical: 'https://neuro-care.fr/blog/bien-etre-aidants' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
