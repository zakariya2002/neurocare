'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BlogPost, BlogPostStatus } from '@/types/blog';
import { getMyBlogPosts, deleteBlogPost, submitForReview } from '@/lib/blog/actions';
import BlogPostCard from '@/components/blog/BlogPostCard';
import EducatorMobileMenu from '@/components/EducatorMobileMenu';
import { useToast } from '@/components/Toast';

export default function EducatorBlogPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filter, setFilter] = useState<BlogPostStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/pro/login');
      return;
    }

    setUserId(session.user.id);

    // Get profile and posts in parallel
    const [profileResult, postsResult] = await Promise.all([
      supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single(),
      getMyBlogPosts(session.user.id, {
        status: filter === 'all' ? undefined : filter,
      }),
    ]);

    if (profileResult.data) {
      setProfile(profileResult.data);
    }

    setPosts(postsResult.posts);
    setIsLoading(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

    setDeletingId(postId);
    const result = await deleteBlogPost(postId, userId);
    if (result.success) {
      setPosts(posts.filter(p => p.id !== postId));
    } else {
      showToast(result.error || 'Erreur lors de la suppression', 'error');
    }
    setDeletingId(null);
  };

  const handleSubmit = async (postId: string) => {
    setSubmittingId(postId);
    const result = await submitForReview(postId, userId);
    if (result.success) {
      // Refresh posts
      const updatedResult = await getMyBlogPosts(userId, {
        status: filter === 'all' ? undefined : filter,
      });
      setPosts(updatedResult.posts);
    } else {
      showToast(result.error || 'Erreur lors de la soumission', 'error');
    }
    setSubmittingId(null);
  };

  const getFilterCount = (status: BlogPostStatus | 'all') => {
    if (status === 'all') return posts.length;
    return posts.filter(p => p.status === status).length;
  };

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.status === filter);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-40" style={{ backgroundColor: '#41005c' }}>
        <div className="flex items-center justify-between px-4 py-4 relative">
          <EducatorMobileMenu profile={profile} isPremium={false} onLogout={() => {}} />
          <Link href="/dashboard/educator" className="absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2">
              <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-20" />
              <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: '#f0879f' }}>
                PRO
              </span>
            </div>
          </Link>
          <div className="w-10" />
        </div>
      </nav>

      {/* Flèche retour - desktop uniquement */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors"
          aria-label="Retour à la page précédente"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs md:text-sm font-medium">Retour</span>
        </button>
      </div>

      {/* Header */}
      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6" style={{ backgroundColor: '#5a1a75' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">Mes articles</h1>
            <p className="text-white/70 text-[11px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">Partagez votre expertise avec la communauté</p>
          </div>
          <Link
            href="/dashboard/educator/blog/new"
            className="flex items-center gap-1.5 sm:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white text-[#41005c] rounded-xl font-semibold text-xs sm:text-sm hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvel article
          </Link>
        </div>
      </div>

      <div className="flex-1 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        {/* Filters */}
        <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 md:mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'draft', label: 'Brouillons' },
            { value: 'pending', label: 'En attente' },
            { value: 'published', label: 'Publiés' },
            { value: 'rejected', label: 'Refusés' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as typeof filter)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                filter === option.value
                  ? 'bg-[#41005c] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Posts list */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-3 sm:p-4 animate-pulse">
                <div className="h-32 sm:h-40 bg-gray-200 rounded-lg mb-3 sm:mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-[#41005c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
              {filter === 'all' ? 'Aucun article' : `Aucun article ${filter === 'draft' ? 'en brouillon' : filter === 'pending' ? 'en attente' : filter === 'published' ? 'publié' : 'refusé'}`}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 mb-3 sm:mb-4 md:mb-6">
              {filter === 'all'
                ? 'Commencez à rédiger votre premier article pour partager votre expertise.'
                : 'Vous n\'avez pas d\'article dans cette catégorie.'}
            </p>
            {filter === 'all' && (
              <Link
                href="/dashboard/educator/blog/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-[#41005c] text-white font-semibold rounded-xl hover:opacity-90 transition-colors text-xs sm:text-sm md:text-base"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Créer mon premier article
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {filteredPosts.map((post) => (
              <BlogPostCard
                key={post.id}
                post={post}
                showStatus
                showActions
                onDelete={handleDelete}
                onSubmit={handleSubmit}
                isDeleting={deletingId === post.id}
                isSubmitting={submittingId === post.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto" style={{ backgroundColor: '#41005c', height: '40px' }} />
    </div>
  );
}
