'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommunityPost, PostCategory, PostsQueryParams } from '@/types/community';
import { getPosts } from '@/lib/community/actions';
import PostCard from './PostCard';
import CategoryFilter from './CategoryFilter';
import AuthPromptModal from './AuthPromptModal';
import Link from 'next/link';

interface CommunityFeedProps {
  initialPosts?: CommunityPost[];
  initialTotal?: number;
  showCreateButton?: boolean;
  isAuthenticated?: boolean;
  className?: string;
}

export default function CommunityFeed({
  initialPosts = [],
  initialTotal = 0,
  showCreateButton = true,
  isAuthenticated = false,
  className = ''
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [category, setCategory] = useState<PostCategory | undefined>();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'comments'>('recent');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(Math.ceil(initialTotal / 10));
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchPosts = useCallback(async (params: PostsQueryParams) => {
    setIsLoading(true);
    try {
      const result = await getPosts(params);
      setPosts(result.posts);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Skip initial fetch if we have initial posts and no filters
    if (initialPosts.length > 0 && !category && !search && page === 1 && sortBy === 'recent') {
      return;
    }
    fetchPosts({ category, search, page, sortBy });
  }, [category, search, page, sortBy, fetchPosts, initialPosts.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts({ category, search, page: 1, sortBy });
  };

  return (
    <div className={className}>
      {/* Header with search and create button */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>
        {showCreateButton ? (
          <Link
            href="/communaute/new"
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
            style={{ backgroundColor: '#027e7e' }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline">Créer un post</span>
            <span className="xs:hidden">Publier</span>
          </Link>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
            style={{ backgroundColor: '#027e7e' }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline">Créer un post</span>
            <span className="xs:hidden">Publier</span>
          </button>
        )}
      </div>

      {/* Category filters */}
      <CategoryFilter
        selected={category}
        onChange={(cat) => {
          setCategory(cat);
          setPage(1);
        }}
        className="mb-4 sm:mb-6"
      />

      {/* Sort options */}
      <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
        <span className="text-xs sm:text-sm text-gray-500">Trier par:</span>
        <div className="flex gap-1">
          {[
            { value: 'recent', label: 'Récents' },
            { value: 'popular', label: 'Populaires' },
            { value: 'comments', label: 'Commentés' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setSortBy(option.value as typeof sortBy);
                setPage(1);
              }}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                sortBy === option.value
                  ? 'bg-teal-100 text-teal-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-3/4 h-5 bg-gray-200 rounded mb-3"></div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-gray-200 rounded"></div>
                <div className="w-5/6 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun post trouvé</h3>
          <p className="text-gray-500 mb-6">
            {search || category
              ? 'Aucun post ne correspond à votre recherche.'
              : 'Soyez le premier à partager quelque chose avec la communauté !'}
          </p>
          {showCreateButton && (
            <Link
              href="/communaute/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer le premier post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onAuthRequired={!isAuthenticated ? () => setShowAuthModal(true) : undefined}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Précédent</span>
            <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Suivant</span>
            <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
