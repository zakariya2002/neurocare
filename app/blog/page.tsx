'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BlogPost, getCategoryInfo } from '@/types/blog';
import { getPublishedPosts } from '@/lib/blog/actions';
import PublicNavbar from '@/components/PublicNavbar';

// Articles éditoriaux NeuroCare (statiques)
const editorialArticles = [
  {
    id: 'editorial-1',
    slug: 'preparer-consultation',
    title: 'Préparer son enfant à une première consultation',
    excerpt: 'Une première consultation avec un professionnel peut être source de stress, tant pour l\'enfant que pour les parents. Voici nos conseils pour bien la préparer.',
    category: 'daily_life',
    image_url: '/images/articles/consultation.jpg',
    read_time_minutes: 7,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-2',
    slug: 'crises-sensorielles',
    title: 'Gérer les crises sensorielles : techniques et outils pratiques',
    excerpt: 'Les crises sensorielles sont fréquentes chez les enfants TND. Comprendre leurs mécanismes permet de mieux les accompagner.',
    category: 'daily_life',
    image_url: '/images/articles/crises-sensorielles.jpg',
    read_time_minutes: 8,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-3',
    slug: 'mdph-dossier',
    title: 'MDPH : constituer son dossier efficacement',
    excerpt: 'La MDPH est un passage incontournable pour obtenir la reconnaissance du handicap. Ce guide vous accompagne pour constituer un dossier complet.',
    category: 'rights',
    image_url: '/images/articles/mdph.jpg',
    read_time_minutes: 10,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-4',
    slug: 'psychomotricien',
    title: 'Que fait un psychomotricien ? Zoom sur cette profession méconnue',
    excerpt: 'Le psychomotricien est souvent un professionnel clé dans l\'accompagnement des enfants TND. Découvrons ensemble ce métier passionnant.',
    category: 'professionals',
    image_url: '/images/articles/psychomotricien.jpg',
    read_time_minutes: 6,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-5',
    slug: 'bien-etre-aidants',
    title: 'Prendre soin de soi quand on est parent aidant',
    excerpt: 'Accompagner un enfant avec un TND est un marathon. Prendre soin de vous n\'est pas un luxe, c\'est une nécessité.',
    category: 'testimonials',
    image_url: '/images/articles/bien-etre-aidants.jpg',
    read_time_minutes: 8,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-6',
    slug: 'temoignage-famille',
    title: 'Portrait de famille : "NeuroCare a changé notre quotidien"',
    excerpt: 'Émilie et Thomas sont les parents de Théo, 7 ans, diagnostiqué TSA et TDAH. Ils nous racontent leur parcours.',
    category: 'testimonials',
    image_url: '/images/articles/temoignage-famille.jpg',
    read_time_minutes: 6,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
];

export default function BlogPage() {
  const [userType, setUserType] = useState<'educator' | 'family' | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setIsLoading(true);
    const result = await getPublishedPosts({ limit: 20 });
    // Fusionner les articles de la DB avec les articles éditoriaux
    const allArticles = [...editorialArticles, ...result.posts];
    // Trier par date de publication (plus récent en premier)
    allArticles.sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime());
    setArticles(allArticles);
    setIsLoading(false);
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: educator } = await supabase
        .from('educator_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (educator) {
        setUserType('educator');
      } else {
        setUserType('family');
      }
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar />

      {/* Hero - Plus clair que la navbar */}
      <section className="pt-20 xl:pt-22 pb-8 sm:pb-12 px-4" style={{ backgroundColor: '#0a9a9a' }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">
            Blog NeuroCare
          </h1>
          <p className="text-sm sm:text-lg text-white/80 px-2">
            Ressources, conseils et actualités pour accompagner les personnes neuro-atypiques
          </p>
          {/* Bouton Mes articles pour les professionnels */}
          {userType === 'educator' && (
            <Link
              href="/dashboard/educator/blog"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Mes articles
            </Link>
          )}
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-6 sm:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden animate-pulse">
                  <div className="h-36 sm:h-40 bg-gray-200" />
                  <div className="p-3 sm:p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Aucun article pour le moment</h3>
              <p className="text-sm text-gray-600">Les articles seront bientôt disponibles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {articles.map((article) => {
                const categoryInfo = getCategoryInfo(article.category);
                const formatDate = (dateStr: string) => {
                  return new Date(dateStr).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });
                };

                return (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    {/* Image */}
                    <div className="relative h-36 sm:h-40 bg-gray-200 overflow-hidden">
                      {article.image_url ? (
                        <div
                          className="absolute inset-0 bg-cover group-hover:scale-105 transition-transform duration-300"
                          style={{
                            backgroundImage: `url('${article.image_url}')`,
                            backgroundPosition: article.slug === 'crises-sensorielles' ? 'center 30%' : 'center'
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-200">
                          <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      )}
                      {/* Category badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: categoryInfo.color }}
                        >
                          {categoryInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 mb-1.5 sm:mb-2">
                        <span>{formatDate(article.published_at || article.created_at)}</span>
                        <span>•</span>
                        <span>{article.read_time_minutes} min</span>
                      </div>
                      <h2 className="text-sm sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-3">
                        {article.excerpt}
                      </p>
                      {/* Author */}
                      {article.author && (
                        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-xs font-medium text-teal-700">
                            {article.author.first_name[0]}
                          </div>
                          <span className="text-xs text-gray-500">
                            {article.author.first_name} {article.author.last_name}
                          </span>
                        </div>
                      )}
                      <div className="mt-2.5 sm:mt-3 flex items-center gap-2 text-xs sm:text-sm font-medium" style={{ color: '#027e7e' }}>
                        Lire l'article
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

      {/* Newsletter CTA */}
      <section className="py-8 sm:py-12 px-4 bg-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
            Restez informé
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-5 px-2">
            Recevez nos derniers articles et conseils directement dans votre boîte mail.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto px-2">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <button
              className="px-5 py-2.5 text-white font-semibold rounded-lg text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#027e7e' }}
            >
              S'abonner
            </button>
          </div>
        </div>
      </section>

      {/* Footer - Same as landing page */}
      <footer className="text-white py-6 sm:py-10 px-3 sm:px-4 md:px-6" style={{ backgroundColor: '#027e7e' }} role="contentinfo">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-5 sm:mb-8">
            {/* Logo et description */}
            <div>
              <Link href="/" className="inline-block mb-3" aria-label="Retour à l'accueil NeuroCare">
                <img
                  src="/images/logo-neurocare.svg"
                  alt="Logo NeuroCare"
                  className="h-16 brightness-0 invert"
                />
              </Link>
              <p className="text-sm leading-relaxed text-teal-100">
                La plateforme qui connecte les familles avec des professionnels du neurodéveloppement vérifiés et qualifiés.
              </p>
            </div>

            {/* Navigation */}
            <nav aria-labelledby="footer-nav-1">
              <h3 id="footer-nav-1" className="font-bold text-white mb-3">Navigation</h3>
              <ul className="space-y-2 text-sm text-teal-100">
                <li><Link href="/search" className="hover:text-white transition-colors">Trouver un professionnel</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </nav>

            {/* Familles */}
            <nav aria-labelledby="footer-nav-2">
              <h3 id="footer-nav-2" className="font-bold text-white mb-3">Familles</h3>
              <ul className="space-y-2 text-sm text-teal-100">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Créer un compte</Link></li>
                <li><Link href="/familles/aides-financieres" className="hover:text-white transition-colors">Aides financières</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </nav>

            {/* Professionnels */}
            <nav aria-labelledby="footer-nav-3">
              <h3 id="footer-nav-3" className="font-bold text-white mb-3">Professionnels</h3>
              <ul className="space-y-2 text-sm text-teal-100">
                <li><Link href="/pro" className="hover:text-white transition-colors">Espace Pro</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Rejoindre neurocare</Link></li>
              </ul>
            </nav>
          </div>

          {/* Séparateur */}
          <div className="border-t border-teal-500 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Liens légaux */}
              <nav aria-label="Informations légales">
                <div className="flex flex-wrap justify-center gap-4 text-sm text-teal-100">
                  <Link href="/mentions-legales" className="hover:text-white transition-colors" aria-label="Consulter les mentions légales">
                    Mentions légales
                  </Link>
                  <Link href="/politique-confidentialite" className="hover:text-white transition-colors" aria-label="Consulter la politique de confidentialité et RGPD">
                    Politique de confidentialité
                  </Link>
                  <Link href="/cgu" className="hover:text-white transition-colors" aria-label="Consulter les conditions générales d'utilisation">
                    CGU
                  </Link>
                </div>
              </nav>

              {/* Copyright */}
              <p className="text-sm text-teal-200">
                © 2024 neurocare. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
