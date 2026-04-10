import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crise sensorielle en public : que faire ? Guide pour parents | NeuroCare',
  description: "Votre enfant fait une crise sensorielle au supermarché ou à l'école ? Techniques d'apaisement immédiates, outils sensoriels et prévention. Guide pratique pour parents.",
  keywords: ['crise sensorielle enfant', 'crise autisme en public', 'apaisement sensoriel TSA', 'outils sensoriels TDAH'],
  openGraph: {
    title: 'Crise sensorielle en public : que faire ?',
    description: "Techniques d'apaisement immédiates et outils sensoriels pour gérer les crises en public.",
    url: 'https://neuro-care.fr/blog/crises-sensorielles',
    type: 'article',
    images: [{ url: 'https://neuro-care.fr/images/articles/crises-sensorielles.jpg', width: 1200, height: 630, alt: 'Gérer les crises sensorielles' }],
  },
  alternates: { canonical: 'https://neuro-care.fr/blog/crises-sensorielles' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
