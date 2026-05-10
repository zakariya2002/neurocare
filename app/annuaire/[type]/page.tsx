import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/feature-flags';
import { DIRECTORY_TYPES, isDirectoryType } from '@/lib/annuaire/types';
import { listEntriesByType } from '@/lib/annuaire/queries';
import { getDepartment } from '@/lib/annuaire/departments';
import FilteredEntryList from '@/components/annuaire/FilteredEntryList';
import PublicNavbar from '@/components/PublicNavbar';

interface Props {
  params: Promise<{ type: string }>;
}

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
      <div className="min-h-screen bg-[#fdf9f4] pt-14 lg:pt-16">
        <header className="bg-gradient-to-br from-teal-600 to-teal-700 text-white">
          <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
            <nav className="mb-6 text-teal-100 text-sm" aria-label="Fil d'Ariane">
              <Link href="/" className="hover:text-white">Accueil</Link>
              {' / '}
              <Link href="/annuaire" className="hover:text-white">Annuaire</Link>
              {' / '}
              <span className="text-white">{cfg.label}</span>
            </nav>
            <span className={`inline-block text-xs font-semibold px-2 py-1 rounded mb-3 ${cfg.accent}`}>
              {cfg.label}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {cfg.fullName}
            </h1>
            <p className="text-lg text-teal-100 max-w-3xl">
              {cfg.longDescription}
            </p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          {/* Index par département */}
          {sortedDepts.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Par département
              </h2>
              <div className="flex flex-wrap gap-2">
                {sortedDepts.map(([code, n]) => {
                  const dept = getDepartment(code);
                  return (
                    <Link
                      key={code}
                      href={`/annuaire/${type}/${code}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-teal-300 hover:text-teal-700 transition-colors"
                    >
                      <span className="font-semibold">{code}</span>
                      <span className="text-gray-500">
                        {dept ? dept.name : 'Département'}
                      </span>
                      <span className="text-xs text-gray-400">({n})</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Liste filtrable */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Tous les {cfg.plural} référencés ({entries.length})
            </h2>
            <FilteredEntryList
              entries={entries}
              emptyLabel={`Aucun ${cfg.label} ne correspond à votre filtre.`}
            />
          </section>

          {/* Source */}
          <section className="mt-10">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              Source officielle : {' '}
              <a
                href={cfg.defaultSourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="underline font-medium"
              >
                {cfg.defaultSourceLabel}
              </a>. Une donnée semble incorrecte ?{' '}
              <a
                href={`mailto:contact@neuro-care.fr?subject=Annuaire%20${cfg.label}%20%E2%80%94%20Signalement`}
                className="underline font-medium"
              >
                Signalez-le-nous
              </a>.
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
