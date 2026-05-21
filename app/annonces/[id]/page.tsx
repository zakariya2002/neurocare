'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import RespondModal from '@/components/annonces/RespondModal';
import {
  FamilyAnnouncement,
  ACCOMPANIMENT_TYPE_LABELS,
  TND_CONTEXT_LABELS,
  PLACE_TYPE_LABELS,
  GENDER_LABELS_PERSON,
  PROFESSION_LABELS,
  START_FLEX_LABELS,
  AccompanimentType,
  TndContext,
  PlaceType,
  GenderPreference,
  formatRelativeDate,
  formatDateFr,
} from '@/components/annonces/types';
import { supabase } from '@/lib/supabase';
import { getProfessionByValue } from '@/lib/professions-config';

type AccessState =
  | { kind: 'loading' }
  | { kind: 'anonymous' }
  | { kind: 'not-educator' }
  | { kind: 'unverified' }
  | { kind: 'already-responded' }
  | { kind: 'allowed' };

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<FamilyAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [access, setAccess] = useState<AccessState>({ kind: 'loading' });
  const [modalOpen, setModalOpen] = useState(false);
  const [favorited, setFavorited] = useState<boolean>(false);
  const [isPro, setIsPro] = useState<boolean>(false);

  const fetchAnnouncement = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/announcements/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        setAnnouncement(null);
        return;
      }
      const data = await res.json();
      setAnnouncement(data.announcement || null);
    } catch (err) {
      console.error('Erreur fetch annonce:', err);
      setAnnouncement(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkAccess = useCallback(async () => {
    if (!id) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setAccess({ kind: 'anonymous' });
      return;
    }
    const role = session.user.user_metadata?.role;
    if (role !== 'educator') {
      setAccess({ kind: 'not-educator' });
      return;
    }
    // Vérifier le profil éducateur
    const { data: profile } = await supabase
      .from('educator_profiles')
      .select('id, verification_badge')
      .eq('user_id', session.user.id)
      .single();
    if (!profile?.verification_badge) {
      setAccess({ kind: 'unverified' });
      return;
    }
    // Vérifier si déjà répondu
    try {
      const res = await fetch('/api/educator/responses');
      if (res.ok) {
        const data = await res.json();
        const already = (data.items || data.responses || []).some(
          (r: any) => r.announcement_id === id && r.status !== 'withdrawn',
        );
        if (already) {
          setAccess({ kind: 'already-responded' });
          return;
        }
      }
    } catch {
      // best effort
    }
    setAccess({ kind: 'allowed' });
  }, [id]);

  useEffect(() => {
    fetchAnnouncement();
    checkAccess();
  }, [fetchAnnouncement, checkAccess]);

  // Sync favori du pro
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch('/api/educator/favorite-ids', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { isPro: false, ids: [] }))
      .then((data) => {
        if (cancelled) return;
        setIsPro(!!data.isPro);
        setFavorited(Array.isArray(data.ids) && data.ids.includes(id));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!id || !isPro) return;
    const next = !favorited;
    setFavorited(next); // optimistic
    try {
      const res = await fetch(`/api/announcements/${id}/favorite`, {
        method: next ? 'POST' : 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Favori échoué');
    } catch {
      setFavorited(!next); // rollback
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    fetchAnnouncement();
    checkAccess();
  };

  if (notFound) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
        <PublicNavbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Annonce introuvable</h1>
          <p className="text-gray-600 mb-6">
            Cette annonce n'existe plus ou n'est plus disponible.
          </p>
          <Link
            href="/annonces"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition-all"
            style={{ backgroundColor: '#027e7e' }}
          >
            Voir toutes les annonces
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !announcement) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        <PublicNavbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4"
            style={{
              borderTopColor: '#027e7e',
              borderRightColor: 'rgba(2, 126, 126, 0.2)',
              borderBottomColor: 'rgba(2, 126, 126, 0.2)',
              borderLeftColor: 'rgba(2, 126, 126, 0.2)',
            }}
            aria-hidden="true"
          />
          <p className="text-gray-500 mt-4">Chargement…</p>
        </div>
      </div>
    );
  }

  const a = announcement;
  const personLabel = typeof a.person_age === 'number'
    ? a.person_age >= 18
      ? `Pour un adulte de ${a.person_age} ans`
      : `Pour un enfant de ${a.person_age} ans`
    : 'Personne accompagnée';

  const localizationLabel = a.city
    ? a.radius_km
      ? `Dans un rayon de ${a.radius_km} km autour de ${a.city}`
      : a.city
    : '—';

  const hoursLabel =
    typeof a.hours_per_week === 'number' && a.hours_per_week > 0
      ? `${a.hours_per_week} h / semaine`
      : 'À définir';

  const startFlexLabel = a.start_date_flexibility
    ? START_FLEX_LABELS[a.start_date_flexibility] || a.start_date_flexibility
    : '';
  const startLabel = a.start_date
    ? `${formatDateFr(a.start_date)}${startFlexLabel ? ` · ${startFlexLabel}` : ''}`
    : startFlexLabel || 'À définir';

  const familyName = `${a.family?.first_name || 'Famille'}${a.family?.last_name_initial ? ` ${a.family.last_name_initial}` : ''}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12">
        <Link
          href="/annonces"
          className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full text-sm font-semibold bg-white border-2 shadow-sm hover:shadow-md transition-all"
          style={{ borderColor: '#027e7e', color: '#027e7e' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux annonces
        </Link>

        {/* Carte principale */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-1" style={{ backgroundColor: '#027e7e' }} />
          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div className="min-w-0">
                <h1
                  className="text-2xl sm:text-3xl font-bold text-gray-900"
                  style={{ fontFamily: 'Verdana, sans-serif' }}
                >
                  {a.title}
                </h1>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Publiée {formatRelativeDate(a.published_at || a.created_at)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {a.response_count || 0} réponse{(a.response_count || 0) > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPro && (
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    aria-pressed={favorited}
                    aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    title={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
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
                {a.status === 'published' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border" style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    color: '#15803d',
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                  }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#15803d' }} aria-hidden="true"></span>
                    Publiée
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border bg-gray-100 text-gray-600 border-gray-200">
                    {a.status === 'filled' ? 'Pourvue' : a.status === 'archived' ? 'Archivée' : a.status === 'expired' ? 'Expirée' : 'Brouillon'}
                  </span>
                )}
              </div>
            </div>

            {/* Description (cachée si vide ou identique au titre) */}
            {a.description && a.description.trim() !== a.title.trim() && (
              <div className="prose prose-sm max-w-none mb-6 border-l-4 pl-4 py-1" style={{ borderColor: 'rgba(2, 126, 126, 0.3)' }}>
                <p className="text-gray-800 whitespace-pre-line leading-relaxed">{a.description}</p>
              </div>
            )}

            {/* Tags accompagnement */}
            {a.accompaniment_types?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Type d'accompagnement
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {a.accompaniment_types.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                      style={{
                        backgroundColor: 'rgba(2, 126, 126, 0.08)',
                        color: '#027e7e',
                        borderColor: 'rgba(2, 126, 126, 0.2)',
                      }}
                    >
                      {ACCOMPANIMENT_TYPE_LABELS[t as AccompanimentType] || t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags professions souhaitées */}
            {a.desired_professions?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Profession recherchée
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {a.desired_professions.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {PROFESSION_LABELS[p] || getProfessionByValue(p)?.label || p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags TND */}
            {a.tnd_context?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Contexte TND
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {a.tnd_context.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                      style={{
                        backgroundColor: 'rgba(240, 135, 159, 0.1)',
                        color: '#b9456d',
                        borderColor: 'rgba(240, 135, 159, 0.25)',
                      }}
                    >
                      {TND_CONTEXT_LABELS[t as TndContext] || t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags lieux */}
            {a.place_types?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Lieu d'intervention
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {a.place_types.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-amber-50 text-amber-800 border-amber-200"
                    >
                      {PLACE_TYPE_LABELS[p as PlaceType] || p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Infos clés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <InfoBlock
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                label="Personne accompagnée"
                value={personLabel}
                extra={
                  a.gender_preference && a.gender_preference !== 'any'
                    ? `Préférence : ${GENDER_LABELS_PERSON[a.gender_preference as GenderPreference].toLowerCase()}`
                    : null
                }
              />
              <InfoBlock
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
                label="Localisation"
                value={localizationLabel}
              />
              <InfoBlock
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                label="Horaires"
                value={hoursLabel}
                extra={formatSchedulePreferences(a.schedule_preferences)}
              />
              <InfoBlock
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                label="Début souhaité"
                value={startLabel}
              />
            </div>

            {/* Famille (anonymisée) */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 mb-6 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: '#027e7e' }}
                aria-hidden="true"
              >
                {(a.family?.first_name?.charAt(0) || 'F').toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{familyName}</p>
                <p className="text-xs text-gray-500">
                  Coordonnées partagées uniquement après acceptation de votre réponse
                </p>
              </div>
            </div>

            {/* CTA Répondre */}
            <CTASection
              access={access}
              announcementId={a.id}
              onOpenModal={() => setModalOpen(true)}
            />
          </div>
        </div>
      </div>

      <RespondModal
        announcementId={a.id}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

const SCHEDULE_TAG_LABELS: Record<string, string> = {
  matin: 'Matin',
  apres_midi: 'Après-midi',
  soir: 'Soir',
  week_end: 'Week-end',
};

function formatSchedulePreferences(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.map((t) => SCHEDULE_TAG_LABELS[t] || t).join(', ') || null;
  }
  if (typeof value === 'object') {
    const tags = Array.isArray(value.tags) ? value.tags : [];
    if (tags.length === 0) return null;
    return tags.map((t: string) => SCHEDULE_TAG_LABELS[t] || t).join(', ');
  }
  return null;
}

function InfoBlock({
  icon,
  label,
  value,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  extra?: string | null;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
        <span style={{ color: '#027e7e' }}>{icon}</span>
        {label}
      </div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
      {extra && <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{extra}</p>}
    </div>
  );
}

function CTASection({
  access,
  announcementId,
  onOpenModal,
}: {
  access: AccessState;
  announcementId: string;
  onOpenModal: () => void;
}) {
  if (access.kind === 'loading') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 flex items-center justify-center">
        <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-teal-600 rounded-full" aria-hidden="true" />
      </div>
    );
  }

  if (access.kind === 'anonymous') {
    return (
      <div className="rounded-xl border-2 border-teal-200 bg-teal-50 px-4 py-4">
        <p className="text-sm text-gray-700 mb-3">
          Connectez-vous pour répondre à cette annonce avec votre compte professionnel.
        </p>
        <Link
          href={`/auth/login?redirect=${encodeURIComponent(`/annonces/${announcementId}`)}`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition-all"
          style={{ backgroundColor: '#027e7e' }}
        >
          Me connecter
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    );
  }

  if (access.kind === 'not-educator') {
    return (
      <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-4">
        <p className="text-sm text-gray-800">
          <strong>Connectez-vous avec un compte professionnel</strong> pour répondre à cette annonce.
          Les annonces familles sont réservées aux professionnels vérifiés.
        </p>
      </div>
    );
  }

  if (access.kind === 'unverified') {
    return (
      <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-4">
        <p className="text-sm text-gray-800">
          <strong>Validation de votre profil en cours</strong> — vous pourrez répondre dès qu'il sera vérifié.
        </p>
        <Link
          href="/dashboard/educator/diploma"
          className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-amber-700 hover:text-amber-800"
        >
          Voir l'état de vérification →
        </Link>
      </div>
    );
  }

  if (access.kind === 'already-responded') {
    return (
      <div className="rounded-xl border-2 border-teal-200 bg-teal-50 px-4 py-4">
        <p className="text-sm text-gray-800 mb-2">
          <strong>Vous avez déjà répondu à cette annonce.</strong>
        </p>
        <Link
          href="/dashboard/educator/announcements"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
        >
          Voir mes candidatures →
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenModal}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:opacity-90 transition-all"
      style={{ backgroundColor: '#027e7e' }}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      Répondre à cette annonce
    </button>
  );
}
