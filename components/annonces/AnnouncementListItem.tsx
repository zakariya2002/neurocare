'use client';

import Link from 'next/link';
import {
  FamilyAnnouncement,
  ACCOMPANIMENT_TYPE_LABELS,
  TND_CONTEXT_LABELS,
  PLACE_TYPE_LABELS,
  GENDER_LABELS_PERSON,
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

export default function AnnouncementListItem({ announcement, favorited, onToggleFavorite }: Props) {
  const a = announcement;
  const showHeart = typeof onToggleFavorite === 'function';

  const handleHeartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(a.id, !favorited);
  };

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
    (a.place_types || [])
      .map((p) => PLACE_TYPE_LABELS[p as PlaceType] || p)
      .join(', ') || null;

  const startLabel = a.start_date
    ? new Date(a.start_date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : a.start_date_flexibility
      ? START_FLEX_LABELS[a.start_date_flexibility] || null
      : null;

  const genderLabel = a.gender_preference
    ? GENDER_LABELS_PERSON[a.gender_preference]
    : null;

  const hoursLabel =
    typeof a.hours_per_week === 'number' && a.hours_per_week > 0
      ? `${a.hours_per_week} h / semaine`
      : null;

  const ageLabel = typeof a.person_age === 'number' ? `${a.person_age} ans` : null;

  // Lignes d'info structurées style Take-Caire
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
  if (genderLabel) {
    infoRows.push({
      icon: (
        <svg className="w-4 h-4" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Sexe',
      value: genderLabel,
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
  if (ageLabel) {
    infoRows.push({
      icon: (
        <svg className="w-4 h-4" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      label: 'Âge',
      value: ageLabel,
    });
  }

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group hover:-translate-y-1 relative">
      {showHeart && (
        <button
          type="button"
          onClick={handleHeartClick}
          aria-pressed={!!favorited}
          aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
          title={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
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
      <div className="p-4 sm:p-5">
        {/* Titre + ville + date (centrés) */}
        <div className="mb-3 text-center">
          <h3
            className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors line-clamp-2"
            style={{ fontFamily: 'Verdana, sans-serif' }}
          >
            {a.title}
          </h3>
          <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1 mt-1 text-xs sm:text-sm text-gray-500">
            {a.city && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {a.city}
                {typeof a.distance === 'number' && (
                  <span className="ml-1 text-gray-400">· {a.distance} km</span>
                )}
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span>{formatRelativeDate(a.published_at || a.created_at)}</span>
          </div>
        </div>

        {/* Tags accompagnement + TND (centrés) */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
            {visibleTags.map((tag, i) => (
              <span
                key={`${tag.kind}-${i}`}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border"
                style={
                  tag.kind === 'accompaniment'
                    ? {
                        backgroundColor: 'rgba(2, 126, 126, 0.08)',
                        color: '#027e7e',
                        borderColor: 'rgba(2, 126, 126, 0.2)',
                      }
                    : {
                        backgroundColor: 'rgba(240, 135, 159, 0.1)',
                        color: '#b9456d',
                        borderColor: 'rgba(240, 135, 159, 0.25)',
                      }
                }
              >
                {tag.label}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                + {extraCount}
              </span>
            )}
          </div>
        )}

        {/* Bloc info structuré (centré, style Take-Caire) */}
        {infoRows.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mb-4 space-y-1.5">
            {infoRows.map((row) => (
              <div key={row.label} className="flex items-center justify-center gap-2 text-sm">
                {row.icon}
                <span className="text-gray-500 font-medium">{row.label} :</span>
                <span className="text-gray-800 font-semibold">{row.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center">
          <Link
            href={`/annonces/${a.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg"
            style={{ backgroundColor: '#027e7e' }}
            aria-label={`Voir l'annonce ${a.title}`}
          >
            Voir l'annonce
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
