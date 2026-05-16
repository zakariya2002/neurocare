import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import CookieBanner from '@/components/CookieBanner'
import MetaPixel from '@/components/MetaPixel'
import { ToastProvider } from '@/components/Toast'
import { ConfirmProvider } from '@/components/ConfirmDialog'

export const metadata: Metadata = {
  title: {
    template: '%s | NeuroCare',
    default: 'NeuroCare — Éducateurs autisme, psychologues TDAH certifiés près de chez vous',
  },
  description: 'Trouvez un éducateur autisme, psychologue TDAH ou orthophoniste DYS certifié près de chez vous. Plateforme n°1 accompagnement neurodéveloppement en France. 100% gratuit pour les familles.',
  keywords: [
    'éducateur autisme',
    'éducateur spécialisé autisme',
    'psychologue TDAH',
    'psychologue autisme',
    'orthophoniste DYS',
    'accompagnement autisme',
    'accompagnement TDAH',
    'accompagnement TND',
    'professionnel neurodéveloppement',
    'éducateur TND',
    'TSA',
    'trouble du spectre autistique',
    'TDAH enfant',
    'troubles dys',
    'dyslexie',
    'dyspraxie',
    'psychomotricien',
    'ergothérapeute',
    'neuropsychologue',
    'éducateur spécialisé libéral',
    'trouver éducateur autisme près de chez moi',
    'prise en charge autisme',
    'séance ABA',
    'méthode TEACCH',
    'soutien famille autisme',
  ],
  authors: [{ name: 'NeuroCare' }],
  creator: 'NeuroCare',
  publisher: 'NeuroCare',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://neuro-care.fr'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'NeuroCare — Trouvez votre éducateur autisme certifié',
    description: 'Éducateurs autisme, psychologues TDAH, orthophonistes DYS certifiés près de chez vous. Réservation en ligne, paiement sécurisé. Gratuit pour les familles.',
    url: 'https://neuro-care.fr',
    siteName: 'NeuroCare',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/hero-campagne.png',
        width: 1200,
        height: 630,
        alt: 'NeuroCare — Plateforme accompagnement autisme, TDAH, DYS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeuroCare — Éducateurs autisme et psychologues TDAH certifiés',
    description: 'Trouvez un professionnel TND certifié près de chez vous. Réservation en ligne, gratuit pour les familles.',
    images: ['/images/hero-campagne.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'ZWXam3zHuJvyShnghKP8bKHlmgAo6DwpwOyHcOkT_hI',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://neuro-care.fr/#website',
        name: 'NeuroCare',
        description: 'Plateforme n°1 de mise en relation entre familles et professionnels du neurodéveloppement (autisme, TDAH, DYS) en France',
        url: 'https://neuro-care.fr',
        inLanguage: 'fr-FR',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://neuro-care.fr/search?q={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        },
        publisher: { '@id': 'https://neuro-care.fr/#organization' }
      },
      {
        '@type': ['Organization', 'MedicalBusiness'],
        '@id': 'https://neuro-care.fr/#organization',
        name: 'NeuroCare',
        url: 'https://neuro-care.fr',
        logo: {
          '@type': 'ImageObject',
          url: 'https://neuro-care.fr/icon-512.png',
          width: 512,
          height: 512
        },
        description: 'NeuroCare connecte les familles avec des éducateurs autisme, psychologues TDAH et orthophonistes DYS certifiés partout en France.',
        areaServed: {
          '@type': 'Country',
          name: 'France'
        },
        medicalSpecialty: [
          'Autisme (TSA)',
          'TDAH',
          'Troubles DYS',
          'Neurodéveloppement'
        ],
        makesOffer: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Mise en relation familles — professionnels TND',
              description: 'Trouvez et réservez un éducateur autisme, psychologue TDAH ou orthophoniste DYS certifié près de chez vous'
            },
            price: '0',
            priceCurrency: 'EUR',
            description: '100% gratuit pour les familles'
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Plateforme professionnels TND',
              description: 'Agenda en ligne, paiement sécurisé, facturation automatique pour éducateurs et professionnels du neurodéveloppement'
            },
            price: '0',
            priceCurrency: 'EUR',
            description: 'Inscription gratuite, commission uniquement sur les séances réalisées'
          }
        ],
        knowsAbout: [
          'Autisme',
          'Trouble du spectre autistique (TSA)',
          'TDAH',
          'Troubles DYS',
          'Dyslexie',
          'Dyspraxie',
          'Méthode ABA',
          'Méthode TEACCH',
          'PECS',
          'Éducation spécialisée',
          'Neurodéveloppement'
        ]
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://neuro-care.fr/#breadcrumb',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://neuro-care.fr' },
          { '@type': 'ListItem', position: 2, name: 'Trouver un professionnel', item: 'https://neuro-care.fr/search' },
          { '@type': 'ListItem', position: 3, name: 'Espace Pro', item: 'https://neuro-care.fr/pro' },
          { '@type': 'ListItem', position: 4, name: 'Blog', item: 'https://neuro-care.fr/blog' }
        ]
      }
    ]
  }

  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#027e7e" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </head>
      <body className="font-sans antialiased">
        {/* Skip link pour accessibilité RGAA */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg"
        >
          Aller au contenu principal
        </a>
          <ToastProvider>
            <ConfirmProvider>
              <main id="main-content" className="min-h-screen">
                {children}
              </main>
              <CookieBanner />
              <MetaPixel />
            </ConfirmProvider>
          </ToastProvider>
          <Analytics />
      </body>
    </html>
  )
}
