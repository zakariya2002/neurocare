import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/feature-flags';
import {
  DIRECTORY_TYPES,
  isDirectoryType,
  type DirectoryType,
} from '@/lib/annuaire/types';
import { getEntry, listAllSlugs } from '@/lib/annuaire/queries';
import { DEPARTMENTS, getDepartment } from '@/lib/annuaire/departments';
import PublicNavbar from '@/components/PublicNavbar';

interface Props {
  params: Promise<{ type: string; departement: string; slug: string }>;
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
  const style = TYPE_STYLES[type];

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

  const phoneClean = entry.phone ? entry.phone.replace(/\s/g, '') : null;

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
              <Link href={`/annuaire/${type}/${departement}`} className="hover:text-white">{dept.name}</Link>
              <span className="mx-2 opacity-60">/</span>
              <span className="text-white font-medium truncate">{entry.name}</span>
            </nav>

            <div className="flex items-start gap-3 sm:gap-4 mb-2">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={style.iconPath} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-block text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md mb-2"
                  style={{ backgroundColor: style.bg, color: style.color }}
                >
                  {cfg.label} · {dept.name} ({dept.code})
                </span>
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1.5 leading-tight"
                  style={{ fontFamily: 'Verdana, sans-serif' }}
                >
                  {entry.name}
                </h1>
                {entry.city && (
                  <p className="text-teal-100 text-sm sm:text-base flex items-center gap-1.5">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {entry.city} — {dept.regionName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Colonne principale */}
            <article className="lg:col-span-2 space-y-6">
              {/* Carte placeholder mobile (en haut) */}
              {entry.latitude !== null && entry.longitude !== null && (
                <section
                  className="lg:hidden bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  aria-label="Localisation"
                >
                  <div
                    className="aspect-[16/9] flex flex-col items-center justify-center p-6"
                    style={{
                      background:
                        'linear-gradient(135deg, #e6f4f4 0%, #c9eaea 100%)',
                    }}
                  >
                    <svg className="w-10 h-10 mb-2" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-xs font-medium mb-1" style={{ color: '#015c5c' }}>
                      {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                    </p>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${entry.latitude}&mlon=${entry.longitude}&zoom=15`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-xs underline"
                      style={{ color: '#015c5c' }}
                    >
                      Ouvrir dans OpenStreetMap
                    </a>
                  </div>
                </section>
              )}

              {/* Actions de contact */}
              {(entry.phone || entry.email || entry.website) && (
                <section className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-5 sm:p-6">
                  <h2
                    className="text-base sm:text-lg font-bold text-gray-900 mb-4"
                    style={{ fontFamily: 'Verdana, sans-serif' }}
                  >
                    Contacter cet établissement
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {phoneClean && (
                      <a
                        href={`tel:${phoneClean}`}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 hover:shadow-md transition-all shadow-sm"
                        style={{ backgroundColor: '#027e7e' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Appeler
                      </a>
                    )}
                    {entry.email && (
                      <a
                        href={`mailto:${entry.email}`}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:border-[#027e7e]/40 hover:text-[#027e7e] transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Écrire
                      </a>
                    )}
                    {entry.website && (
                      <a
                        href={entry.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:border-[#027e7e]/40 hover:text-[#027e7e] transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                        </svg>
                        Site web
                      </a>
                    )}
                  </div>
                </section>
              )}

              {entry.description && (
                <section className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-5 sm:p-6">
                  <h2
                    className="text-base sm:text-lg font-bold text-gray-900 mb-3"
                    style={{ fontFamily: 'Verdana, sans-serif' }}
                  >
                    Description
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {entry.description}
                  </p>
                </section>
              )}

              <section className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-5 sm:p-6">
                <h2
                  className="text-base sm:text-lg font-bold text-gray-900 mb-3"
                  style={{ fontFamily: 'Verdana, sans-serif' }}
                >
                  À propos {cfg.article === 'le CRA' || cfg.article === 'le CAMSP' ? 'du' : 'de'} {cfg.label}
                </h2>
                <p className="text-gray-700 leading-relaxed">{cfg.longDescription}</p>
              </section>

              {/* CTA pros NeuroCare */}
              <section
                className="rounded-xl md:rounded-2xl shadow-sm overflow-hidden p-5 sm:p-6"
                style={{ backgroundColor: '#e6f4f4', border: '1px solid #c9eaea' }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'white' }}
                    aria-hidden="true"
                  >
                    <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2
                      className="text-base sm:text-lg font-bold mb-1"
                      style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
                    >
                      Pros NeuroCare proches
                    </h2>
                    <p className="text-sm text-gray-700">
                      Trouvez un éducateur, psychologue ou orthophoniste libéral
                      certifié dans le département {dept.name}.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/search?location=${encodeURIComponent(dept.name)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl hover:opacity-90 hover:shadow-md transition-all shadow-sm text-sm"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  Voir les pros NeuroCare en {dept.name}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </section>
            </article>

            {/* Sidebar */}
            <aside className="space-y-4">
              {/* Carte placeholder desktop */}
              {entry.latitude !== null && entry.longitude !== null && (
                <div
                  className="hidden lg:block bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  aria-label="Localisation"
                >
                  <div
                    className="aspect-square flex flex-col items-center justify-center p-6"
                    style={{
                      background:
                        'linear-gradient(135deg, #e6f4f4 0%, #c9eaea 100%)',
                    }}
                  >
                    <svg className="w-12 h-12 mb-2" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-xs font-medium" style={{ color: '#015c5c' }}>
                      {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                    </p>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${entry.latitude}&mlon=${entry.longitude}&zoom=15`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-xs mt-2 underline"
                      style={{ color: '#015c5c' }}
                    >
                      Ouvrir dans OpenStreetMap
                    </a>
                  </div>
                </div>
              )}

              {/* Coordonnées détaillées */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-5">
                <h2
                  className="font-bold text-gray-900 mb-4"
                  style={{ fontFamily: 'Verdana, sans-serif' }}
                >
                  Coordonnées
                </h2>
                <ul className="space-y-3.5">
                  {fullAddress && (
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                          Adresse
                        </p>
                        <p className="text-sm text-gray-700 break-words">{fullAddress}</p>
                      </div>
                    </li>
                  )}
                  {entry.phone && phoneClean && (
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                          Téléphone
                        </p>
                        <a
                          href={`tel:${phoneClean}`}
                          className="text-sm font-medium hover:underline"
                          style={{ color: '#027e7e' }}
                        >
                          {entry.phone}
                        </a>
                      </div>
                    </li>
                  )}
                  {entry.email && (
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                          Email
                        </p>
                        <a
                          href={`mailto:${entry.email}`}
                          className="text-sm font-medium hover:underline break-all"
                          style={{ color: '#027e7e' }}
                        >
                          {entry.email}
                        </a>
                      </div>
                    </li>
                  )}
                  {entry.website && (
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                          Site web
                        </p>
                        <a
                          href={entry.website}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-sm font-medium hover:underline break-all"
                          style={{ color: '#027e7e' }}
                        >
                          {entry.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </li>
                  )}
                </ul>
              </div>

              {/* Source officielle */}
              <div
                className="rounded-xl md:rounded-2xl shadow-sm border overflow-hidden p-5 text-sm"
                style={{ backgroundColor: '#fef9c3', borderColor: '#fde68a', color: '#78350f' }}
              >
                <p className="font-semibold mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Source officielle
                </p>
                {entry.source_label && entry.source_url ? (
                  <a
                    href={entry.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline font-medium break-words"
                  >
                    {entry.source_label}
                  </a>
                ) : (
                  <a
                    href={cfg.defaultSourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline font-medium break-words"
                  >
                    {cfg.defaultSourceLabel}
                  </a>
                )}
                {updatedAtLabel && (
                  <p className="text-xs mt-2 opacity-80">
                    Vérifiées le {updatedAtLabel}
                  </p>
                )}
                <p className="mt-3 pt-3 border-t border-amber-200">
                  <a
                    href={`mailto:contact@neuro-care.fr?subject=Annuaire%20%E2%80%94%20Signalement%20${encodeURIComponent(entry.name)}`}
                    className="underline font-medium inline-flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
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
