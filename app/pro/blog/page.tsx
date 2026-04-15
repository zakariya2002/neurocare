import Link from 'next/link';
import { getCategoryInfo } from '@/types/blog';
import { getProPublishedPosts } from '@/lib/blog/pro-actions';
import ProNavbar from '@/components/ProNavbar';
import BlogProCTA from '@/components/blog/BlogProCTA';

export const revalidate = 3600;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ProBlogPage() {
  const result = await getProPublishedPosts({ limit: 20 });
  const articles = result.posts;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf7ff' }}>
      <ProNavbar />

      {/* Hero */}
      <section
        className="pt-20 xl:pt-22 pb-8 sm:pb-12 px-4"
        style={{
          background:
            'linear-gradient(135deg, #41005c 0%, #6b21a8 60%, #7c3aed 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto text-center text-white">
          <span
            className="inline-block mb-3 px-3 py-1 text-xs font-bold rounded-full text-white"
            style={{ backgroundColor: '#f0879f' }}
          >
            ESPACE PRO
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">
            Blog NeuroCare Pro
          </h1>
          <p className="text-sm sm:text-lg text-white/85 px-2">
            Ressources, stratégies et actualités pour développer votre activité
            de professionnel TND
          </p>
          <BlogProCTA />
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-6 sm:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {articles.length === 0 ? (
            <div className="text-center py-10">
              <div
                className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#ede9fe' }}
              >
                <svg
                  className="w-7 h-7"
                  style={{ color: '#7c3aed' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Aucun article pour le moment
              </h3>
              <p className="text-sm text-gray-600">
                Les articles dédiés aux professionnels seront bientôt
                disponibles.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {articles.map((article) => {
                const categoryInfo = getCategoryInfo(article.category);
                return (
                  <Link
                    key={article.id}
                    href={`/pro/blog/${article.slug}`}
                    className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <div className="relative h-36 sm:h-40 bg-gray-200 overflow-hidden">
                      {article.image_url ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                          style={{
                            backgroundImage: `url('${article.image_url}')`,
                          }}
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{
                            background:
                              'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)',
                          }}
                        >
                          <svg
                            className="w-10 h-10"
                            style={{ color: '#7c3aed' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: categoryInfo.color }}
                        >
                          {categoryInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 mb-1.5 sm:mb-2">
                        <span>
                          {formatDate(article.published_at || article.created_at)}
                        </span>
                        <span>•</span>
                        <span>{article.read_time_minutes} min</span>
                      </div>
                      <h2 className="text-sm sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2 transition-colors line-clamp-2 group-hover:text-[#41005c]">
                        {article.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-3">
                        {article.excerpt}
                      </p>
                      {article.author && (
                        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                            style={{ backgroundColor: '#41005c' }}
                          >
                            {article.author.first_name[0]}
                          </div>
                          <span className="text-xs text-gray-500">
                            {article.author.first_name} {article.author.last_name}
                          </span>
                        </div>
                      )}
                      <div
                        className="mt-2.5 sm:mt-3 flex items-center gap-2 text-xs sm:text-sm font-medium"
                        style={{ color: '#41005c' }}
                      >
                        Lire l'article
                        <svg
                          className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA inscription */}
      <section
        className="py-8 sm:py-12 px-4"
        style={{
          background:
            'linear-gradient(135deg, #41005c 0%, #6b21a8 100%)',
        }}
      >
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3">
            Prêt à développer votre activité ?
          </h2>
          <p className="text-xs sm:text-sm text-white/85 mb-4 sm:mb-5 px-2">
            Rejoignez des centaines de pros TND sur NeuroCare. Inscription
            gratuite, 1ers RDV en 7 jours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-2">
            <Link
              href="/auth/register-educator"
              className="px-5 py-2.5 font-semibold rounded-lg text-sm transition-opacity hover:opacity-90 text-white"
              style={{ backgroundColor: '#f0879f' }}
            >
              S'inscrire gratuitement
            </Link>
            <Link
              href="/pro"
              className="px-5 py-2.5 font-semibold rounded-lg text-sm transition-colors text-white border border-white/30 hover:bg-white/10"
            >
              Découvrir NeuroCare Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="text-white py-6 sm:py-10 px-3 sm:px-4 md:px-6"
        style={{ backgroundColor: '#2a0038' }}
        role="contentinfo"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-5 sm:mb-8">
            <div>
              <Link
                href="/pro"
                className="inline-block mb-3"
                aria-label="Retour à l'accueil NeuroCare Pro"
              >
                <img
                  src="/images/logo-neurocare.svg"
                  alt="Logo NeuroCare Pro"
                  className="h-16 brightness-0 invert"
                />
              </Link>
              <p className="text-sm leading-relaxed text-purple-100">
                La plateforme n°1 des professionnels du neurodéveloppement.
              </p>
            </div>

            <nav aria-labelledby="pro-footer-nav-1">
              <h3 id="pro-footer-nav-1" className="font-bold text-white mb-3">
                Navigation
              </h3>
              <ul className="space-y-2 text-sm text-purple-100">
                <li>
                  <Link href="/pro" className="hover:text-white transition-colors">
                    Accueil Pro
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pro/devenir-liberal"
                    className="hover:text-white transition-colors"
                  >
                    Devenir libéral
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pro/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog Pro
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pro/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-labelledby="pro-footer-nav-2">
              <h3 id="pro-footer-nav-2" className="font-bold text-white mb-3">
                Ressources
              </h3>
              <ul className="space-y-2 text-sm text-purple-100">
                <li>
                  <Link
                    href="/pro/sap-accreditation"
                    className="hover:text-white transition-colors"
                  >
                    Guide SAP
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pro/how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    Comment ça marche
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pro/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Tarifs
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-labelledby="pro-footer-nav-3">
              <h3 id="pro-footer-nav-3" className="font-bold text-white mb-3">
                Espace Aidant
              </h3>
              <ul className="space-y-2 text-sm text-purple-100">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Accueil famille
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white transition-colors">
                    Blog famille
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="border-t border-purple-800 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <nav aria-label="Informations légales">
                <div className="flex flex-wrap justify-center gap-4 text-sm text-purple-100">
                  <Link
                    href="/mentions-legales"
                    className="hover:text-white transition-colors"
                  >
                    Mentions légales
                  </Link>
                  <Link
                    href="/politique-confidentialite"
                    className="hover:text-white transition-colors"
                  >
                    Politique de confidentialité
                  </Link>
                  <Link href="/cgu" className="hover:text-white transition-colors">
                    CGU
                  </Link>
                </div>
              </nav>

              <p className="text-sm text-purple-200">
                © 2026 NeuroCare Pro. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
