'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getAllFeedbacks, getFeedbackStats } from '@/lib/feedback/actions';
import {
  UserFeedback,
  FeedbackResponse,
  UserType,
  FAMILY_QUESTIONS,
  EDUCATOR_QUESTIONS,
} from '@/types/feedback';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    familyCount: number;
    educatorCount: number;
    averageScore: number;
    questionStats: { questionId: string; averageScore: number; responseCount: number }[];
  } | null>(null);
  const [filter, setFilter] = useState<'all' | 'family' | 'educator'>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  useEffect(() => {
    loadFeedbacks();
  }, [filter]);

  const checkAdminAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    // Vérification admin gérée par le middleware (app_metadata.role)
    await Promise.all([loadFeedbacks(), loadStats()]);
    setLoading(false);
  };

  const loadFeedbacks = async () => {
    const data = await getAllFeedbacks(
      filter !== 'all' ? { userType: filter as UserType } : undefined
    );
    setFeedbacks(data);
  };

  const loadStats = async () => {
    const data = await getFeedbackStats();
    setStats(data);
  };

  const getQuestionText = (questionId: string): string => {
    const allQuestions = [...FAMILY_QUESTIONS, ...EDUCATOR_QUESTIONS];
    const question = allQuestions.find(q => q.id === questionId);
    return question?.question || questionId;
  };

  const getScoreColor = (score: number): string => {
    if (score <= 3) return '#ef4444';
    if (score <= 5) return '#f97316';
    if (score <= 7) return '#eab308';
    return '#22c55e';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#027e7e', borderTopColor: 'transparent' }}></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 text-white hover:text-white/80">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Admin
          </Link>
          <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">Feedbacks utilisateurs</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8">
        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total feedbacks</p>
              <p className="text-3xl font-bold" style={{ color: '#027e7e' }}>{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Familles</p>
              <p className="text-3xl font-bold" style={{ color: '#027e7e' }}>{stats.familyCount}</p>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Professionnels</p>
              <p className="text-3xl font-bold" style={{ color: '#41005c' }}>{stats.educatorCount}</p>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Score moyen</p>
              <p className="text-3xl font-bold" style={{ color: getScoreColor(stats.averageScore) }}>
                {stats.averageScore.toFixed(1)}/10
              </p>
            </div>
          </div>
        )}

        {/* Stats par question */}
        {stats && stats.questionStats.length > 0 && (
          <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Scores moyens par question</h2>
            <div className="space-y-3 sm:space-y-4">
              {stats.questionStats.map((qs) => (
                <div key={qs.questionId} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{getQuestionText(qs.questionId)}</p>
                    <p className="text-xs text-gray-400">{qs.responseCount} réponses</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(qs.averageScore / 10) * 100}%`,
                          backgroundColor: getScoreColor(qs.averageScore),
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-bold w-12 text-right"
                      style={{ color: getScoreColor(qs.averageScore) }}
                    >
                      {qs.averageScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-3 sm:mb-4 md:mb-6">
          {(['all', 'family', 'educator'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                filter === f
                  ? 'text-white'
                  : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
              style={filter === f ? { backgroundColor: '#027e7e' } : {}}
            >
              {f === 'all' ? 'Tous' : f === 'family' ? 'Familles' : 'Professionnels'}
            </button>
          ))}
        </div>

        {/* Feedbacks list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100" style={{ backgroundColor: '#f9fafb' }}>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Score moyen</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Commentaires</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Aucun feedback pour le moment
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((feedback) => {
                    const responses = feedback.responses as FeedbackResponse[];
                    const commentsCount = responses.filter(r => r.comment).length;

                    return (
                      <tr key={feedback.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(feedback.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                          {(feedback as any).user_name || <span className="text-gray-400 italic">Anonyme</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: feedback.user_type === 'educator' ? '#f3e8ff' : '#e6f4f4',
                              color: feedback.user_type === 'educator' ? '#41005c' : '#027e7e',
                            }}
                          >
                            {feedback.user_type === 'educator' ? 'Pro' : 'Famille'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-lg font-bold"
                            style={{ color: getScoreColor(feedback.overall_score || 0) }}
                          >
                            {feedback.overall_score?.toFixed(1) || '-'}/10
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {commentsCount > 0 ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              {commentsCount} commentaire{commentsCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-gray-400">Aucun</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedFeedback(feedback)}
                            className="text-sm font-medium hover:underline"
                            style={{ color: '#027e7e' }}
                          >
                            Voir détails
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal détails */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Détails du feedback</h2>
                <p className="text-sm text-gray-500">
                  {format(new Date(selectedFeedback.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 sm:p-4 md:p-6">
              {/* Utilisateur, type et score */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {(selectedFeedback as any).user_name && (
                  <span className="text-base font-bold text-gray-900">
                    {(selectedFeedback as any).user_name}
                  </span>
                )}
                <span
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: selectedFeedback.user_type === 'educator' ? '#f3e8ff' : '#e6f4f4',
                    color: selectedFeedback.user_type === 'educator' ? '#41005c' : '#027e7e',
                  }}
                >
                  {selectedFeedback.user_type === 'educator' ? 'Professionnel' : 'Famille'}
                </span>
                <span
                  className="text-2xl font-bold ml-auto"
                  style={{ color: getScoreColor(selectedFeedback.overall_score || 0) }}
                >
                  {selectedFeedback.overall_score?.toFixed(1) || '-'}/10
                </span>
              </div>

              {/* Réponses */}
              <div className="space-y-4">
                {(selectedFeedback.responses as FeedbackResponse[]).map((response, index) => {
                  const questions = selectedFeedback.user_type === 'educator' ? EDUCATOR_QUESTIONS : FAMILY_QUESTIONS;
                  const question = questions.find(q => q.id === response.questionId);

                  return (
                    <div key={response.questionId} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          {index + 1}. {question?.question || response.questionId}
                        </p>
                        <span
                          className="text-lg font-bold flex-shrink-0"
                          style={{ color: getScoreColor(response.score || 0) }}
                        >
                          {response.score !== null ? response.score : '-'}/10
                        </span>
                      </div>
                      {response.comment && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 italic">"{response.comment}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
