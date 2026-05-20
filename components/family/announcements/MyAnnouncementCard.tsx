'use client';

import Link from 'next/link';
import { FamilyAnnouncement, STATUS_COLORS, STATUS_LABELS } from './types';

interface MyAnnouncementCardProps {
  announcement: FamilyAnnouncement;
  onArchive?: (id: string) => void;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function MyAnnouncementCard({ announcement, onArchive }: MyAnnouncementCardProps) {
  const status = announcement.status;
  const colors = STATUS_COLORS[status];
  const canEdit = ['draft', 'pending', 'rejected', 'expired'].includes(status);
  const canArchive = !['archived'].includes(status);

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <Link
              href={`/dashboard/family/announcements/${announcement.id}`}
              className="font-bold text-gray-900 hover:underline text-base sm:text-lg block truncate"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              {announcement.title}
            </Link>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {announcement.city && (
                <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {announcement.city}
                </span>
              )}
              <span className="text-xs text-gray-400">Créée le {formatDate(announcement.created_at)}</span>
            </div>
          </div>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
            style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>

        {status === 'rejected' && announcement.rejection_reason && (
          <div className="mb-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', color: '#991b1b' }}>
            <span className="font-semibold">Motif de refus : </span>
            {announcement.rejection_reason}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-2v-2H7v2H5a2 2 0 01-2-2V10a2 2 0 012-2h2V6a2 2 0 012-2h6a2 2 0 012 2v2zM9 6h6v2H9V6z"
              />
            </svg>
            {announcement.response_count ?? 0} réponse(s)
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          <Link
            href={`/dashboard/family/announcements/${announcement.id}`}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)', color: '#027e7e' }}
          >
            Voir le détail
          </Link>
          {canEdit && (
            <Link
              href={`/dashboard/family/announcements/${announcement.id}/edit`}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
            >
              Modifier
            </Link>
          )}
          {canArchive && onArchive && (
            <button
              type="button"
              onClick={() => onArchive(announcement.id)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              Archiver
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
