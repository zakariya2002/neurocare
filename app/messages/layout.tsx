import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Messages - NeuroCare',
  description: 'Consultez et envoyez vos messages aux professionnels et familles sur NeuroCare.',
  openGraph: {
    title: 'Messages - NeuroCare',
    description: 'Consultez et envoyez vos messages aux professionnels et familles sur NeuroCare.',
    url: 'https://neuro-care.fr/messages',
  },
  alternates: {
    canonical: 'https://neuro-care.fr/messages',
  },
}

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
