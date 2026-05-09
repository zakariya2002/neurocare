import type { Metadata } from 'next'
import ProTheme from '@/components/ProTheme';

export const metadata: Metadata = {
  title: 'Éducateur libéral TND — Développez votre activité',
  description: 'Rejoignez la plateforme n°1 pour éducateurs autisme, psychologues TDAH et orthophonistes DYS. Recevez vos 1ers RDV en 7 jours. Inscription gratuite, paiement sécurisé, facturation auto.',
  keywords: [
    'éducateur libéral autisme',
    'plateforme éducateurs TND',
    'devenir éducateur libéral',
    'éducateur spécialisé libéral',
    'psychologue TDAH libéral',
    'trouver patients autisme',
  ],
  openGraph: {
    title: 'NeuroCare Pro — Recevez vos 1ers RDV en 7 jours',
    description: 'Plateforme pour éducateurs autisme et pros TND. Agenda, paiement sécurisé, facturation auto. 88% reversés. Inscription gratuite.',
    url: 'https://neuro-care.fr/pro',
  },
  alternates: {
    canonical: 'https://neuro-care.fr/pro',
  },
}

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('pro-theme');`,
        }}
      />
      <ProTheme />
      {children}
    </>
  );
}
