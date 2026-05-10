import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/feature-flags';
import {
  DIRECTORY_TYPES,
  DIRECTORY_TYPE_CODES,
  type DirectoryType,
} from '@/lib/annuaire/types';
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

interface TypeStyle {
  color: string;
  bg: string;
  borderHover: string;
  iconPath: string;
}

const TYPE_STYLES: Record<DirectoryType, TypeStyle> = {
  pco: {
    color: '#7c3aed',
    bg: '#ede9fe',
    borderHover: 'rgba(124, 58, 237, 0.4)',
    iconPath:
      'M9 12h.01M15 12h.01M9 16h.01M15 16h.01M5 8h14M5 8a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-8a2 2 0 00-2-2M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2',
  },
  cra: {
    color: '#0891b2',
    bg: '#cffafe',
    borderHover: 'rgba(8, 145, 178, 0.4)',
    iconPath:
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  mdph: {
    color: '#dc2626',
    bg: '#fee2e2',
    borderHover: 'rgba(220, 38, 38, 0.4)',
    iconPath:
      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  camsp: {
    color: '#10b981',
    bg: '#d1fae5',
    borderHover: 'rgba(16, 185, 129, 0.4)',
    iconPath:
      'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
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

  const totalCount = DIRECTORY_TYPE_CODES.reduce(
    (sum, code) => sum + (counts[code] ?? 0),
    0
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNavbar />
      <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
        {/* Hero */}
        <header
          className="pt-20 xl:pt-24 pb-10 sm:pb-14 px-4 text-white relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, #027e7e 0%, #015c5c 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, #c9eaea 0%, transparent 40%), radial-gradient(circle at 80% 80%, #3a9e9e 0%, transparent 40%)',
            }}
          />
          <div className="max-w-5xl mx-auto relative">
            <nav className="mb-5 text-teal-100 text-xs sm:text-sm" aria-label="Fil d'Ariane">
              <Link href="/" className="hover:text-white">
                Accueil
              </Link>
              <span className="mx-2 opacity-60">/</span>
              <span className="text-white font-medium">Annuaire</span>
            </nav>

            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#c9eaea' }}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Sources publiques officielles
            </span>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              Annuaire des structures publiques pour familles TND
            </h1>
            <p
              className="text-base sm:text-lg lg:text-xl text-teal-100 max-w-3xl mb-8 leading-relaxed"
              style={{ fontFamily: 'Open Sans, sans-serif' }}
            >
              Plateformes de coordination, MDPH, CRA, CAMSP — trouvez les services
              publics du parcours TND près de chez vous, partout en France.
            </p>
            <SearchBar defaultType="pco" variant="hero" />
            {totalCount > 0 && (
              <p className="mt-4 text-xs sm:text-sm text-teal-100 text-center sm:text-left">
                <strong className="text-white">{totalCount}</strong> structures référencées · données vérifiées
              </p>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          {/* 4 types d'acteurs */}
          <section className="mb-12 sm:mb-16">
            <div className="text-center mb-8">
              <h2
                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                4 types d'acteurs à connaître
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                Chaque structure a un rôle distinct dans le parcours TND. Choisissez
                celle qui correspond à votre besoin actuel.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {DIRECTORY_TYPE_CODES.map((code) => {
                const cfg = DIRECTORY_TYPES[code];
                const count = counts[code] ?? 0;
                const style = TYPE_STYLES[code];
                return (
                  <Link
                    key={code}
                    href={`/annuaire/${code}`}
                    aria-label={`Explorer l'annuaire des ${cfg.plural}`}
                    className="group bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-5 sm:p-6 hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 flex flex-col"
                    style={{
                      ['--hover-border' as any]: style.borderHover,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: style.bg }}
                      >
                        <svg
                          className="w-6 h-6"
                          style={{ color: style.color }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d={style.iconPath}
                          />
                        </svg>
                      </div>
                      <span
                        className="text-[11px] font-semibold px-2 py-1 rounded-md"
                        style={{ backgroundColor: style.bg, color: style.color }}
                      >
                        {count} référencé{count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <h3
                      className="text-lg font-bold text-gray-900 mb-1"
                      style={{ fontFamily: 'Verdana, sans-serif' }}
                    >
                      {cfg.label}
                    </h3>
                    <p className="text-xs font-semibold mb-3" style={{ color: style.color }}>
                      {cfg.fullName}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-4">
                      {cfg.shortDescription}
                    </p>
                    <span
                      className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto"
                      style={{ color: style.color }}
                    >
                      Explorer
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Comment utiliser cet annuaire ? */}
          <section className="mb-12 sm:mb-16">
            <div className="text-center mb-8">
              <h2
                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                Comment utiliser cet annuaire ?
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                Un parcours en 3 étapes pour trouver la bonne structure au bon moment.
              </p>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {[
                {
                  num: '1',
                  title: 'Identifiez votre besoin',
                  desc: 'Diagnostic en cours, reconnaissance MDPH, soutien précoce ? Chaque acteur a une mission précise.',
                  iconPath:
                    'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
                },
                {
                  num: '2',
                  title: 'Localisez la structure',
                  desc: 'Saisissez votre code postal ou département pour découvrir les structures publiques de votre secteur.',
                  iconPath:
                    'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
                },
                {
                  num: '3',
                  title: 'Contactez-la directement',
                  desc: 'Coordonnées officielles, site web, horaires : tous les éléments pour entrer en relation rapidement.',
                  iconPath:
                    'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
                },
              ].map((step) => (
                <li
                  key={step.num}
                  className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-5 sm:p-6 relative"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-3 font-bold text-base"
                    style={{ backgroundColor: '#c9eaea', color: '#015c5c' }}
                    aria-hidden="true"
                  >
                    {step.num}
                  </div>
                  <div
                    className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#e6f4f4' }}
                    aria-hidden="true"
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: '#027e7e' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d={step.iconPath}
                      />
                    </svg>
                  </div>
                  <h3
                    className="font-bold text-gray-900 mb-1.5"
                    style={{ fontFamily: 'Verdana, sans-serif' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Parcours type */}
          <section className="mb-12 sm:mb-16">
            <div
              className="rounded-xl md:rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8"
              style={{ backgroundColor: '#e6f4f4', border: '1px solid #c9eaea' }}
            >
              <h2
                className="text-xl sm:text-2xl font-bold mb-5"
                style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
              >
                S'orienter dans le parcours TND
              </h2>
              <div className="space-y-3.5 text-sm sm:text-base text-gray-700">
                <p>
                  <strong style={{ color: '#015c5c' }}>1. Premiers signes :</strong>{' '}
                  consultez votre médecin traitant ou le pédiatre. Le CAMSP (0–6 ans)
                  ou un médecin libéral peut établir un premier repérage.
                </p>
                <p>
                  <strong style={{ color: '#015c5c' }}>2. Parcours diagnostique :</strong>{' '}
                  la PCO TND coordonne le bilan pluridisciplinaire pour les enfants
                  de 0 à 12 ans, avec un forfait précoce pris en charge par
                  l'Assurance maladie.
                </p>
                <p>
                  <strong style={{ color: '#015c5c' }}>3. Reconnaissance des droits :</strong>{' '}
                  la MDPH instruit les demandes (AEEH, PCH, PPS, AESH, orientation
                  médico-sociale).
                </p>
                <p>
                  <strong style={{ color: '#015c5c' }}>4. Expertise et second avis :</strong>{' '}
                  le CRA de votre région complète le diagnostic, forme les
                  professionnels et oriente vers les structures locales.
                </p>
              </div>
            </div>
          </section>

          {/* Sources officielles */}
          <section className="mb-12 sm:mb-16">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-5 sm:p-6">
              <div className="flex items-start gap-3 mb-3">
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#fef3c7' }}
                  aria-hidden="true"
                >
                  <svg className="w-5 h-5" style={{ color: '#b45309' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-0.5" style={{ fontFamily: 'Verdana, sans-serif' }}>
                    À propos de ces données
                  </h3>
                  <p className="text-sm text-gray-600">
                    Les coordonnées présentées sont issues des sources officielles publiques :
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { label: 'handicap.gouv.fr', href: 'https://handicap.gouv.fr' },
                  { label: 'cnsa.fr', href: 'https://www.cnsa.fr' },
                  { label: 'gncra.fr', href: 'https://gncra.fr' },
                  { label: 'FINESS', href: 'https://finess.esante.gouv.fr' },
                ].map((src) => (
                  <a
                    key={src.label}
                    href={src.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-gray-200 text-gray-700 hover:border-[#027e7e]/40 hover:text-[#027e7e] transition"
                  >
                    {src.label}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Cette première version contient un échantillon représentatif. Une donnée semble incorrecte ?{' '}
                <a
                  href="mailto:contact@neuro-care.fr?subject=Annuaire%20%E2%80%94%20Signalement%20d%27erreur"
                  className="font-medium text-[#027e7e] hover:underline"
                >
                  Signalez-le-nous
                </a>.
              </p>
            </div>
          </section>

          {/* CTA pros */}
          <section className="text-center bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-8 sm:p-12">
            <h2
              className="text-2xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              Et un professionnel libéral pour le suivi ?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Une fois orienté par la PCO ou le CAMSP, retrouvez un éducateur,
              psychologue, orthophoniste ou psychomotricien certifié sur NeuroCare.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-semibold rounded-xl hover:opacity-90 hover:shadow-md transition-all shadow-sm text-base"
              style={{ backgroundColor: '#027e7e' }}
            >
              Trouver un professionnel libéral
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </section>
        </main>
      </div>
    </>
  );
}
