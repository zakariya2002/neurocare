import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/feature-flags';
import { DIRECTORY_TYPES, DIRECTORY_TYPE_CODES } from '@/lib/annuaire/types';
import { countEntriesByType } from '@/lib/annuaire/queries';
import SearchBar from '@/components/annuaire/SearchBar';
import PublicNavbar from '@/components/PublicNavbar';

export const metadata: Metadata = {
  title: 'Annuaire des acteurs publics TND — PCO, CRA, MDPH, CAMSP | NeuroCare',
  description:
    'Trouvez la PCO, la MDPH, le CRA ou le CAMSP près de chez vous. Annuaire officiel des acteurs publics du parcours TND (autisme, TDAH, DYS) en France, géolocalisé par département.',
  keywords: [
    'annuaire TND',
    'PCO TND',
    'MDPH',
    'CRA autisme',
    'CAMSP',
    'parcours TND',
    'plateforme coordination orientation',
    'maison départementale personnes handicapées',
  ],
  alternates: { canonical: 'https://neuro-care.fr/annuaire' },
  openGraph: {
    title: 'Annuaire des acteurs publics TND | NeuroCare',
    description:
      'PCO, CRA, MDPH, CAMSP : trouvez les services publics du parcours TND près de chez vous.',
    url: 'https://neuro-care.fr/annuaire',
  },
};

export default async function AnnuaireHomePage() {
  if (!FEATURES.annuaireExterne) notFound();

  const counts = await countEntriesByType();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Annuaire des acteurs publics TND',
    url: 'https://neuro-care.fr/annuaire',
    description:
      'Annuaire géolocalisé des PCO, CRA, MDPH et CAMSP en France.',
    publisher: {
      '@type': 'Organization',
      name: 'NeuroCare',
      url: 'https://neuro-care.fr',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNavbar />
      <div className="min-h-screen bg-[#fdf9f4] pt-14 lg:pt-16">
        {/* Hero */}
        <header className="bg-gradient-to-br from-teal-600 to-teal-700 text-white">
          <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
            <nav className="mb-6 text-teal-100 text-sm" aria-label="Fil d'Ariane">
              <Link href="/" className="hover:text-white">Accueil</Link>
              {' / '}
              <span className="text-white">Annuaire</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Annuaire des acteurs publics TND
            </h1>
            <p className="text-lg sm:text-xl text-teal-100 max-w-3xl mb-8">
              Plateformes de coordination, MDPH, CRA, CAMSP : trouvez les
              services publics du parcours TND près de chez vous, partout en
              France.
            </p>
            <SearchBar defaultType="pco" />
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          {/* Types d'acteurs */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Quel acteur consulter ?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DIRECTORY_TYPE_CODES.map((code) => {
                const cfg = DIRECTORY_TYPES[code];
                const count = counts[code];
                return (
                  <Link
                    key={code}
                    href={`/annuaire/${code}`}
                    className="block bg-white rounded-xl p-6 border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${cfg.accent}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {count} référencé{count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-teal-700 transition-colors">
                      {cfg.fullName}
                    </h3>
                    <p className="text-sm text-gray-600">{cfg.shortDescription}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Parcours type */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Comment s'orienter dans le parcours TND ?
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong className="text-gray-900">1. Premiers signes ou inquiétudes :</strong>{' '}
                consultez votre médecin traitant ou le pédiatre. En cas de
                doute, le CAMSP (0-6 ans) ou un médecin libéral peut établir un
                premier repérage.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong className="text-gray-900">2. Parcours diagnostique :</strong>{' '}
                la PCO TND coordonne le bilan pluridisciplinaire pour les
                enfants de 0 à 12 ans, avec un forfait précoce pris en charge
                par l'Assurance maladie.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong className="text-gray-900">3. Reconnaissance des droits :</strong>{' '}
                la MDPH instruit les demandes (AEEH, PCH, PPS, AESH,
                orientation médico-sociale).
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong className="text-gray-900">4. Expertise et second avis :</strong>{' '}
                le CRA de votre région peut compléter le diagnostic, former les
                professionnels et orienter vers les structures locales.
              </p>
            </div>
          </section>

          {/* Sources et limitations */}
          <section className="mb-12">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="font-semibold text-amber-900 mb-2">
                À propos de ces données
              </h3>
              <p className="text-sm text-amber-800 mb-2">
                Les coordonnées présentées sont issues des sources officielles
                publiques :{' '}
                <a href="https://handicap.gouv.fr" target="_blank" rel="noreferrer noopener" className="underline">handicap.gouv.fr</a>,{' '}
                <a href="https://www.cnsa.fr" target="_blank" rel="noreferrer noopener" className="underline">cnsa.fr</a>,{' '}
                <a href="https://gncra.fr" target="_blank" rel="noreferrer noopener" className="underline">gncra.fr</a>{' '}
                et la base{' '}
                <a href="https://finess.esante.gouv.fr" target="_blank" rel="noreferrer noopener" className="underline">FINESS</a>.
              </p>
              <p className="text-sm text-amber-800">
                Cette première version contient un échantillon représentatif. Une donnée
                semble incorrecte ?{' '}
                <a href="mailto:contact@neuro-care.fr?subject=Annuaire%20%E2%80%94%20Signalement%20d%27erreur" className="underline font-medium">
                  Signalez-le-nous
                </a>.
              </p>
            </div>
          </section>

          {/* CTA pros */}
          <section className="text-center bg-white rounded-2xl p-8 sm:p-12 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Et un professionnel libéral pour le suivi ?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Une fois orienté par la PCO ou le CAMSP, retrouvez un éducateur,
              psychologue, orthophoniste ou psychomotricien certifié sur NeuroCare.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-semibold rounded-xl hover:opacity-90 transition-colors shadow-md text-base"
              style={{ backgroundColor: '#027e7e' }}
            >
              Trouver un professionnel libéral
            </Link>
          </section>
        </main>
      </div>
    </>
  );
}
