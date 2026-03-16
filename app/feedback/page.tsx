'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FeedbackQuestion from '@/components/feedback/FeedbackQuestion';
import {
  FeedbackResponse,
  UserType,
  getQuestionsForUserType,
  FAMILY_QUESTIONS,
  EDUCATOR_QUESTIONS,
} from '@/types/feedback';
import { submitFeedback, getUserFeedback } from '@/lib/feedback/actions';
import { useToast } from '@/components/Toast';

export default function FeedbackPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [hasExistingFeedback, setHasExistingFeedback] = useState(false);

  useEffect(() => {
    checkUserAndLoadFeedback();
  }, []);

  const checkUserAndLoadFeedback = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/auth/login?redirect=/feedback');
        return;
      }

      setUserId(session.user.id);

      // Parallelize user type check and existing feedback fetch
      const [educatorResult, existingFeedback] = await Promise.all([
        supabase
          .from('educator_profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .single(),
        getUserFeedback(session.user.id),
      ]);

      const type: UserType = educatorResult.data ? 'educator' : 'family';
      setUserType(type);

      // Initialiser les réponses
      const questions = getQuestionsForUserType(type);
      const initialResponses: FeedbackResponse[] = questions.map(q => ({
        questionId: q.id,
        score: null,
        comment: '',
      }));
      if (existingFeedback) {
        setHasExistingFeedback(true);
        // Merger avec les réponses existantes
        const existingResponses = existingFeedback.responses as FeedbackResponse[];
        const mergedResponses = initialResponses.map(r => {
          const existing = existingResponses.find(er => er.questionId === r.questionId);
          return existing || r;
        });
        setResponses(mergedResponses);
      } else {
        setResponses(initialResponses);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const questions = userType ? getQuestionsForUserType(userType) : [];
  const currentQuestion = questions[currentStep];
  const currentResponse = responses[currentStep];

  const handleScoreChange = (score: number) => {
    const newResponses = [...responses];
    newResponses[currentStep] = { ...newResponses[currentStep], score };
    setResponses(newResponses);
  };

  const handleCommentChange = (comment: string) => {
    const newResponses = [...responses];
    newResponses[currentStep] = { ...newResponses[currentStep], comment };
    setResponses(newResponses);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userId || !userType) return;

    setSubmitting(true);
    const result = await submitFeedback(userId, userType, responses);

    if (result.success) {
      setSubmitted(true);
    } else {
      showToast('Erreur lors de l\'envoi du feedback: ' + result.error, 'error');
    }
    setSubmitting(false);
  };

  // Progress percentage
  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;

  // Check if current question has been answered
  const isCurrentAnswered = currentResponse?.score !== null;
  const allAnswered = responses.every(r => r.score !== null);

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

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-5 sm:p-8 md:p-12 max-w-md w-full text-center">
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#e6f4f4' }}
          >
            <svg className="w-12 h-12" fill="none" stroke="#027e7e" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4" style={{ color: '#027e7e' }}>
            Merci pour votre retour !
          </h1>

          <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-8">
            Vos réponses nous aideront à améliorer NeuroCare pour mieux vous accompagner.
          </p>

          <Link
            href={userType === 'educator' ? '/dashboard/educator' : '/dashboard/family'}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition hover:opacity-90"
            style={{ backgroundColor: '#027e7e' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={userType === 'educator' ? '/dashboard/educator' : '/dashboard/family'}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>

          <h1 className="text-lg font-bold text-white">Votre avis compte</h1>

          <div className="w-10"></div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/20">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Info banner */}
        {hasExistingFeedback && currentStep === 0 && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-amber-800">
                Vous avez déjà donné votre avis. Vos réponses précédentes ont été chargées. Vous pouvez les modifier si vous le souhaitez.
              </p>
            </div>
          </div>
        )}

        {/* User type badge */}
        <div className="flex justify-center mb-6">
          <span
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: userType === 'educator' ? '#f3e8ff' : '#e6f4f4',
              color: userType === 'educator' ? '#41005c' : '#027e7e',
            }}
          >
            {userType === 'educator' ? '👨‍⚕️ Questionnaire Professionnel' : '👨‍👩‍👧 Questionnaire Famille'}
          </span>
        </div>

        {/* Question */}
        {currentQuestion && currentResponse && (
          <FeedbackQuestion
            questionNumber={currentStep + 1}
            totalQuestions={questions.length}
            question={currentQuestion.question}
            category={currentQuestion.category}
            score={currentResponse.score}
            comment={currentResponse.comment}
            onScoreChange={handleScoreChange}
            onCommentChange={handleCommentChange}
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Précédent
          </button>

          {currentStep < questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isCurrentAnswered}
              className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: '#027e7e' }}
            >
              Suivant
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: '#027e7e' }}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Envoi...
                </>
              ) : (
                <>
                  Envoyer
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                // Only allow going to answered questions or the next one
                if (index <= currentStep || responses[index - 1]?.score !== null) {
                  setCurrentStep(index);
                }
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStep
                  ? 'scale-125'
                  : responses[index]?.score !== null
                  ? 'opacity-100'
                  : 'opacity-30'
              }`}
              style={{
                backgroundColor:
                  index === currentStep
                    ? '#027e7e'
                    : responses[index]?.score !== null
                    ? '#22c55e'
                    : '#d1d5db',
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
