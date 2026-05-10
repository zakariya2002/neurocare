import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/feature-flags';
import {
  DIRECTORY_TYPES,
  isDirectoryType,
  type DirectoryType,
} from '@/lib/annuaire/types';
import { listEntriesByTypeAndDepartment } from '@/lib/annuaire/queries';
import { getDepartment, DEPARTMENTS } from '@/lib/annuaire/departments';
import EntryCard from '@/components/annuaire/EntryCard';
import PublicNavbar from '@/components/PublicNavbar';

interface Props {
  params: Promise<{ type: string; departement: string }>;
}

interface TypeStyle {
  color: string;
  bg: string;
  iconPath: string;
}

const TYPE_STYLES: Record<DirectoryType, TypeStyle> = {
  pco: {
    color: '#7c3aed',
    bg: '#ede9fe',
    iconPath:
      'M9 12h.01M15 12h.01M9 16h.01M15 16h.01M5 8h14M5 8a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-8a2 2 0 00-2-2M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2',
  },
  cra: {
    color: '#0891b2',
    bg: '#cffafe',
    iconPath:
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  mdph: {
    color: '#dc2626',
    bg: '#fee2e2',
    iconPath:
      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  camsp: {
    color: '#10b981',
    bg: '#d1fae5',
    iconPath:
      'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
};

export async function generateStaticParams() {
  // Pré-générer pour les départements seedés (pour SEO).
  // Les autres départements restent rendus à la demande.
  const params: Array<{ type: string; departement: string }> = [];
  const seedDepts = ['75', '92', '69', '13', '33', '31', '44', '59', '67', '38'];
  for (const type of ['pco', 'cra', 'mdph', 'camsp']) {
    for (const dept of seedDepts) {
      params.push({ type, departement: dept });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, departement } = await params;
  if (!isDirectoryType(type)) return {};
  const dept = getDepartment(departement);
  if (!dept) return {};
  const cfg = DIRECTORY_TYPES[type];

  const title = `${cfg.label} ${dept.name} (${dept.code}) — Annuaire | NeuroCare`;
  const description = `Trouvez ${cfg.article} dans le département ${dept.name} (${dept.code}). ${cfg.shortDescription}`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://neuro-care.fr/annuaire/${type}/${departement}`,
    },
    openGraph: {
      title,
      description,
      url: `https://neuro-care.fr/annuaire/${type}/${departement}`,
    },
  };
}

export default async function AnnuaireTypeDepartmentPage({ params }: Props) {
  if (!FEATURES.annuaireExterne) notFound();

  const { type, departement } = await params;
  if (!isDirectoryType(type)) notFound();

  const dept = DEPARTMENTS[departement];
  if (!dept) notFound();

  const cfg = DIRECTORY_TYPES[type];
  const style = TYPE_STYLES[type];
  const entries = await listEntriesByTypeAndDepartment(type, departement);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cfg.fullName} — ${dept.name} (${dept.code})`,
    url: `https://neuro-care.fr/annuaire/${type}/${departement}`,
    description: `Liste des ${cfg.plural} dans le département ${dept.name}.`,
    about: {
      '@type': 'AdministrativeArea',
      name: dept.name,
      identifier: dept.code,
      containedInPlace: { '@type': 'AdministrativeArea', name: dept.regionName },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNavbar />
      <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
        <header
          className="pt-20 xl:pt-24 pb-8 sm:pb-10 px-4 text-white relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, #027e7e 0%, #015c5c 100%)',
          }}
        >
          <div className="max-w-5xl mx-auto relative">
            <nav className="mb-5 text-teal-100 text-xs sm:text-sm" aria-label="Fil d'Ariane">
              <Link href="/" className="hover:text-white">Accueil</Link>
              <span className="mx-2 opacity-60">/</span>
              <Link href="/annuaire" className="hover:text-white">Annuaire</Link>
              <span className="mx-2 opacity-60">/</span>
              <Link href={`/annuaire/${type}`} className="hover:text-white">{cfg.label}</Link>
              <span className="mx-2 opacity-60">/</span>
              <span className="text-white font-medium">Département {dept.code}</span>
            </nav>

            <div className="flex items-center gap-3 mb-3">
              <span
                className="inline-flex items-center justify-center min-w-[44px] h-9 px-2 rounded-lg font-bold text-sm"
                style={{ backgroundColor: style.bg, color: style.color }}
                aria-label={`Code département ${dept.code}`}
              >
                {dept.code}
              </span>
              <span
                className="inline-block text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#c9eaea' }}
              >
                {cfg.label} · {dept.regionName}
              </span>
            </div>

            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              {cfg.label} dans {dept.name}
            </h1>
            <p className="text-teal-100 text-sm sm:text-base">
              {entries.length} {cfg.label} référencé{entries.length > 1 ? 's' : ''} dans le département {dept.code}
            </p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          {entries.length === 0 ? (
            <section className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-8 sm:p-12 text-center">
              <div
                className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: style.bg }}
                aria-hidden="true"
              >
                <svg className="w-7 h-7" style={{ color: style.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                Aucun {cfg.label} référencé pour {dept.name}
              </h2>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                Cette page sera enrichie au fil de l'ingestion des données
                officielles. En attendant, consultez la liste complète des{' '}
                {cfg.plural} en France ou directement la source officielle.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href={`/annuaire/${type}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl hover:opacity-90 hover:shadow-md transition-all shadow-sm"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  Voir tous les {cfg.plural}
                </Link>
                <a
                  href={cfg.defaultSourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-[#027e7e]/40 hover:text-[#027e7e] transition"
                >
                  Source officielle ({cfg.defaultSourceLabel})
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </section>
          ) : (
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entries.map((e) => (
                  <EntryCard key={e.id} entry={e} />
                ))}
              </div>
            </section>
          )}

          {/* CTA pros NeuroCare locaux */}
          <section className="mt-12 bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#e6f4f4' }}
                aria-hidden="true"
              >
                <svg className="w-6 h-6" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5"
                  style={{ fontFamily: 'Verdana, sans-serif' }}
                >
                  Pas trouvé ce que vous cherchez ?
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Une fois orienté par {cfg.article}, retrouvez un éducateur,
                  psychologue ou orthophoniste libéral certifié en {dept.name}.
                </p>
              </div>
              <Link
                href={`/search?location=${encodeURIComponent(dept.name)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl hover:opacity-90 hover:shadow-md transition-all shadow-sm whitespace-nowrap text-sm"
                style={{ backgroundColor: '#027e7e' }}
              >
                Voir les pros NeuroCare
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>

          {/* Source */}
          <section className="mt-6">
            <div
              className="rounded-xl md:rounded-2xl shadow-sm border overflow-hidden p-4 sm:p-5 text-sm flex items-start gap-3"
              style={{ backgroundColor: '#fef9c3', borderColor: '#fde68a', color: '#78350f' }}
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p>
                  <strong>Source officielle :</strong>{' '}
                  <a
                    href={cfg.defaultSourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline font-medium"
                  >
                    {cfg.defaultSourceLabel}
                  </a>
                  . Une donnée semble incorrecte ?{' '}
                  <a
                    href={`mailto:contact@neuro-care.fr?subject=Annuaire%20${cfg.label}%20${dept.code}%20%E2%80%94%20Signalement`}
                    className="underline font-medium"
                  >
                    Signalez-le-nous
                  </a>.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
