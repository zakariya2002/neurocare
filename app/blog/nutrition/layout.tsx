import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sélectivité alimentaire et autisme : que faire quand votre enfant refuse de manger ? | NeuroCare',
  description: 'Votre enfant autiste ou TDAH ne mange que 3 aliments ? Comprendre la sélectivité alimentaire, les pistes concrètes pour diversifier et quand consulter un spécialiste.',
  keywords: ['sélectivité alimentaire autisme', 'enfant autiste ne mange pas', 'alimentation TDAH', 'nutrition TND enfant'],
  openGraph: {
    title: 'Sélectivité alimentaire et autisme : que faire ?',
    description: "Comprendre la sélectivité alimentaire et les pistes pour diversifier l'alimentation de votre enfant TND.",
    url: 'https://neuro-care.fr/blog/nutrition',
    type: 'article',
  },
  alternates: { canonical: 'https://neuro-care.fr/blog/nutrition' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
