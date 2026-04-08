'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogPost, getCategoryInfo } from '@/types/blog';
import { getPendingPosts, getPostForAdmin, approvePost, rejectPost } from '@/lib/blog/actions';
import BlogStatusBadge from '@/components/blog/BlogStatusBadge';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Card, Button, Badge } from '@/components/admin/ui';

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
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark">
            Modération des articles
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
            Articles soumis par les professionnels en attente de validation
          </p>
        </div>
        <span className="text-sm text-gray-500 dark:text-admin-muted-dark">
          {posts.length} article{posts.length > 1 ? 's' : ''} en attente
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-200 border-t-primary-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark mb-1">
              Aucun article en attente
            </h3>
            <p className="text-sm text-gray-500 dark:text-admin-muted-dark">
              Tous les articles ont été traités.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Posts list */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-admin-muted-dark">
              Articles en attente
            </h2>
            {posts.map((post) => {
              const categoryInfo = getCategoryInfo(post.category);
              const isSelected = selectedPost?.id === post.id;
              return (
                <button
                  key={post.id}
                  onClick={() => handleViewPost(post.id)}
                  className={`w-full text-left bg-white dark:bg-admin-surface-dark rounded-xl p-4 border transition-colors ${
                    isSelected
                      ? 'border-primary-500 dark:border-primary-400'
                      : 'border-gray-200 dark:border-admin-border-dark hover:border-gray-300 dark:hover:border-admin-surface-dark-2'
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="purple">{categoryInfo.label}</Badge>
                        <BlogStatusBadge status={post.status} />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark mb-1 line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-admin-muted-dark line-clamp-2 mb-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-admin-muted-dark">
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
                </button>
              );
            })}
          </div>

          {/* Preview panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            {selectedPost ? (
              <Card padding="none" className="overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200 dark:border-admin-border-dark">
                  <h2 className="font-semibold text-gray-900 dark:text-admin-text-dark">
                    Aperçu de l&apos;article
                  </h2>
                </div>

                {selectedPost.image_url && (
                  <img
                    src={selectedPost.image_url}
                    alt=""
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-admin-text-dark mb-3">
                    {selectedPost.title}
                  </h3>

                  {selectedPost.author && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-admin-surface-dark-2 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-bold">
                        {selectedPost.author.first_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-admin-text-dark">
                          {selectedPost.author.first_name} {selectedPost.author.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-admin-muted-dark">
                          {selectedPost.author.profession_type}
                        </p>
                      </div>
                    </div>
                  )}

                  <div
                    className="prose prose-sm max-w-none mb-4 max-h-64 overflow-y-auto dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedPost.content) }}
                  />

                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-admin-muted-dark mb-4">
                    <span>{selectedPost.read_time_minutes} min de lecture</span>
                    <span>•</span>
                    <span>{formatDate(selectedPost.created_at)}</span>
                  </div>

                  {actionError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                      {actionError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="danger"
                      fullWidth
                      disabled={isPending}
                      onClick={() => setShowRejectModal(true)}
                    >
                      Refuser
                    </Button>
                    <Button
                      variant="success"
                      fullWidth
                      loading={isPending}
                      onClick={() => handleApprove(selectedPost.id)}
                    >
                      Approuver
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card padding="lg">
                <div className="text-center py-6 text-gray-500 dark:text-admin-muted-dark text-sm">
                  Sélectionnez un article pour voir l&apos;aperçu
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card padding="lg" className="max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-admin-text-dark mb-3">
              Refuser l&apos;article
            </h3>
            <p className="text-sm text-gray-600 dark:text-admin-muted-dark mb-4">
              Expliquez à l&apos;auteur pourquoi son article est refusé pour qu&apos;il puisse le corriger.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motif du refus..."
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-admin-surface-dark text-gray-900 dark:text-admin-text-dark border-gray-300 dark:border-admin-border-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
            />
            {actionError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
                {actionError}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setActionError('');
                }}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                fullWidth
                loading={isPending}
                disabled={!rejectReason.trim()}
                onClick={handleReject}
              >
                Confirmer le refus
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
