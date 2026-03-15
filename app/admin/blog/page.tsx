'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BlogPost, getCategoryInfo } from '@/types/blog';
import { getPendingPosts, getPostForAdmin, approvePost, rejectPost } from '@/lib/blog/actions';
import BlogStatusBadge from '@/components/blog/BlogStatusBadge';
import { sanitizeHtml } from '@/lib/sanitize-html';

export default function AdminBlogPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }
    await fetchPosts();
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    const result = await getPendingPosts();
    setPosts(result.posts);
    setIsLoading(false);
  };

  const handleViewPost = async (postId: string) => {
    const post = await getPostForAdmin(postId);
    setSelectedPost(post);
  };

  const handleApprove = (postId: string) => {
    setActionError('');
    startTransition(async () => {
      const result = await approvePost(postId);
      if (result.success) {
        await fetchPosts();
        setSelectedPost(null);
      } else {
        setActionError(result.error || 'Erreur lors de l\'approbation');
      }
    });
  };

  const handleReject = () => {
    if (!selectedPost || !rejectReason.trim()) {
      setActionError('Veuillez fournir un motif de refus');
      return;
    }

    setActionError('');
    startTransition(async () => {
      const result = await rejectPost(selectedPost.id, rejectReason);
      if (result.success) {
        await fetchPosts();
        setSelectedPost(null);
        setShowRejectModal(false);
        setRejectReason('');
      } else {
        setActionError(result.error || 'Erreur lors du refus');
      }
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900">Modération des articles</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{posts.length} article(s) en attente</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#41005c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl md:rounded-2xl p-6 sm:p-8 md:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucun article en attente</h2>
            <p className="text-gray-600">Tous les articles ont été traités.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Posts list */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Articles en attente</h2>
              {posts.map((post) => {
                const categoryInfo = getCategoryInfo(post.category);
                return (
                  <div
                    key={post.id}
                    onClick={() => handleViewPost(post.id)}
                    className={`bg-white rounded-xl p-3 sm:p-4 shadow-sm border-2 cursor-pointer transition-all ${
                      selectedPost?.id === post.id
                        ? 'border-[#41005c]'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${categoryInfo.color}15`, color: categoryInfo.color }}
                          >
                            {categoryInfo.label}
                          </span>
                          <BlogStatusBadge status={post.status} />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{post.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.excerpt}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {post.author && (
                            <>
                              <span className="font-medium">
                                {post.author.first_name} {post.author.last_name}
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Preview panel */}
            <div className="lg:sticky lg:top-24 h-fit">
              {selectedPost ? (
                <div className="bg-white rounded-xl md:rounded-2xl shadow-sm overflow-hidden">
                  {/* Preview header */}
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Aperçu de l'article</h2>
                  </div>

                  {/* Image */}
                  {selectedPost.image_url && (
                    <img
                      src={selectedPost.image_url}
                      alt=""
                      className="w-full h-48 object-cover"
                    />
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{selectedPost.title}</h3>

                    {/* Author info */}
                    {selectedPost.author && (
                      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-[#41005c] flex items-center justify-center text-white font-bold">
                          {selectedPost.author.first_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedPost.author.first_name} {selectedPost.author.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{selectedPost.author.profession_type}</p>
                        </div>
                      </div>
                    )}

                    {/* Content preview */}
                    <div
                      className="prose prose-sm max-w-none mb-4 max-h-64 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedPost.content) }}
                    />

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                      <span>{selectedPost.read_time_minutes} min de lecture</span>
                      <span>•</span>
                      <span>{formatDate(selectedPost.created_at)}</span>
                    </div>

                    {/* Error message */}
                    {actionError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {actionError}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={isPending}
                        className="flex-1 px-4 py-3 text-red-600 bg-red-50 rounded-xl font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => handleApprove(selectedPost.id)}
                        disabled={isPending}
                        className="flex-1 px-4 py-3 text-white bg-green-600 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isPending ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approuver
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Sélectionnez un article pour voir l'aperçu</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl md:rounded-2xl max-w-md w-full p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Refuser l'article</h3>
            <p className="text-sm text-gray-600 mb-4">
              Expliquez à l'auteur pourquoi son article est refusé pour qu'il puisse le corriger.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motif du refus..."
              rows={4}
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm rounded-xl border border-gray-200 focus:border-[#41005c] focus:ring-2 focus:ring-purple-100 transition-all resize-none mb-3 sm:mb-4"
            />
            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                {actionError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setActionError('');
                }}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={isPending || !rejectReason.trim()}
                className="flex-1 px-4 py-3 text-white bg-red-600 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Confirmer le refus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
