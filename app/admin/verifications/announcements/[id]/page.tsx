'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/admin/ui';
import { useToast } from '@/components/Toast';
import { RejectionDialog } from '@/components/admin/announcements/RejectionDialog';
import type {
  AnnouncementStatus,
  FamilyAnnouncement,
  AccompanimentType,
  DesiredProfession,
  TndContext,
  AnnouncementPlaceType,
} from '@/types';

interface FamilyInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
}

interface DetailResponse {
  announcement: FamilyAnnouncement;
  family: FamilyInfo | null;
  moderator: { email: string } | null;
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

const accompanimentLabels: Record<AccompanimentType, string> = {
  educatif: 'Éducatif',
  scolaire: 'Scolaire',
  sport_adapte: 'Sport adapté',
  guidance_parentale: 'Guidance parentale',
  comportemental: 'Comportemental',
  liberal: 'Libéral',
};

const professionLabels: Record<DesiredProfession, string> = {
  educateur_specialise: 'Éducateur spécialisé',
  psychomotricien: 'Psychomotricien',
  psychologue: 'Psychologue',
  ergotherapeute: 'Ergothérapeute',
  orthophoniste: 'Orthophoniste',
  aes_aesh: 'AES / AESH',
  sportif_adapte: 'Sportif adapté',
  autre: 'Autre',
};

const tndLabels: Record<TndContext, string> = {
  TSA: 'TSA',
  TDAH: 'TDAH',
  DYS: 'DYS',
  HPI: 'HPI',
  TDI: 'TDI',
  AUTRE: 'Autre',
};

const placeLabels: Record<AnnouncementPlaceType, string> = {
  domicile: 'Domicile',
  cabinet: 'Cabinet',
  ecole: 'École',
  institut: 'Institut',
  club_sport: 'Club de sport',
  autre: 'Autre',
};

const flexibilityLabels: Record<'immediate' | 'flexible' | 'fixed', string> = {
  immediate: 'Immédiat',
  flexible: 'Flexible',
  fixed: 'Date fixe',
};

const genderLabels: Record<'any' | 'male' | 'female', string> = {
  any: 'Indifférent',
  male: 'Homme',
  female: 'Femme',
};

function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return withTime
    ? d.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
    : d.toLocaleDateString('fr-FR', { dateStyle: 'long' } as Intl.DateTimeFormatOptions);
}

