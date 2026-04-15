import type { Metadata } from 'next';
import ProTheme from '@/components/ProTheme';

export const metadata: Metadata = {
  title: 'Blog Pro NeuroCare | Ressources pour éducateurs et pros TND',
  description:
    "Articles, guides et actualités pour éducateurs libéraux, psychologues, orthophonistes et professionnels TND. Développez votre activité avec NeuroCare Pro.",
  openGraph: {
    title: 'Blog Pro NeuroCare | Ressources pour professionnels TND',
    description:
      "Articles et ressources pour éducateurs libéraux, psys et pros TND. Développez votre activité avec NeuroCare Pro.",
    url: 'https://neuro-care.fr/pro/blog',
    type: 'website',
  },
  alternates: {
    canonical: 'https://neuro-care.fr/pro/blog',
  },
};

export default function ProBlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProTheme />
      {children}
    </>
  );
}
