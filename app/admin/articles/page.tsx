'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, StatCard } from '@/components/admin/ui';
import { sanitizeHtml } from '@/lib/sanitize-html';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CalendarArticle {
  id: string;
  title: string;
  target_keyword: string | null;
  secondary_keywords: string[] | null;
  planned_date: string | null;
  status: 'planned' | 'draft' | 'published';
  generated_title: string | null;
  generated_description: string | null;
  generated_keywords: string[] | null;
  generated_content: string | null;
  image_suggestion: string | null;
  blog_post_id: string | null;
  created_at: string;
  updated_at: string;
}

interface GeneratedData {
  title: string;
  metaDescription: string;
  keywords: string[];
  content: string;
  imagePrompt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' }> = {
  planned: { label: 'Planifie\u0301', variant: 'neutral' },
  draft: { label: 'Brouillon', variant: 'warning' },
  published: { label: 'Publie\u0301', variant: 'success' },
};

const MONTHS_FR = [
  'Janvier', 'Fe\u0301vrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aou\u0302t', 'Septembre', 'Octobre', 'Novembre', 'De\u0301cembre',
];

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday-based (Mon=0)
  return day === 0 ? 6 : day - 1;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdminArticles() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<CalendarArticle[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Calendar state
  const now = new Date();
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());

  // Generation state
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Preview modal
  const [previewArticle, setPreviewArticle] = useState<CalendarArticle | null>(null);

  // ─── Data loading ───────────────────────────────────────────────────────

  const loadArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/articles');
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      if (data.error && !data.articles?.length) {
        setError(data.error);
        setArticles([]);
      } else {
        setArticles(data.articles || []);
        setError(null);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les articles');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/auth/login'); return; }
      await loadArticles();
      setLoading(false);
    };
    init();
  }, [router, loadArticles]);

  // ─── Actions ────────────────────────────────────────────────────────────

  const handleGenerate = async (article: CalendarArticle) => {
    setGeneratingId(article.id);
    try {
      // Step 1: Call the AI generation endpoint
      const genRes = await fetch('/api/admin/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: article.title,
          keyword: article.target_keyword || article.title,
          secondaryKeywords: article.secondary_keywords || [],
        }),
      });

      if (!genRes.ok) {
        const errData = await genRes.json();
        throw new Error(errData.error || 'Erreur de ge\u0301ne\u0301ration');
      }

      const generatedData: GeneratedData = await genRes.json();

      // Step 2: Save the draft
      const saveRes = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_draft',
          articleId: article.id,
          generatedData,
        }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json();
        throw new Error(errData.error || 'Erreur de sauvegarde');
      }

      await loadArticles();
    } catch (err) {
      console.error('Erreur ge\u0301ne\u0301ration:', err);
      setError(err instanceof Error ? err.message : 'Erreur de ge\u0301ne\u0301ration');
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePublish = async (article: CalendarArticle) => {
    if (!confirm('Publier cet article sur le blog ?')) return;
    setPublishingId(article.id);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish', articleId: article.id }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur de publication');
      }
      await loadArticles();
    } catch (err) {
      console.error('Erreur publication:', err);
      setError(err instanceof Error ? err.message : 'Erreur de publication');
    } finally {
      setPublishingId(null);
    }
  };

  // ─── Calendar helpers ───────────────────────────────────────────────────

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);

  const articlesForDate = (day: number): CalendarArticle[] => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return articles.filter((a) => a.planned_date === dateStr);
  };

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // ─── Stats ──────────────────────────────────────────────────────────────

  const planned = articles.filter((a) => a.status === 'planned').length;
  const drafts = articles.filter((a) => a.status === 'draft').length;
  const published = articles.filter((a) => a.status === 'published').length;

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-200 border-t-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-admin-muted-dark">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark">
          Articles IA
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
          Calendrier de contenu et ge&#x0301;ne&#x0301;ration d&apos;articles SEO avec l&apos;IA
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Planifie&#x0301;s" value={planned} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        } />
        <StatCard label="Brouillons" value={drafts} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        } />
        <StatCard label="Publie&#x0301;s" value={published} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
      </div>

      {/* Calendar */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendrier de contenu
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-admin-surface-dark-2 text-gray-500 dark:text-admin-muted-dark"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-admin-text-dark min-w-[140px] text-center">
              {MONTHS_FR[calendarMonth]} {calendarYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-admin-surface-dark-2 text-gray-500 dark:text-admin-muted-dark"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        }
        padding="sm"
      >
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {DAYS_FR.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-admin-muted-dark py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px">
          {/* Empty cells for days before month start */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] p-1 bg-gray-50/50 dark:bg-admin-surface-dark-2/30 rounded" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayArticles = articlesForDate(day);
            const isToday =
              day === now.getDate() &&
              calendarMonth === now.getMonth() &&
              calendarYear === now.getFullYear();

            return (
              <div
                key={day}
                className={`min-h-[80px] p-1 rounded border transition-colors ${
                  isToday
                    ? 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2/50'
                }`}
              >
                <span className={`text-xs font-medium ${
                  isToday
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-admin-muted-dark'
                }`}>
                  {day}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayArticles.map((article) => {
                    const cfg = STATUS_CONFIG[article.status] || STATUS_CONFIG.planned;
                    return (
                      <button
                        key={article.id}
                        onClick={() => setPreviewArticle(article)}
                        className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                          article.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : article.status === 'draft'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-admin-surface-dark-2 dark:text-admin-muted-dark'
                        }`}
                        title={`${article.title} (${cfg.label})`}
                      >
                        {article.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Articles table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-admin-border-dark">
          <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark">
            Tous les articles ({articles.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-admin-border-dark bg-gray-50 dark:bg-admin-surface-dark-2">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">
                  Titre
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden md:table-cell">
                  Mot-cle&#x0301;
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">
                  Statut
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden sm:table-cell">
                  Date pre&#x0301;vue
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-admin-border-dark">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 dark:text-admin-muted-dark">
                    Aucun article planifie&#x0301;
                  </td>
                </tr>
              ) : (
                articles.map((article) => {
                  const cfg = STATUS_CONFIG[article.status] || STATUS_CONFIG.planned;
                  const isGenerating = generatingId === article.id;
                  const isPublishing = publishingId === article.id;

                  return (
                    <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-admin-text-dark line-clamp-1">
                            {article.generated_title || article.title}
                          </p>
                          {article.generated_title && article.generated_title !== article.title && (
                            <p className="text-xs text-gray-400 dark:text-admin-muted-dark mt-0.5 line-clamp-1">
                              Sujet : {article.title}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-600 dark:text-admin-muted-dark">
                          {article.target_keyword || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-500 dark:text-admin-muted-dark">
                          {article.planned_date
                            ? new Date(article.planned_date + 'T00:00:00').toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Generate button */}
                          {article.status !== 'published' && (
                            <Button
                              variant="primary"
                              size="sm"
                              loading={isGenerating}
                              disabled={isGenerating || isPublishing}
                              onClick={() => handleGenerate(article)}
                              leftIcon={
                                !isGenerating ? (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                ) : undefined
                              }
                            >
                              {isGenerating ? 'Ge\u0301ne\u0301ration...' : article.status === 'draft' ? 'Rege\u0301ne\u0301rer' : 'Ge\u0301ne\u0301rer'}
                            </Button>
                          )}

                          {/* Preview button (only if content exists) */}
                          {article.generated_content && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setPreviewArticle(article)}
                              leftIcon={
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              }
                            >
                              Aperc&#x0327;u
                            </Button>
                          )}

                          {/* Publish button (only drafts) */}
                          {article.status === 'draft' && article.generated_content && (
                            <Button
                              variant="success"
                              size="sm"
                              loading={isPublishing}
                              disabled={isGenerating || isPublishing}
                              onClick={() => handlePublish(article)}
                            >
                              Publier
                            </Button>
                          )}

                          {/* Published indicator */}
                          {article.status === 'published' && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              En ligne
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Generation info card */}
      {generatingId && (
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 border-t-primary-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-admin-text-dark">
                Ge&#x0301;ne&#x0301;ration en cours...
              </p>
              <p className="text-xs text-gray-500 dark:text-admin-muted-dark">
                L&apos;IA re&#x0301;dige votre article. Cela peut prendre 10 a&#x0300; 30 secondes.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Preview modal */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card padding="none" className="max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-admin-border-dark flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark">
                  Aperc&#x0327;u de l&apos;article
                </h3>
                <Badge variant={STATUS_CONFIG[previewArticle.status]?.variant || 'neutral'}>
                  {STATUS_CONFIG[previewArticle.status]?.label || previewArticle.status}
                </Badge>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-admin-surface-dark-2 text-gray-500 dark:text-admin-muted-dark"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-5">
              {previewArticle.generated_content ? (
                <div className="space-y-4">
                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-admin-text-dark">
                    {previewArticle.generated_title || previewArticle.title}
                  </h2>

                  {/* Meta description */}
                  {previewArticle.generated_description && (
                    <div className="bg-gray-50 dark:bg-admin-surface-dark-2 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase mb-1">
                        Meta description
                      </p>
                      <p className="text-sm text-gray-700 dark:text-admin-text-dark">
                        {previewArticle.generated_description}
                      </p>
                    </div>
                  )}

                  {/* Keywords */}
                  {previewArticle.generated_keywords && previewArticle.generated_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {previewArticle.generated_keywords.map((kw, i) => (
                        <Badge key={i} variant="purple">{kw}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Image suggestion */}
                  {previewArticle.image_suggestion && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">
                        Suggestion d&apos;image
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {previewArticle.image_suggestion}
                      </p>
                    </div>
                  )}

                  {/* Content */}
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert
                      prose-headings:text-gray-900 dark:prose-headings:text-admin-text-dark
                      prose-p:text-gray-700 dark:prose-p:text-gray-300
                      prose-li:text-gray-700 dark:prose-li:text-gray-300
                      prose-strong:text-gray-900 dark:prose-strong:text-admin-text-dark"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewArticle.generated_content) }}
                  />
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-admin-surface-dark-2 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400 dark:text-admin-muted-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark mb-1">
                    {previewArticle.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-admin-muted-dark mb-1">
                    Mot-cle&#x0301; : {previewArticle.target_keyword || '-'}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-admin-muted-dark">
                    Cet article n&apos;a pas encore e&#x0301;te&#x0301; ge&#x0301;ne&#x0301;re&#x0301;. Cliquez sur &quot;Ge&#x0301;ne&#x0301;rer&quot; pour cre&#x0301;er le contenu.
                  </p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 dark:border-admin-border-dark flex-shrink-0">
              <Button variant="secondary" onClick={() => setPreviewArticle(null)}>
                Fermer
              </Button>
              {previewArticle.status !== 'published' && (
                <Button
                  variant="primary"
                  loading={generatingId === previewArticle.id}
                  disabled={!!generatingId}
                  onClick={() => {
                    handleGenerate(previewArticle);
                  }}
                >
                  {previewArticle.generated_content ? 'Rege\u0301ne\u0301rer' : 'Ge\u0301ne\u0301rer'}
                </Button>
              )}
              {previewArticle.status === 'draft' && previewArticle.generated_content && (
                <Button
                  variant="success"
                  loading={publishingId === previewArticle.id}
                  disabled={!!publishingId}
                  onClick={() => {
                    handlePublish(previewArticle);
                    setPreviewArticle(null);
                  }}
                >
                  Publier
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