export default function AdminAnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionOpen, setRejectionOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur chargement');
      }
      const json = (await res.json()) as DetailResponse;
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePublish = async () => {
    if (!confirm('Publier cette annonce ? Elle sera visible des professionnels.')) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/announcements/${id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Erreur');
      showToast('Annonce publiée', 'success');
      router.push('/admin/verifications/announcements');
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de la publication', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (reason: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/announcements/${id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Erreur');
      setRejectionOpen(false);
      showToast('Annonce refusée', 'success');
      router.push('/admin/verifications/announcements');
    } catch (e: any) {
      showToast(e.message || 'Erreur lors du refus', 'error');
    } finally {
      setProcessing(false);
    }
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

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 dark:text-red-400">{error || 'Annonce introuvable'}</p>
        <Link
          href="/admin/verifications/announcements"
          className="text-primary-600 dark:text-primary-400 hover:underline mt-4 inline-block"
        >
          Retour à la file
        </Link>
      </div>
    );
  }

  const { announcement, family, moderator } = data;
  const statusInfo = statusVariant[announcement.status];
  const alreadyModerated = announcement.status !== 'pending';
  const familyFullName = family
    ? `${family.first_name} ${family.last_name}`.trim()
    : 'Famille';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/verifications/announcements"
            className="text-sm text-gray-500 dark:text-admin-muted-dark hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la file
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark mt-1">
            {announcement.title}
          </h1>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      {/* Bandeau famille */}
      <Card padding="lg">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-admin-muted-dark mb-3">
          Famille à l&apos;origine de l&apos;annonce
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-xs text-gray-500 dark:text-admin-muted-dark">Nom complet</span>
            <p className="font-medium text-gray-900 dark:text-admin-text-dark">{familyFullName}</p>
          </div>
          {family?.email && (
            <div>
              <span className="block text-xs text-gray-500 dark:text-admin-muted-dark">Email</span>
              <a
                href={`mailto:${family.email}`}
                className="font-medium text-primary-600 dark:text-primary-400 hover:underline break-all"
              >
                {family.email}
              </a>
            </div>
          )}
          {family?.phone && (
            <div>
              <span className="block text-xs text-gray-500 dark:text-admin-muted-dark">Téléphone</span>
              <a
                href={`tel:${family.phone}`}
                className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                {family.phone}
              </a>
            </div>
          )}
          <div>
            <span className="block text-xs text-gray-500 dark:text-admin-muted-dark">Ville annonce</span>
            <p className="font-medium text-gray-900 dark:text-admin-text-dark">
              {announcement.city}
              {announcement.postal_code ? ` (${announcement.postal_code})` : ''}
            </p>
          </div>
        </div>
      </Card>

      {/* Contenu */}
      <Card padding="lg">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-admin-muted-dark mb-3">
          Description
        </h2>
        <p className="text-sm text-gray-900 dark:text-admin-text-dark whitespace-pre-wrap leading-relaxed">
          {announcement.description}
        </p>
      </Card>

      {/* Besoins */}
      <Card padding="lg">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-admin-muted-dark mb-3">
          Besoins
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Types d'accompagnement">
            <TagList items={announcement.accompaniment_types.map((v) => accompanimentLabels[v] || v)} />
          </Field>
          <Field label="Profils professionnels recherchés">
            <TagList items={announcement.desired_professions.map((v) => professionLabels[v] || v)} />
          </Field>
          <Field label="Contexte TND">
            <TagList items={announcement.tnd_context.map((v) => tndLabels[v] || v)} />
          </Field>
          <Field label="Lieux d'intervention">
            <TagList items={announcement.place_types.map((v) => placeLabels[v] || v)} />
          </Field>
          <Field label="Âge de la personne">
            {announcement.person_age != null ? `${announcement.person_age} ans` : '—'}
          </Field>
          <Field label="Préférence de genre">
            {genderLabels[announcement.gender_preference]}
          </Field>
        </div>
      </Card>

      {/* Localisation & horaires */}
      <Card padding="lg">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-admin-muted-dark mb-3">
          Localisation & horaires
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Adresse">
            {announcement.location_label}
          </Field>
          <Field label="Rayon d'intervention">
            {announcement.radius_km} km
          </Field>
          <Field label="Volume horaire">
            {announcement.hours_per_week != null
              ? `${announcement.hours_per_week} h/semaine`
              : '—'}
          </Field>
          <Field label="Début souhaité">
            {announcement.start_date
              ? `${formatDate(announcement.start_date)} (${flexibilityLabels[announcement.start_date_flexibility]})`
              : flexibilityLabels[announcement.start_date_flexibility]}
          </Field>
          {announcement.schedule_preferences && (
            <Field label="Préférences horaires" full>
              <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-admin-surface-dark-2 rounded p-2 border border-gray-200 dark:border-admin-border-dark overflow-x-auto">
                {JSON.stringify(announcement.schedule_preferences, null, 2)}
              </pre>
            </Field>
          )}
        </div>
      </Card>

      {/* Historique */}
      <Card padding="lg">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-admin-muted-dark mb-3">
          Historique
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Créée le">{formatDate(announcement.created_at, true)}</Field>
          <Field label="Dernière modification">
            {formatDate(announcement.updated_at, true)}
          </Field>
          {announcement.moderated_at && (
            <Field label="Modérée le">
              {formatDate(announcement.moderated_at, true)}
              {moderator?.email ? ` par ${moderator.email}` : ''}
            </Field>
          )}
          {announcement.published_at && (
            <Field label="Publiée le">{formatDate(announcement.published_at, true)}</Field>
          )}
          {announcement.expires_at && (
            <Field label="Expire le">{formatDate(announcement.expires_at, true)}</Field>
          )}
        </div>

        {announcement.status === 'rejected' && announcement.rejection_reason && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs font-semibold uppercase text-red-700 dark:text-red-300 mb-1">
              Raison du refus
            </p>
            <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">
              {announcement.rejection_reason}
            </p>
          </div>
        )}
      </Card>

      {/* Actions */}
      <Card padding="lg">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-admin-muted-dark mb-3">
          Décision
        </h2>
        {alreadyModerated ? (
          <p className="text-sm text-gray-600 dark:text-admin-muted-dark">
            Cette annonce a déjà été modérée (statut : <strong>{statusInfo.label}</strong>).
            Plus d&apos;action possible depuis cet écran.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="success"
              size="lg"
              loading={processing}
              onClick={handlePublish}
            >
              Publier
            </Button>
            <Button
              variant="danger"
              size="lg"
              disabled={processing}
              onClick={() => setRejectionOpen(true)}
            >
              Refuser
            </Button>
          </div>
        )}
      </Card>

      <RejectionDialog
        open={rejectionOpen}
        loading={processing}
        onClose={() => (processing ? null : setRejectionOpen(false))}
        onConfirm={handleReject}
      />
    </div>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <span className="block text-xs text-gray-500 dark:text-admin-muted-dark mb-1">
        {label}
      </span>
      <div className="text-sm font-medium text-gray-900 dark:text-admin-text-dark">
        {children}
      </div>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-gray-500 dark:text-admin-muted-dark">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span
          key={it}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-admin-surface-dark-2 text-gray-700 dark:text-admin-muted-dark"
        >
          {it}
        </span>
      ))}
    </div>
  );
}
