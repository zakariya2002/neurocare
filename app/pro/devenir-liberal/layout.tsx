import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Devenir éducateur libéral — Guide complet 2026',
  description: 'Guide complet pour devenir éducateur spécialisé libéral. Choisir son statut, ses méthodes (ABA, TEACCH, DENVER, PECS), accompagner les familles près de chez soi. Liberté, proximité, sens.',
  keywords: [
    'devenir éducateur libéral',
    'éducateur spécialisé libéral',
    'éducateur libéral',
    'éducateur indépendant',
    'micro-entreprise éducateur spécialisé',
    'méthodes ABA TEACCH DENVER',
    'ACRE éducateur',
    'devenir libéral paramédical',
    'éducateur TND libéral',
  ],
  openGraph: {
    title: 'Devenir éducateur libéral — Liberté, méthodes, proximité',
    description: 'Guide 2026 pour exercer en libéral : statut, méthodes, étapes pratiques. Choisissez vos horaires, vos approches, accompagnez les familles de votre région.',
    url: 'https://neuro-care.fr/pro/devenir-liberal',
    type: 'article',
  },
  alternates: {
    canonical: 'https://neuro-care.fr/pro/devenir-liberal',
  },
}

export default function DevenirLiberalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children
}
