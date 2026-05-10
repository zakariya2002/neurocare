import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/feature-flags';
import {
  DIRECTORY_TYPES,
  isDirectoryType,
  type DirectoryType,
} from '@/lib/annuaire/types';
import { listEntriesByType } from '@/lib/annuaire/queries';
import { getDepartment } from '@/lib/annuaire/departments';
import FilteredEntryList from '@/components/annuaire/FilteredEntryList';
import PublicNavbar from '@/components/PublicNavbar';

interface Props {
  params: Promise<{ type: string }>;
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
  return ['pco', 'cra', 'mdph', 'camsp'].map((type) => ({ type }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  if (!isDirectoryType(type)) return {};
  const cfg = DIRECTORY_TYPES[type];

  const title = `${cfg.fullName} — Annuaire complet en France | NeuroCare`;
  const description = `Trouvez ${cfg.article} près de chez vous : annuaire géolocalisé des ${cfg.plural} en France. ${cfg.shortDescription}`;

  return {
    title,
    description,
    keywords: [cfg.label, cfg.fullName, 'annuaire', 'TND', 'autisme'],
    alternates: { canonical: `https://neuro-care.fr/annuaire/${type}` },
    openGraph: { title, description, url: `https://neuro-care.fr/annuaire/${type}` },
  };
}

export default async function AnnuaireTypePage({ params }: Props) {
  if (!FEATURES.annuaireExterne) notFound();

  const { type } = await params;
  if (!isDirectoryType(type)) notFound();

  const cfg = DIRECTORY_TYPES[type];
  const style = TYPE_STYLES[type];
  const entries = await listEntriesByType(type);

  // Regrouper par département pour proposer des liens d'index
  const byDept = new Map<string, number>();
  for (const e of entries) {
    if (e.department_code) {
      byDept.set(e.department_code, (byDept.get(e.department_code) ?? 0) + 1);
    }
  }
  const sortedDepts = Array.from(byDept.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cfg.fullName} — France`,
    url: `https://neuro-care.fr/annuaire/${type}`,
    description: cfg.shortDescription,
    isPartOf: {
      '@type': 'WebSite',
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
      <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
        <header
          className="pt-20 xl:pt-24 pb-8 sm:pb-12 px-4 text-white relative overflow-hidden"
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
              <span className="text-white font-medium">{cfg.label}</span>
            </nav>

            <div className="flex items-start gap-4 mb-3">
              <div
                className="hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                aria-hidden="true"
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d={style.iconPath}
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-block text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md mb-2"
                  style={{ backgroundColor: style.bg, color: style.color }}
                >
                  {cfg.label} · {entries.length} référencé{entries.length > 1 ? 's' : ''}
                </span>
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 leading-tight"
                  style={{ fontFamily: 'Verdana, sans-serif' }}
                >
                  {cfg.fullName}
                </h1>
                <p
                  className="text-base sm:text-lg text-teal-100 max-w-3xl leading-relaxed"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                >
                  {cfg.longDescription}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          {/* Index par département */}
          {sortedDepts.length > 0 && (
            <section className="mb-10">
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <h2
                  className="text-xl sm:text-2xl font-bold text-gray-900"
                  style={{ fontFamily: 'Verdana, sans-serif' }}
                >
                  Trouver par département
                </h2>
                <span className="text-xs sm:text-sm text-gray-500">
                  {sortedDepts.length} département{sortedDepts.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5">
                <div className="flex flex-wrap gap-2">
                  {sortedDepts.map(([code, n]) => {
                    const dept = getDepartment(code);
                    return (
                      <Link
                        key={code}
                        href={`/annuaire/${type}/${code}`}
                        className="group inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full text-sm border transition-all hover:shadow-sm"
                        style={{
                          borderColor: '#e5e7eb',
                          backgroundColor: '#fafafa',
                        }}
                      >
                        <span
                          className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-full text-[11px] font-bold"
                          style={{ backgroundColor: style.bg, color: style.color }}
                        >
                          {code}
                        </span>
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                          {dept ? dept.name : 'Département'}
                        </span>
                        <span className="text-xs text-gray-400">({n})</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Liste filtrable */}
          <section>
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2
                className="text-xl sm:text-2xl font-bold text-gray-900"
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                Tous les {cfg.plural} référencés
              </h2>
              <span className="text-xs sm:text-sm text-gray-500">
                {entries.length} structure{entries.length > 1 ? 's' : ''}
              </span>
            </div>
            <FilteredEntryList
              entries={entries}
              emptyLabel={`Aucun ${cfg.label} ne correspond à votre filtre.`}
            />
          </section>

          {/* Source */}
          <section className="mt-10">
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
                    href={`mailto:contact@neuro-care.fr?subject=Annuaire%20${cfg.label}%20%E2%80%94%20Signalement`}
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
