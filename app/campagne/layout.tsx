import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rejoignez NeuroCare — La plateforme pour les professionnels du neurodéveloppement',
  description: '100 % gratuit. Agenda en ligne, facturation automatique, visibilité auprès des familles TND. Inscription en 2 minutes.',
  openGraph: {
    title: 'Rejoignez NeuroCare — La plateforme pour les professionnels du neurodéveloppement',
    description: '100 % gratuit. Agenda en ligne, facturation automatique, visibilité auprès des familles TND.',
    url: 'https://neuro-care.fr/campagne',
    images: [
      {
        url: '/images/hero-campagne.png',
        width: 1200,
        height: 630,
        alt: 'NeuroCare — Plateforme pour les professionnels du neurodéveloppement',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rejoignez NeuroCare — La plateforme pour les professionnels du neurodéveloppement',
    description: '100 % gratuit. Agenda en ligne, facturation automatique, visibilité auprès des familles TND.',
    images: ['/images/hero-campagne.png'],
  },
};

export default function CampagneLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
