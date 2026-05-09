'use client';

import Link from 'next/link';
import { CommunityPost, CATEGORY_INFO } from '@/types/community';
import AuthorBadge from './AuthorBadge';
import ReactionButtons from './ReactionButtons';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PostCardProps {
  post: CommunityPost;
  className?: string;
  onAuthRequired?: () => void;
}

export default function PostCard({ post, className = '', onAuthRequired }: PostCardProps) {
  const categoryInfo = CATEGORY_INFO[post.category];
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: fr
  });

  // Truncate content for preview
  const truncatedContent = post.content.length > 200
    ? post.content.substring(0, 200) + '...'
    : post.content;

  return (
    <article className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-3 sm:px-4 py-1 sm:py-1.5 text-white text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5">
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Post épinglé
        </div>
      )}

      <div className="p-3 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
          <AuthorBadge
            author={post.author}
            isAnonymous={post.is_anonymous}
            anonymousName={post.anonymous_name}
            authorRole={post.author_role}
            size="sm"
          />
          <div className="flex flex-col items-end gap-0.5 sm:gap-1 flex-shrink-0">
            <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${categoryInfo.color}`}>
              {categoryInfo.icon} <span className="hidden xs:inline">#</span>{categoryInfo.label}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-400">{timeAgo}</span>
          </div>
        </div>

        {/* Content */}
        <Link href={`/community/post/${post.id}`} className="block group">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-3">
            {truncatedContent}
          </p>
        </Link>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
          <ReactionButtons
            targetType="post"
            targetId={post.id}
            reactionsCount={post.reactions_count}
            userReactions={post.user_reactions}
            size="sm"
            onAuthRequired={onAuthRequired}
          />

          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.comments_count}
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.views_count}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
