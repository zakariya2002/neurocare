'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CommunityPost, CATEGORY_INFO, REACTION_INFO } from '@/types/community';
import { getRecentPosts } from '@/lib/community/actions';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CommunityPreviewProps {
  className?: string;
}

// Mini post card for the preview
function MiniPostCard({ post }: { post: CommunityPost }) {
  const categoryInfo = CATEGORY_INFO[post.category];
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: fr
  });

  const authorName = post.is_anonymous
    ? post.anonymous_name || 'Anonyme'
    : post.author
      ? `${post.author.first_name}${post.author.last_name ? ` ${post.author.last_name.charAt(0)}.` : ''}`
      : 'Utilisateur';

  const totalReactions = post.reactions_count.utile + post.reactions_count.soutien + post.reactions_count.merci;

  return (
    <Link
      href={`/community/post/${post.id}`}
      className="block bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all duration-200 group"
    >
      {/* Category badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
          {categoryInfo.label}
        </span>
        <span className="text-xs text-gray-400">{timeAgo}</span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
        {post.title}
      </h3>

      {/* Content preview */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
        {post.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {/* Author */}
          <span className="flex items-center gap-1">
            {post.is_anonymous ? (
              <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
            ) : (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                post.author_role === 'educator' ? 'bg-primary/20 text-primary' : 'bg-teal-100 text-teal-700'
              }`}>
                {post.author?.first_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
            <span className="font-medium text-gray-700">{authorName}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Reactions */}
          {totalReactions > 0 && (
            <span className="flex items-center gap-1">
              <span className="text-sm">
                {post.reactions_count.utile > 0 && REACTION_INFO.utile.icon}
                {post.reactions_count.soutien > 0 && REACTION_INFO.soutien.icon}
                {post.reactions_count.merci > 0 && REACTION_INFO.merci.icon}
              </span>
              {totalReactions}
            </span>
          )}
          {/* Comments */}
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.comments_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CommunityPreview({ className = '' }: CommunityPreviewProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const recentPosts = await getRecentPosts(4);
        setPosts(recentPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Show placeholder cards during loading
  if (loading) {
    return (
      <section className={`py-16 bg-[#fdf9f4] ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-10 mb-10">
            <div className="flex justify-center lg:justify-start flex-shrink-0 mb-4 lg:mb-0">
              <Image src="/images/pictos/picto-03.png" alt="" aria-hidden="true" width={200} height={200} className="w-36 h-36 lg:w-48 lg:h-48 object-contain" />
            </div>
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Échangez avec la communauté</h2>
              <p className="text-base text-gray-500">Un espace d&apos;échange et de soutien pour les familles et professionnels</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
                <div className="w-20 h-6 bg-gray-200 rounded-full mb-3"></div>
                <div className="w-3/4 h-5 bg-gray-200 rounded mb-2"></div>
                <div className="w-full h-4 bg-gray-200 rounded mb-1"></div>
                <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 bg-[#fdf9f4] ${className}`} id="communaute">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-10 mb-10">
          {/* Picto — visible partout, grand */}
          <div className="flex justify-center lg:justify-start flex-shrink-0 mb-4 lg:mb-0">
            <Image src="/images/pictos/picto-03.png" alt="" aria-hidden="true" width={200} height={200} className="w-36 h-36 lg:w-48 lg:h-48 object-contain" />
          </div>
          <div className="text-center lg:text-left flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Échangez avec la communauté
            </h2>
            <p className="text-base text-gray-500 max-w-xl">
              Partagez vos expériences, posez vos questions et trouvez du soutien auprès d&apos;autres familles et professionnels
            </p>
          </div>
          <div className="hidden lg:flex flex-shrink-0 items-center">
            <Link href="/community" className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg text-sm transition-all hover:opacity-90" style={{ backgroundColor: '#027e7e' }}>
              Rejoindre
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>

        {/* Posts grid */}
        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {posts.map((post) => (
              <MiniPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl mb-10">
            <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              La communauté démarre bientôt !
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Soyez parmi les premiers à rejoindre notre espace d'échange et de soutien
            </p>
          </div>
        )}

        {/* CTA mobile only (desktop CTA is in the header) */}
        <div className="text-center lg:hidden">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: '#027e7e' }}
          >
            Rejoindre la communauté
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
