'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BlogPost } from '@/types/blog';
import { getPostById } from '@/lib/blog/actions';
import BlogPostForm from '@/components/blog/BlogPostForm';
import BlogStatusBadge from '@/components/blog/BlogStatusBadge';
import EducatorMobileMenu from '@/components/EducatorMobileMenu';

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [postId]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/pro/login');
      return;
    }

    setUserId(session.user.id);

    // Get profile and post in parallel
    const [profileResult, postData] = await Promise.all([
      supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single(),
      getPostById(postId, session.user.id),
    ]);

    if (profileResult.data) {
      setProfile(profileResult.data);
    }

    if (!postData) {
      setError('Article non trouvé');
    } else if (!['draft', 'rejected'].includes(postData.status)) {
      setError('Cet article ne peut pas être modifié');
    } else {
      setPost(postData);
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="w-8 h-8 border-2 border-[#41005c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        {/* Navbar */}
        <nav className="sticky top-0 z-40" style={{ backgroundColor: '#41005c' }}>
          <div className="flex items-center justify-between px-4 py-4 relative">
            <EducatorMobileMenu profile={profile} onLogout={() => {}} />
            <Link href="/dashboard/educator" className="absolute left-1/2 transform -translate-x-1/2">
              <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-20" />
            </Link>
            <div className="w-10" />
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-8 text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{error}</h2>
            <p className="text-gray-600 mb-6">
              {error === 'Article non trouvé'
                ? 'Cet article n\'existe pas ou vous n\'avez pas les droits pour le modifier.'
                : 'Seuls les brouillons et les articles refusés peuvent être modifiés.'}
            </p>
            <Link
              href="/dashboard/educator/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#41005c] text-white font-semibold rounded-xl hover:opacity-90 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à mes articles
            </Link>
          </div>
        </div>

        <div className="mt-auto" style={{ backgroundColor: '#41005c', height: '40px' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-40" style={{ backgroundColor: '#41005c' }}>
        <div className="flex items-center justify-between px-4 py-4 relative">
          <EducatorMobileMenu profile={profile} onLogout={() => {}} />
          <Link href="/dashboard/educator" className="absolute left-1/2 transform -translate-x-1/2">
            <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-20" />
          </Link>
          <div className="w-10" />
        </div>
      </nav>

      {/* Header */}
      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6" style={{ backgroundColor: '#5a1a75' }}>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/educator/blog"
            className="p-1.5 sm:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">Modifier l'article</h1>
              {post && <BlogStatusBadge status={post.status} />}
            </div>
            <p className="text-white/70 text-[11px] sm:text-xs md:text-sm mt-0.5 truncate">{post?.title}</p>
          </div>
        </div>
      </div>

      {/* Rejection reason banner */}
      {post?.status === 'rejected' && post.rejection_reason && (
        <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium text-red-800 text-sm">Motif du refus</p>
              <p className="text-red-700 text-sm mt-1">{post.rejection_reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="flex-1 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          {post && <BlogPostForm userId={userId} existingPost={post} mode="edit" />}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto" style={{ backgroundColor: '#41005c', height: '40px' }} />
    </div>
  );
}
