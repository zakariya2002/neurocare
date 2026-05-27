'use client';

import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';

type TocEntry = { id: string; label: string };

interface Props {
  title: string;
  subtitle?: string;
  effectiveDate: string;
  toc?: TocEntry[];
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, subtitle, effectiveDate, toc, children }: Props) {
  const hasToc = !!toc && toc.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar />

      <section className="pt-24 sm:pt-28 pb-6 px-4">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-teal-700 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l'accueil
          </Link>
          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900"
            style={{ fontFamily: 'Verdana, sans-serif' }}
          >
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-gray-600 max-w-3xl">{subtitle}</p>}
          <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-white/60 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#027e7e' }} aria-hidden="true" />
            Entrée en vigueur : {effectiveDate}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {hasToc && (
          <aside className="hidden lg:block lg:col-span-1">
            <nav
              className="sticky top-24 bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
              aria-label="Sommaire"
            >
              <p className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-3">Sommaire</p>
              <ul className="space-y-2 text-sm">
                {toc!.map((entry) => (
                  <li key={entry.id}>
                    <a
                      href={`#${entry.id}`}
                      className="text-gray-700 hover:text-teal-700 transition-colors block py-0.5"
                    >
                      {entry.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        <article
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 ${
            hasToc ? 'lg:col-span-3' : 'lg:col-span-4'
          }`}
        >
          <div className="prose prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:scroll-mt-24 prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2 prose-h3:scroll-mt-24 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-teal-700 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:my-3 prose-li:my-1 prose-table:text-sm">
            {children}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 text-xs text-gray-500">
            <p>
              Document mis à jour le {effectiveDate}. Pour toute question juridique : {' '}
              <a href="mailto:contact@neuro-care.fr" className="text-teal-700 hover:underline">
                contact@neuro-care.fr
              </a>
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
