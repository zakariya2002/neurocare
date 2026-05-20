'use client';

import Link from 'next/link';
import { Card, Badge, Button } from '@/components/admin/ui';
import type { AnnouncementStatus } from '@/types';

export interface ModerationAnnouncement {
  id: string;
  title: string;
  description: string;
  city: string;
  status: AnnouncementStatus;
  created_at: string;
  family: {
    first_name: string;
    last_name: string;
    email: string | null;
  };
}

interface ModerationCardProps {
  announcement: ModerationAnnouncement;
}

const statusVariant: Record<AnnouncementStatus, { label: string; variant: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'purple' }> = {
  draft: { label: 'Brouillon', variant: 'neutral' },
  pending: { label: 'En attente', variant: 'warning' },
  published: { label: 'Publiée', variant: 'success' },
  rejected: { label: 'Refusée', variant: 'danger' },
  expired: { label: 'Expirée', variant: 'neutral' },
  filled: { label: 'Pourvue', variant: 'info' },
  archived: { label: 'Archivée', variant: 'neutral' },
};

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `il y a ${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  if (j < 30) return `il y a ${j} j`;
  const mo = Math.round(j / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  return `il y a ${Math.round(mo / 12)} an${Math.round(mo / 12) > 1 ? 's' : ''}`;
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export function ModerationCard({ announcement }: ModerationCardProps) {
  const status = statusVariant[announcement.status];
  const fullName = `${announcement.family.first_name} ${announcement.family.last_name}`.trim();

  return (
    <Card padding="md">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark truncate">
              {announcement.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-admin-muted-dark mt-0.5">
              {announcement.city}
            </p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <p
          className="text-sm text-gray-600 dark:text-admin-muted-dark overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {announcement.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-admin-muted-dark border-t border-gray-100 dark:border-admin-border-dark pt-3">
          <div className="min-w-0">
            <span className="block text-gray-500 dark:text-admin-muted-dark">Famille</span>
            <p className="font-medium text-gray-900 dark:text-admin-text-dark truncate">
              {fullName || 'Famille'}
            </p>
            {announcement.family.email && (
              <p className="truncate text-gray-500 dark:text-admin-muted-dark">
                {announcement.family.email}
              </p>
            )}
          </div>
          <div>
            <span className="block text-gray-500 dark:text-admin-muted-dark">Soumise</span>
            <p
              className="font-medium text-gray-900 dark:text-admin-text-dark"
              title={formatAbsolute(announcement.created_at)}
            >
              {formatRelative(announcement.created_at)}
            </p>
          </div>
        </div>

        <div className="pt-1">
          <Link href={`/admin/verifications/announcements/${announcement.id}`}>
            <Button variant="primary" size="sm" fullWidth>
              Examiner
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
