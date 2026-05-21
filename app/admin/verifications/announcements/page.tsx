'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Badge } from '@/components/admin/ui';
import { ModerationCard, type ModerationAnnouncement } from '@/components/admin/announcements/ModerationCard';
import type { AnnouncementStatus } from '@/types';

interface ListResponse {
  announcements: ModerationAnnouncement[];
  page: number;
  pageSize: number;
  total: number;
  pendingCount: number;
}

type StatusTab = Extract<AnnouncementStatus, 'pending' | 'published' | 'rejected' | 'expired' | 'filled'>;

const tabs: { value: StatusTab; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'published', label: 'Publiées' },
  { value: 'rejected', label: 'Refusées' },
  { value: 'expired', label: 'Expirées' },
  { value: 'filled', label: 'Pourvues' },
];

export default function AdminAnnouncementsListPage() {
  const [status, setStatus] = useState<StatusTab>('pending');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ status, page: String(page) });
        const res = await fetch(`/api/admin/announcements?${params}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur chargement');
        }
        const json = (await res.json()) as ListResponse;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Erreur');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [status, page]);

  const handleTabChange = (next: StatusTab) => {
    setStatus(next);
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/verifications"
            className="text-sm text-gray-500 dark:text-admin-muted-dark hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux vérifications
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark mt-1 inline-flex items-center gap-2">
            <img
              src="/images/icons/announcement.svg"
              alt=""
              aria-hidden="true"
              className="w-7 h-7"
            />
            Modération des annonces familles
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
            Pré-modération avant publication aux professionnels
          </p>
        </div>
        {data && (
          <Badge variant="warning">
            {data.pendingCount} en attente
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => {
          const active = status === t.value;
          return (
            <button
              key={t.value}
              onClick={() => handleTabChange(t.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-admin-surface-dark text-gray-700 dark:text-admin-muted-dark border border-gray-200 dark:border-admin-border-dark hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-200 border-t-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-admin-muted-dark">Chargement...</p>
          </div>
        </div>
      ) : error ? (
        <Card padding="lg">
          <p className="text-center text-red-600 dark:text-red-400">{error}</p>
        </Card>
      ) : !data || data.announcements.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark mb-1">
              Aucune annonce
            </h3>
            <p className="text-sm text-gray-500 dark:text-admin-muted-dark">
              Aucune annonce ne correspond à ce filtre pour le moment.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.announcements.map((a) => (
              <ModerationCard key={a.id} announcement={a} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500 dark:text-admin-muted-dark">
                Page {data.page} sur {totalPages} — {data.total} annonce
                {data.total > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-admin-surface-dark border border-gray-200 dark:border-admin-border-dark text-gray-700 dark:text-admin-muted-dark hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-admin-surface-dark border border-gray-200 dark:border-admin-border-dark text-gray-700 dark:text-admin-muted-dark hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
