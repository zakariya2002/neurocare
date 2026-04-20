'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CommunityPost, CommunityComment, CATEGORY_INFO } from '@/types/community';
import { getPostById, getComments, deletePost, reportContent } from '@/lib/community/actions';
import FamilyNavbar from '@/components/FamilyNavbar';
import EducatorNavbar from '@/components/EducatorNavbar';
import AuthorBadge from '@/components/community/AuthorBadge';
import ReactionButtons from '@/components/community/ReactionButtons';
import CommentSection from '@/components/community/CommentSection';
import AuthPromptModal from '@/components/community/AuthPromptModal';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/Toast';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const postId = params.id as string;

  const [userRole, setUserRole] = useState<'family' | 'educator' | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUserId(session.user.id);

          // Check user role
          const { data: educator } = await supabase
            .from('educator_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (educator) {
            setUserRole('educator');
            setProfile(educator);
          } else {
            const { data: family } = await supabase
              .from('family_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (family) {
              setUserRole('family');
              setProfile(family);
              setFamilyId(family.id);
            }
          }
        }

        // Fetch post and comments
        const [postData, commentsData] = await Promise.all([
          getPostById(postId),
          getComments(postId)
        ]);

        if (!postData) {
          router.push('/community');
          return;
        }

        setPost(postData);
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, router]);

  const handleDelete = async () => {
    const result = await deletePost(postId);
    if (result.success) {
      router.push('/community');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setIsReporting(true);
    const result = await reportContent('post', postId, reportReason);
    setIsReporting(false);
    if (result.success) {
      setShowReportModal(false);
      setReportReason('');
      showToast('Merci pour votre signalement. Notre équipe va examiner ce contenu.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf9f4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#fdf9f4] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Post non trouvé</h2>
          <Link href="/community" className="text-teal-600 hover:underline">
            Retour à la communauté
          </Link>
        </div>
      </div>
    );
  }

  const categoryInfo = CATEGORY_INFO[post.category];
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });
  const fullDate = format(new Date(post.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr });
  const isAuthor = userId === post.author_id;

  return (
    <div className="min-h-screen bg-[#fdf9f4]">
      {/* Navbar */}
      {userRole === 'educator' ? (
        <EducatorNavbar profile={profile} />
      ) : userRole === 'family' ? (
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      ) : (
        <header className="sticky top-0 z-50" style={{ backgroundColor: '#027e7e' }}>
          <div className="flex items-center justify-between px-4 py-4">
            {/* Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-white"
              aria-label="Ouvrir le menu de navigation"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo centré */}
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2" aria-label="Retour à l'accueil NeuroCare">
              <img
                src="/images/logo-neurocare.svg"
                alt="NeuroCare"
                className="h-20"
              />
            </Link>

            {/* Espace vide pour équilibrer */}
            <div className="w-8"></div>
          </div>

          {/* Menu mobile déroulant */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-50">
              <nav className="px-4 py-4 space-y-1" role="navigation" aria-label="Menu principal">
                <Link
                  href="/search"
                  className="block py-3 font-medium text-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Rechercher un professionnel
                </Link>
                <Link
                  href="/about"
                  className="block py-3 font-medium text-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  À propos
                </Link>
                <Link
                  href="/familles/aides-financieres"
                  className="block py-3 font-medium text-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Aides financières
                </Link>
                <Link
                  href="/contact"
                  className="block py-3 font-medium text-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <Link
                  href="/pro"
                  className="block py-3 px-4 rounded-xl font-semibold text-center my-3"
                  style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Vous êtes professionnel ?
                </Link>
                <Link
                  href="/blog"
                  className="flex items-center gap-3 py-3 font-medium text-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Blog
                </Link>
                <Link
                  href="/community"
                  className="flex items-center gap-3 py-3 font-medium text-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Forum
                </Link>
                <Link
                  href="/auth/login"
                  className="block py-3 px-4 text-white rounded-xl text-center font-semibold mt-3"
                  style={{ backgroundColor: '#f0879f' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/signup"
                  className="block py-3 px-4 text-white rounded-xl text-center font-semibold mt-2"
                  style={{ backgroundColor: '#027e7e' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Inscription
                </Link>
              </nav>
            </div>
          )}
        </header>
      )}

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la communauté
        </Link>

        {/* Post content */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {/* Pinned indicator */}
          {post.is_pinned && (
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 text-white text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Post épinglé
            </div>
          )}

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <AuthorBadge
                author={post.author}
                isAnonymous={post.is_anonymous}
                anonymousName={post.anonymous_name}
                authorRole={post.author_role}
                size="lg"
              />
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${categoryInfo.color}`}>
                {categoryInfo.icon} #{categoryInfo.label}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

            {/* Content */}
            <div className="prose prose-gray max-w-none mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
              <span title={fullDate}>{timeAgo}</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {post.views_count} vue{post.views_count !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <ReactionButtons
                targetType="post"
                targetId={post.id}
                reactionsCount={post.reactions_count}
                userReactions={post.user_reactions}
                size="md"
                onAuthRequired={!userId ? () => setShowAuthModal(true) : undefined}
              />

              <div className="flex items-center gap-2">
                {isAuthor && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Supprimer
                  </button>
                )}
                {userId && !isAuthor && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Signaler
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Comments */}
        <CommentSection
          postId={post.id}
          comments={comments}
          isAuthenticated={!!userId}
        />
      </main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Supprimer ce post ?</h3>
            <p className="text-gray-600 mb-6">Cette action est irréversible. Le post et tous ses commentaires seront supprimés.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Signaler ce contenu</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Décrivez le problème..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleReport}
                disabled={isReporting || !reportReason.trim()}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isReporting ? 'Envoi...' : 'Signaler'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
