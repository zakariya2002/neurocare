import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlogPost, getCategoryInfo } from '@/types/blog';
import {
  getProPostBySlug,
  getProPublishedPosts,
  getProPublishedSlugs,
} from '@/lib/blog/pro-actions';
import { sanitizeHtml } from '@/lib/sanitize-html';
import ProNavbar from '@/components/ProNavbar';
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
  const slugs = await getProPublishedSlugs();
  return slugs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getProPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Article non trouvé | Blog NeuroCare Pro',
      description: "L'article que vous recherchez n'existe pas ou a été supprimé.",
    };
  }

  const proUrl = `${SITE_URL}/pro/blog/${post.slug}`;
  const canonical =
    post.audience === 'both' ? `${SITE_URL}/blog/${post.slug}` : proUrl;
  const description = post.excerpt || post.title;
  const images = post.image_url ? [{ url: post.image_url }] : undefined;

  return {
    title: `${post.title} | Blog NeuroCare Pro`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: post.title,
      description,
      url: proUrl,
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

export default async function ProBlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article: BlogPost | null = await getProPostBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const relatedResult = await getProPublishedPosts({
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
      <ProNavbar />

      {/* Hero Image */}
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-200 mt-14 xl:mt-16">
        {article.image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${article.image_url}')` }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, #41005c 0%, #6b21a8 60%, #7c3aed 100%)',
            }}
          >
            <svg
              className="w-20 h-20 text-white/40"
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
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Back link */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
        <Link
          href="/pro/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: '#41005c' }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour au blog Pro
        </Link>
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <span
            className="px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium"
            style={{
              backgroundColor: `${categoryInfo.color}15`,
              color: categoryInfo.color,
            }}
          >
            {categoryInfo.label}
          </span>
          <span>{formatDate(article.published_at || article.created_at)}</span>
          <span>•</span>
          <span>{article.read_time_minutes} min de lecture</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
          {article.title}
        </h1>

        <div
          className="prose prose-sm sm:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-[#41005c]"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
        />

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
                  <p className="text-sm text-gray-500">
                    {article.author.profession_type}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: '#41005c' }}
                >
                  NC
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Equipe NeuroCare Pro
                  </p>
                  <p className="text-sm text-gray-500">
                    Experts TND pour professionnels
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <ShareButtons title={article.title} />
      </article>

      {/* Pro CTA */}
      <section
        className="py-8 sm:py-12 px-4"
        style={{
          background:
            'linear-gradient(135deg, #41005c 0%, #6b21a8 100%)',
        }}
      >
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3">
            Rejoignez NeuroCare Pro
          </h2>
          <p className="text-xs sm:text-sm text-white/85 mb-4 sm:mb-5">
            Agenda, paiement sécurisé, facturation auto. 88% reversés.
            Inscription gratuite.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
              Découvrir
            </Link>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section
          className="py-8 sm:py-12 px-4"
          style={{ backgroundColor: '#faf7ff' }}
        >
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-8">
              Articles similaires
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/pro/blog/${related.slug}`}
                  className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4"
                >
                  {related.image_url ? (
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: `url('${related.image_url}')` }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{
                        background:
                          'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)',
                      }}
                    >
                      <svg
                        className="w-8 h-8"
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
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {related.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer
        className="py-6 sm:py-8 px-4 text-center text-xs sm:text-sm text-white"
        style={{ backgroundColor: '#2a0038' }}
      >
        <p>© 2026 NeuroCare Pro. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
