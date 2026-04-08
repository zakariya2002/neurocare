'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, Badge, Button, StatCard } from '@/components/admin/ui';

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

  const getScoreColorClass = (score: number): string => {
    if (score <= 3) return 'text-red-600 dark:text-red-400';
    if (score <= 5) return 'text-orange-600 dark:text-orange-400';
    if (score <= 7) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getScoreBarColor = (score: number): string => {
    if (score <= 3) return 'bg-red-500';
    if (score <= 5) return 'bg-orange-500';
    if (score <= 7) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-admin-muted-dark">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark">
          Feedbacks utilisateurs
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
          Retours et notes des familles et professionnels
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total feedbacks" value={stats.total} />
          <StatCard label="Familles" value={stats.familyCount} />
          <StatCard label="Professionnels" value={stats.educatorCount} />
          <StatCard
            label="Score moyen"
            value={
              <span className={getScoreColorClass(stats.averageScore)}>
                {stats.averageScore.toFixed(1)}/10
              </span>
            }
          />
        </div>
      )}

      {/* Stats par question */}
      {stats && stats.questionStats.length > 0 && (
        <Card title="Scores moyens par question" padding="md">
          <div className="space-y-4">
            {stats.questionStats.map((qs) => (
              <div key={qs.questionId} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-admin-text-dark truncate">
                    {getQuestionText(qs.questionId)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-admin-muted-dark">
                    {qs.responseCount} réponses
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-admin-surface-dark-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBarColor(qs.averageScore)}`}
                      style={{ width: `${(qs.averageScore / 10) * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-12 text-right ${getScoreColorClass(qs.averageScore)}`}>
                    {qs.averageScore.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'family', 'educator'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-admin-surface-dark text-gray-700 dark:text-admin-muted-dark border border-gray-200 dark:border-admin-border-dark hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'family' ? 'Familles' : 'Professionnels'}
          </button>
        ))}
      </div>

      {/* Feedbacks list */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-admin-border-dark bg-gray-50 dark:bg-admin-surface-dark-2">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Commentaires</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-admin-border-dark">
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-admin-muted-dark">
                    Aucun feedback pour le moment
                  </td>
                </tr>
              ) : (
                feedbacks.map((feedback) => {
                  const responses = feedback.responses as FeedbackResponse[];
                  const commentsCount = responses.filter(r => r.comment).length;

                  return (
                    <tr key={feedback.id} className="hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-admin-muted-dark">
                        {format(new Date(feedback.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-admin-text-dark">
                        {(feedback as any).user_name || (
                          <span className="text-gray-400 dark:text-admin-muted-dark italic">Anonyme</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={feedback.user_type === 'educator' ? 'purple' : 'success'}>
                          {feedback.user_type === 'educator' ? 'Pro' : 'Famille'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-lg font-bold ${getScoreColorClass(feedback.overall_score || 0)}`}>
                          {feedback.overall_score?.toFixed(1) || '-'}/10
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-admin-muted-dark">
                        {commentsCount > 0
                          ? `${commentsCount} commentaire${commentsCount > 1 ? 's' : ''}`
                          : <span className="text-gray-400 dark:text-admin-muted-dark">Aucun</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFeedback(feedback)}>
                          Voir détails
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal détails */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-admin-surface-dark border border-gray-200 dark:border-admin-border-dark rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-admin-surface-dark border-b border-gray-200 dark:border-admin-border-dark px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-admin-text-dark">
                  Détails du feedback
                </h2>
                <p className="text-sm text-gray-500 dark:text-admin-muted-dark">
                  {format(new Date(selectedFeedback.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-2 text-gray-400 dark:text-admin-muted-dark hover:text-gray-600 dark:hover:text-admin-text-dark hover:bg-gray-100 dark:hover:bg-admin-surface-dark-2 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {(selectedFeedback as any).user_name && (
                  <span className="text-base font-bold text-gray-900 dark:text-admin-text-dark">
                    {(selectedFeedback as any).user_name}
                  </span>
                )}
                <Badge variant={selectedFeedback.user_type === 'educator' ? 'purple' : 'success'}>
                  {selectedFeedback.user_type === 'educator' ? 'Professionnel' : 'Famille'}
                </Badge>
                <span className={`text-2xl font-bold ml-auto ${getScoreColorClass(selectedFeedback.overall_score || 0)}`}>
                  {selectedFeedback.overall_score?.toFixed(1) || '-'}/10
                </span>
              </div>

              <div className="space-y-4">
                {(selectedFeedback.responses as FeedbackResponse[]).map((response, index) => {
                  const questions = selectedFeedback.user_type === 'educator' ? EDUCATOR_QUESTIONS : FAMILY_QUESTIONS;
                  const question = questions.find(q => q.id === response.questionId);

                  return (
                    <div key={response.questionId} className="border border-gray-200 dark:border-admin-border-dark rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-admin-text-dark">
                          {index + 1}. {question?.question || response.questionId}
                        </p>
                        <span className={`text-lg font-bold flex-shrink-0 ${getScoreColorClass(response.score || 0)}`}>
                          {response.score !== null ? response.score : '-'}/10
                        </span>
                      </div>
                      {response.comment && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-admin-surface-dark-2 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-admin-muted-dark italic">
                            &quot;{response.comment}&quot;
                          </p>
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
