'use server';

import { createClient } from '@supabase/supabase-js';
import { FeedbackResponse, UserType, UserFeedback } from '@/types/feedback';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Soumettre un feedback
export async function submitFeedback(
  userId: string,
  userType: UserType,
  responses: FeedbackResponse[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Calculer le score moyen
    const scores = responses.filter(r => r.score !== null).map(r => r.score as number);
    const overallScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;

    // Vérifier si l'utilisateur a déjà un feedback
    const { data: existing } = await supabaseAdmin
      .from('user_feedback')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Mettre à jour le feedback existant
      const { error } = await supabaseAdmin
        .from('user_feedback')
        .update({
          responses,
          overall_score: overallScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Créer un nouveau feedback
      const { error } = await supabaseAdmin
        .from('user_feedback')
        .insert({
          user_id: userId,
          user_type: userType,
          responses,
          overall_score: overallScore,
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erreur submitFeedback:', error);
    return { success: false, error: error.message };
  }
}

// Récupérer le feedback d'un utilisateur
export async function getUserFeedback(userId: string): Promise<UserFeedback | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Erreur getUserFeedback:', error);
    return null;
  }
}

// Admin: Récupérer tous les feedbacks avec le nom de l'utilisateur
export async function getAllFeedbacks(filters?: {
  userType?: UserType;
  startDate?: string;
  endDate?: string;
}): Promise<(UserFeedback & { user_name?: string })[]> {
  try {
    let query = supabaseAdmin
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.userType) {
      query = query.eq('user_type', filters.userType);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Récupérer les noms des utilisateurs
    const feedbacksWithNames = await Promise.all(
      (data || []).map(async (feedback) => {
        let userName: string | undefined;
        if (feedback.user_type === 'family') {
          const { data: profile } = await supabaseAdmin
            .from('family_profiles')
            .select('first_name, last_name')
            .eq('user_id', feedback.user_id)
            .single();
          if (profile) userName = `${profile.first_name} ${profile.last_name}`;
        } else if (feedback.user_type === 'educator') {
          const { data: profile } = await supabaseAdmin
            .from('educator_profiles')
            .select('first_name, last_name')
            .eq('user_id', feedback.user_id)
            .single();
          if (profile) userName = `${profile.first_name} ${profile.last_name}`;
        }
        return { ...feedback, user_name: userName };
      })
    );

    return feedbacksWithNames;
  } catch (error) {
    console.error('Erreur getAllFeedbacks:', error);
    return [];
  }
}

// Admin: Statistiques des feedbacks
export async function getFeedbackStats(): Promise<{
  total: number;
  familyCount: number;
  educatorCount: number;
  averageScore: number;
  questionStats: { questionId: string; averageScore: number; responseCount: number }[];
}> {
  try {
    const { data: feedbacks, error } = await supabaseAdmin
      .from('user_feedback')
      .select('*');

    if (error) throw error;

    const familyFeedbacks = feedbacks?.filter(f => f.user_type === 'family') || [];
    const educatorFeedbacks = feedbacks?.filter(f => f.user_type === 'educator') || [];

    // Calculer les stats par question
    const questionStatsMap: { [key: string]: { total: number; count: number } } = {};

    feedbacks?.forEach(feedback => {
      const responses = feedback.responses as FeedbackResponse[];
      responses.forEach(response => {
        if (response.score !== null) {
          if (!questionStatsMap[response.questionId]) {
            questionStatsMap[response.questionId] = { total: 0, count: 0 };
          }
          questionStatsMap[response.questionId].total += response.score;
          questionStatsMap[response.questionId].count += 1;
        }
      });
    });

    const questionStats = Object.entries(questionStatsMap).map(([questionId, stats]) => ({
      questionId,
      averageScore: stats.count > 0 ? stats.total / stats.count : 0,
      responseCount: stats.count,
    }));

    // Score moyen global
    const allScores = feedbacks
      ?.filter(f => f.overall_score !== null)
      .map(f => f.overall_score as number) || [];
    const averageScore = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;

    return {
      total: feedbacks?.length || 0,
      familyCount: familyFeedbacks.length,
      educatorCount: educatorFeedbacks.length,
      averageScore,
      questionStats,
    };
  } catch (error) {
    console.error('Erreur getFeedbackStats:', error);
    return {
      total: 0,
      familyCount: 0,
      educatorCount: 0,
      averageScore: 0,
      questionStats: [],
    };
  }
}
