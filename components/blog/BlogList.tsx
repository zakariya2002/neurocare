'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BLOG_CATEGORIES, BlogCategory, getCategoryInfo } from '@/types/blog';

interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory | string;
  image_url?: string | null;
  read_time_minutes: number;
  published_at?: string | null;
  created_at: string;
  tags?: string[];
  author?: {
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
  } | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogList({ articles }: { articles: BlogArticle[] }) {
  const [activeCategory, setActiveCategory] = useState<'all' | BlogCategory>('all');

  const availableCategories = useMemo(() => {
    const used = new Set(articles.map((a) => a.category as BlogCategory));
    return BLOG_CATEGORIES.filter((c) => used.has(c.value));
  }, [articles]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return articles;
    return articles.filter((a) => a.category === activeCategory);
  }, [articles, activeCategory]);

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">Aucun article pour le moment</h3>
        <p className="text-sm text-gray-600">Les articles seront bientôt disponibles.</p>
      </div>
    );
  }

  return (
    <>
      {/* Filtres catégories */}
      <div className="mb-6 sm:mb-8" role="tablist" aria-label="Filtrer par catégorie">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === 'all'
                ? 'bg-[#027e7e] text-white border-[#027e7e]'
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#027e7e] hover:text-[#027e7e]'
            }`}
          >
            Tous
          </button>
          {availableCategories.map((cat) => {
            const active = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active ? 'text-white' : 'bg-white text-gray-700 border-gray-200 hover:text-white'
                }`}
                style={
                  active
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : { ['--hover-bg' as string]: cat.color }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = cat.color;
                    e.currentTarget.style.borderColor = cat.color;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.borderColor = '';
                  }
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste articles */}
      <ul className="space-y-4 sm:space-y-5">
        {filtered.map((article) => {
          const categoryInfo = getCategoryInfo(article.category as BlogCategory);
          return (
            <li key={article.id}>
              <Link
                href={`/blog/${article.slug}`}
                className="group flex flex-col sm:flex-row bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Contenu texte (gauche sur desktop) */}
                <div className="flex-1 p-4 sm:p-6 flex flex-col order-2 sm:order-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className="px-2.5 py-0.5 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: categoryInfo.color }}
                    >
                      {categoryInfo.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(article.published_at || article.created_at)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{article.read_time_minutes} min</span>
                  </div>

                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#027e7e] transition-colors line-clamp-2">
                    {article.title}
                  </h2>

                  <p className="text-sm text-gray-600 line-clamp-2 sm:line-clamp-3 mb-3">
                    {article.excerpt}
                  </p>

                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {article.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    {article.author && (
                      <span className="text-xs text-gray-500 truncate">
                        Par {article.author.first_name} {article.author.last_name}
                      </span>
                    )}
                    <span
                      className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold"
                      style={{ color: '#027e7e' }}
                    >
                      Lire la suite
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Miniature (droite sur desktop, haut sur mobile) */}
                <div className="relative sm:w-56 lg:w-72 sm:flex-shrink-0 h-44 sm:h-auto order-1 sm:order-2 bg-gray-200">
                  {article.image_url ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{
                        backgroundImage: `url('${article.image_url}')`,
                        backgroundPosition:
                          article.slug === 'crises-sensorielles' ? 'center 30%' : 'center',
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-200">
                      <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-gray-500 mt-8">
          Aucun article dans cette catégorie pour le moment.
        </p>
      )}
    </>
  );
}
