'use client';

import Link from 'next/link';
import {
  FamilyAnnouncement,
  ACCOMPANIMENT_TYPE_LABELS,
  TND_CONTEXT_LABELS,
  PLACE_TYPE_LABELS,
  START_FLEX_LABELS,
  formatRelativeDate,
  AccompanimentType,
  TndContext,
  PlaceType,
} from './types';

type Props = {
  announcement: FamilyAnnouncement & { distance?: number };
  favorited?: boolean;
  onToggleFavorite?: (id: string, next: boolean) => void | Promise<void>;
};

const MAX_TAGS = 4;
const NEW_THRESHOLD_MS = 48 * 60 * 60 * 1000;

export default function AnnouncementListItem({ announcement, favorited, onToggleFavorite }: Props) {
  const a = announcement;
  const showHeart = typeof onToggleFavorite === 'function';

  const handleHeartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(a.id, !favorited);
  };

  const publishedTs = a.published_at ? new Date(a.published_at).getTime() : 0;
  const isNew = publishedTs > 0 && Date.now() - publishedTs < NEW_THRESHOLD_MS;

  const tags: { label: string; kind: 'accompaniment' | 'tnd' }[] = [
    ...(a.accompaniment_types || []).map((t) => ({
      label: ACCOMPANIMENT_TYPE_LABELS[t as AccompanimentType] || t,
      kind: 'accompaniment' as const,
    })),
    ...(a.tnd_context || []).map((t) => ({
      label: TND_CONTEXT_LABELS[t as TndContext] || t,
      kind: 'tnd' as const,
    })),
  ];
  const visibleTags = tags.slice(0, MAX_TAGS);
  const extraCount = tags.length - visibleTags.length;

  const placeLabel =
    (a.place_types || []).map((p) => PLACE_TYPE_LABELS[p as PlaceType] || p).join(', ') || null;

  const startLabel = a.start_date
    ? new Date(a.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : a.start_date_flexibility
      ? START_FLEX_LABELS[a.start_date_flexibility] || null
      : null;

  const hoursLabel =
    typeof a.hours_per_week === 'number' && a.hours_per_week > 0
      ? `${a.hours_per_week} h / sem`
      : null;

  const infoRows: { icon: JSX.Element; label: string; value: string }[] = [];
  if (placeLabel) {
    infoRows.push({
      icon: (
        <svg className="w-4 h-4" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: 'Lieu',
      value: placeLabel,
    });
  }
  if (startLabel) {
    infoRows.push({
      icon: (
        <svg className="w-4 h-4" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Début',
      value: startLabel,
    });
  }
  if (hoursLabel) {
    infoRows.push({
      icon: (
        <svg className="w-4 h-4" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Volume',
      value: hoursLabel,
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 hover:border-teal-200 transition-all duration-300 overflow-hidden group hover:-translate-y-1 relative">
      {/* Liseré gradient accent */}
      <div className="h-1" style={{ background: 'linear-gradient(90deg, #027e7e 0%, #f0879f 100%)' }} />

      {/* Bouton favoris (pro connecté) */}
      {showHeart && (
        <button
          type="button"
          onClick={handleHeartClick}
          aria-pressed={!!favorited}
          aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          title={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          <svg
            className="w-5 h-5 transition-colors"
            viewBox="0 0 24 24"
            fill={favorited ? '#f0879f' : 'none'}
            stroke={favorited ? '#f0879f' : '#9ca3af'}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      )}

      <div className="p-5 sm:p-6">
        {/* Mini-label catégorie + badge Nouveau */}
        <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f0879f' }} />
            Annonce famille
          </span>
          {isNew && (
            <span
              className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white shadow-sm"
              style={{ backgroundColor: '#f0879f' }}
            >
              ✨ Nouveau
            </span>
          )}
        </div>

        {/* Titre */}
        <h3
          className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors line-clamp-2 text-center leading-snug"
          style={{ fontFamily: 'Verdana, sans-serif' }}
        >
          {a.title}
        </h3>

        {/* Ville + date */}
        <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1 mt-2 text-xs sm:text-sm text-gray-500">
          {a.city && (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-gray-700">{a.city}</span>
              {typeof a.distance === 'number' && (
                <span className="text-gray-400">· {a.distance} km</span>
              )}
            </span>
          )}
          <span aria-hidden="true" className="text-gray-300">·</span>
          <span>{formatRelativeDate(a.published_at || a.created_at)}</span>
        </div>

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3.5 mb-5">
            {visibleTags.map((tag, i) => (
              <span
                key={`${tag.kind}-${i}`}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                style={
                  tag.kind === 'accompaniment'
                    ? {
                        backgroundColor: 'rgba(2, 126, 126, 0.08)',
                        color: '#027e7e',
                        borderColor: 'rgba(2, 126, 126, 0.25)',
                      }
                    : {
                        backgroundColor: 'rgba(240, 135, 159, 0.12)',
                        color: '#b9456d',
                        borderColor: 'rgba(240, 135, 159, 0.3)',
                      }
                }
              >
                {tag.label}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                + {extraCount}
              </span>
            )}
          </div>
        )}

        {/* Bloc info : grille 2 colonnes */}
        {infoRows.length > 0 && (
          <div className="border-t border-gray-100 pt-4 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-center gap-2.5">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'rgba(2, 126, 126, 0.08)' }}
                  >
                    {row.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{row.label}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA pleine largeur */}
        <Link
          href={`/annonces/${a.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #027e7e 0%, #035e5e 100%)' }}
          aria-label={`Voir l'annonce ${a.title}`}
        >
          <span>Voir l'annonce</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
