'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PostCategory, CATEGORY_INFO } from '@/types/community';
import { createPost } from '@/lib/community/actions';

interface NewPostFormProps {
  className?: string;
}

export default function NewPostForm({ className = '' }: NewPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<PostCategory>('questions');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Veuillez ajouter un titre');
      return;
    }
    if (!content.trim()) {
      setError('Veuillez ajouter du contenu');
      return;
    }

    startTransition(async () => {
      const result = await createPost({
        category,
        title: title.trim(),
        content: content.trim(),
        is_anonymous: isAnonymous
      });

      if (result.success && result.postId) {
        router.push(`/communaute/post/${result.postId}`);
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Category selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Catégorie
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(CATEGORY_INFO) as PostCategory[]).map((cat) => {
            const info = CATEGORY_INFO[cat];
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`
                  p-3 rounded-xl border-2 text-left transition-all
                  ${isSelected
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-2xl mb-1 block">{info.icon}</span>
                <span className={`text-sm font-medium ${isSelected ? 'text-teal-700' : 'text-gray-700'}`}>
                  #{info.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Titre
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Donnez un titre accrocheur à votre post"
          maxLength={150}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/150</p>
      </div>

      {/* Content */}
      <div className="mb-6">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Contenu
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Partagez votre expérience, posez votre question, ou donnez vos conseils..."
          rows={8}
          maxLength={5000}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 resize-none transition"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{content.length}/5000</p>
      </div>

      {/* Anonymous option */}
      <div className="mb-8">
        <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 mt-0.5"
          />
          <div>
            <span className="font-medium text-gray-900">Poster anonymement</span>
            <p className="text-sm text-gray-500 mt-0.5">
              Votre identité sera masquée et remplacée par un pseudonyme généré
            </p>
          </div>
        </label>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Publication...
            </span>
          ) : (
            'Publier'
          )}
        </button>
      </div>
    </form>
  );
}
