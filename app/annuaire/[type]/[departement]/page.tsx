import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/feature-flags';
import { DIRECTORY_TYPES, isDirectoryType } from '@/lib/annuaire/types';
import { listEntriesByTypeAndDepartment } from '@/lib/annuaire/queries';
import { getDepartment, DEPARTMENTS } from '@/lib/annuaire/departments';
import EntryCard from '@/components/annuaire/EntryCard';
import PublicNavbar from '@/components/PublicNavbar';

interface Props {
  params: Promise<{ type: string; departement: string }>;
}

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
      <div className="min-h-screen bg-[#fdf9f4] pt-14 lg:pt-16">
        <header className="bg-gradient-to-br from-teal-600 to-teal-700 text-white">
          <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
            <nav className="mb-5 text-teal-100 text-sm" aria-label="Fil d'Ariane">
              <Link href="/" className="hover:text-white">Accueil</Link>
              {' / '}
              <Link href="/annuaire" className="hover:text-white">Annuaire</Link>
              {' / '}
              <Link href={`/annuaire/${type}`} className="hover:text-white">{cfg.label}</Link>
              {' / '}
              <span className="text-white">{dept.name}</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              {cfg.label} dans le département {dept.name} ({dept.code})
            </h1>
            <p className="text-teal-100 text-lg">
              {dept.regionName} — {entries.length} {cfg.label} référencé{entries.length > 1 ? 's' : ''}
            </p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          {entries.length === 0 ? (
            <section className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun {cfg.label} référencé pour {dept.name}
              </h2>
              <p className="text-gray-600 mb-6">
                Cette page sera enrichie au fil de l'ingestion des données
                officielles. En attendant, vous pouvez consulter la liste
                complète des {cfg.plural} en France ou un département limitrophe.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href={`/annuaire/${type}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  Voir tous les {cfg.plural}
                </Link>
                <a
                  href={cfg.defaultSourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-teal-600 text-teal-700 font-semibold rounded-lg hover:bg-teal-50 transition-colors"
                >
                  Source officielle ({cfg.defaultSourceLabel})
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
          <section className="mt-12 bg-white rounded-2xl p-6 sm:p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Professionnels libéraux NeuroCare en {dept.name}
            </h2>
            <p className="text-gray-600 mb-4">
              Une fois orienté par {cfg.article}, vous pouvez retrouver un
              éducateur, psychologue ou orthophoniste libéral certifié dans
              votre département.
            </p>
            <Link
              href={`/search?location=${encodeURIComponent(dept.name)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#027e7e' }}
            >
              Voir les pros NeuroCare en {dept.name}
            </Link>
          </section>

          {/* Source */}
          <section className="mt-8">
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
                href={`mailto:contact@neuro-care.fr?subject=Annuaire%20${cfg.label}%20${dept.code}%20%E2%80%94%20Signalement`}
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
