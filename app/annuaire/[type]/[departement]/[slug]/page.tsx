import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/feature-flags';
import { DIRECTORY_TYPES, isDirectoryType } from '@/lib/annuaire/types';
import { getEntry, listAllSlugs } from '@/lib/annuaire/queries';
import { DEPARTMENTS, getDepartment } from '@/lib/annuaire/departments';
import PublicNavbar from '@/components/PublicNavbar';

interface Props {
  params: Promise<{ type: string; departement: string; slug: string }>;
}

export async function generateStaticParams() {
  const all = await listAllSlugs();
  return all;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, departement, slug } = await params;
  if (!isDirectoryType(type)) return {};
  const dept = getDepartment(departement);
  if (!dept) return {};

  const entry = await getEntry(type, slug);
  if (!entry) return {};

  const cfg = DIRECTORY_TYPES[type];
  const title = `${entry.name} — ${cfg.label} ${dept.name} | NeuroCare`;
  const description = entry.description
    ? entry.description.slice(0, 160)
    : `${entry.name}, ${cfg.label} situé à ${entry.city ?? dept.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://neuro-care.fr/annuaire/${type}/${departement}/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://neuro-care.fr/annuaire/${type}/${departement}/${slug}`,
    },
  };
}

export default async function AnnuaireEntryPage({ params }: Props) {
  if (!FEATURES.annuaireExterne) notFound();

  const { type, departement, slug } = await params;
  if (!isDirectoryType(type)) notFound();

  const dept = DEPARTMENTS[departement];
  if (!dept) notFound();

  const entry = await getEntry(type, slug);
  if (!entry) notFound();

  const cfg = DIRECTORY_TYPES[type];

  const orgType = type === 'mdph' ? 'GovernmentOffice' : 'MedicalOrganization';
  const fullAddress = [entry.address, entry.postal_code, entry.city]
    .filter(Boolean)
    .join(', ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': orgType,
    name: entry.name,
    description: entry.description ?? cfg.shortDescription,
    url: `https://neuro-care.fr/annuaire/${type}/${departement}/${slug}`,
    ...(entry.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: entry.address,
        postalCode: entry.postal_code ?? undefined,
        addressLocality: entry.city ?? undefined,
        addressRegion: dept.regionName,
        addressCountry: 'FR',
      },
    }),
    ...(entry.phone && { telephone: entry.phone }),
    ...(entry.email && { email: entry.email }),
    ...(entry.website && { sameAs: [entry.website] }),
    ...(entry.latitude !== null && entry.longitude !== null && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: entry.latitude,
        longitude: entry.longitude,
      },
    }),
  };

  const updatedAtLabel = (() => {
    try {
      return new Date(entry.updated_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  })();

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
              <Link href={`/annuaire/${type}/${departement}`} className="hover:text-white">{dept.name}</Link>
              {' / '}
              <span className="text-white">{entry.name}</span>
            </nav>
            <span className={`inline-block text-xs font-semibold px-2 py-1 rounded mb-3 ${cfg.accent}`}>
              {cfg.label} — {dept.name} ({dept.code})
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{entry.name}</h1>
            {entry.city && (
              <p className="text-teal-100 text-lg">{entry.city} — {dept.regionName}</p>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne principale */}
            <article className="lg:col-span-2 space-y-8">
              {entry.description && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{entry.description}</p>
                </section>
              )}

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">À propos {cfg.article === 'le CRA' || cfg.article === 'le CAMSP' ? 'du' : 'de'} {cfg.label}</h2>
                <p className="text-gray-700 leading-relaxed">{cfg.longDescription}</p>
              </section>

              {/* Carte placeholder */}
              {entry.latitude !== null && entry.longitude !== null && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Localisation</h2>
                  <div className="aspect-[16/9] bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl flex flex-col items-center justify-center p-6">
                    <svg className="w-12 h-12 text-teal-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-teal-800 font-medium mb-1">
                      Coordonnées : {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                    </p>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${entry.latitude}&mlon=${entry.longitude}&zoom=15`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm text-teal-700 underline hover:text-teal-900"
                    >
                      Ouvrir dans OpenStreetMap
                    </a>
                  </div>
                </section>
              )}

              {/* CTA pros NeuroCare */}
              <section className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Pros NeuroCare proches de cet établissement
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Trouvez un éducateur, psychologue ou orthophoniste libéral
                  certifié dans le département {dept.name}.
                </p>
                <Link
                  href={`/search?location=${encodeURIComponent(dept.name)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 transition-colors text-sm"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  Voir les pros NeuroCare en {dept.name}
                </Link>
              </section>
            </article>

            {/* Colonne contacts */}
            <aside className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Coordonnées</h2>
                {fullAddress && (
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="block text-xs uppercase tracking-wider text-gray-400 mb-0.5">Adresse</span>
                    {fullAddress}
                  </p>
                )}
                {entry.phone && (
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="block text-xs uppercase tracking-wider text-gray-400 mb-0.5">Téléphone</span>
                    <a href={`tel:${entry.phone.replace(/\s/g, '')}`} className="text-teal-700 hover:underline">
                      {entry.phone}
                    </a>
                  </p>
                )}
                {entry.email && (
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="block text-xs uppercase tracking-wider text-gray-400 mb-0.5">Email</span>
                    <a href={`mailto:${entry.email}`} className="text-teal-700 hover:underline break-all">
                      {entry.email}
                    </a>
                  </p>
                )}
                {entry.website && (
                  <p className="text-sm text-gray-700">
                    <span className="block text-xs uppercase tracking-wider text-gray-400 mb-0.5">Site web</span>
                    <a
                      href={entry.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-teal-700 hover:underline break-all"
                    >
                      {entry.website.replace(/^https?:\/\//, '')}
                    </a>
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
                <p className="font-semibold mb-1">Source officielle</p>
                {entry.source_label && entry.source_url ? (
                  <a
                    href={entry.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline"
                  >
                    {entry.source_label}
                  </a>
                ) : (
                  <a
                    href={cfg.defaultSourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline"
                  >
                    {cfg.defaultSourceLabel}
                  </a>
                )}
                {updatedAtLabel && (
                  <p className="text-xs text-amber-800 mt-2">
                    Données vérifiées le {updatedAtLabel}.
                  </p>
                )}
                <p className="mt-2">
                  <a
                    href={`mailto:contact@neuro-care.fr?subject=Annuaire%20%E2%80%94%20Signalement%20${encodeURIComponent(entry.name)}`}
                    className="underline font-medium"
                  >
                    Signaler une erreur
                  </a>
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
