import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { BlogPost, getCategoryInfo } from '@/types/blog';
import { getPostBySlug, getPublishedPosts } from '@/lib/blog/actions';
import { sanitizeHtml } from '@/lib/sanitize-html';
import ShareButtons from '@/components/blog/ShareButtons';
import ViewCounter from '@/components/blog/ViewCounter';

export const revalidate = 3600;

const SITE_URL = 'https://neuro-care.fr';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function generateStaticParams() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('status', 'published');

    return (data || []).map((p) => ({ slug: p.slug as string }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Article non trouvé | NeuroCare',
      description: "L'article que vous recherchez n'existe pas ou a été supprimé.",
    };
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const description = post.excerpt || post.title;
  const images = post.image_url ? [{ url: post.image_url }] : undefined;

  return {
    title: `${post.title} | Blog NeuroCare`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description,
      url,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.image_url ? [post.image_url] : undefined,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article: BlogPost | null = await getPostBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const relatedResult = await getPublishedPosts({
    category: article.category,
    limit: 3,
  });
  const relatedArticles = relatedResult.posts
    .filter((p) => p.id !== article.id)
    .slice(0, 2);

  const categoryInfo = getCategoryInfo(article.category);

  return (
    <div className="min-h-screen bg-white">
      <ViewCounter postId={article.id} />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2">
              <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-7 sm:h-8" />
            </Link>
            <Link
              href="/blog"
              className="text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Retour au blog</span>
              <span className="sm:hidden">Blog</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-200">
        {article.image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${article.image_url}')` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-200">
            <svg className="w-20 h-20 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <span
            className="px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium"
            style={{ backgroundColor: `${categoryInfo.color}15`, color: categoryInfo.color }}
          >
            {categoryInfo.label}
          </span>
          <span>{formatDate(article.published_at || article.created_at)}</span>
          <span>•</span>
          <span>{article.read_time_minutes} min de lecture</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
          {article.title}
        </h1>

        {article.tags && article.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 mb-6 sm:mb-8" aria-label="Tags de l'article">
            {article.tags.map((tag) => (
              <li key={tag}>
                <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                  #{tag}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div
          className="prose prose-sm sm:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-teal-600"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
        />

        {/* Lien vers glossaire */}
        <div className="mt-10 p-4 rounded-xl bg-teal-50 border border-teal-100 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <div className="text-sm text-gray-700">
            Un sigle ou un terme vous échappe ?
            <Link href="/glossaire" className="ml-1 font-semibold hover:underline" style={{ color: '#027e7e' }}>
              Consultez notre glossaire TND
            </Link>
            .
          </div>
        </div>

        {/* Author */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center gap-4">
            {article.author ? (
              <>
                {article.author.avatar_url ? (
                  <img
                    src={article.author.avatar_url}
                    alt={`${article.author.first_name} ${article.author.last_name}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: '#41005c' }}
                  >
                    {article.author.first_name[0]}
                    {article.author.last_name[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {article.author.first_name} {article.author.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{article.author.profession_type}</p>
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  NC
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Equipe NeuroCare</p>
                  <p className="text-sm text-gray-500">
                    Experts en accompagnement des personnes neuro-atypiques
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <ShareButtons title={article.title} />
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-gray-50 py-8 sm:py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-8">
              Articles similaires
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4"
                >
                  {related.image_url ? (
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: `url('${related.image_url}')` }}
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gradient-to-br from-teal-100 to-teal-200 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{related.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="py-6 sm:py-8 px-4 text-center text-gray-500 text-xs sm:text-sm">
        <p>© 2024 NeuroCare. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
