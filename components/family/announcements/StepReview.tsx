'use client';

import {
  AnnouncementFormData,
  ACCOMPANIMENT_OPTIONS,
  PROFESSION_OPTIONS,
  TND_OPTIONS,
  PLACE_OPTIONS,
  SCHEDULE_OPTIONS,
  ChildProfileLite,
} from './types';

interface StepReviewProps {
  data: AnnouncementFormData;
  childrenList: ChildProfileLite[];
}

function labelOf(options: { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label || value;
}

function joinLabels(options: { value: string; label: string }[], values: string[]): string {
  if (!values.length) return '—';
  return values.map((v) => labelOf(options, v)).join(', ');
}

function flexibilityLabel(v: string): string {
  if (v === 'immediate') return 'Immédiat';
  if (v === 'fixed') return 'Date fixe';
  return 'Flexible';
}

function genderLabel(v: string): string {
  if (v === 'male') return 'Masculin';
  if (v === 'female') return 'Féminin';
  return 'Indifférent';
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ color: '#027e7e' }}>
        {title}
      </h3>
      <div className="space-y-2 text-sm text-gray-700">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-right font-medium text-gray-800">{value || '—'}</span>
    </div>
  );
}

export default function StepReview({ data, childrenList }: StepReviewProps) {
  const linkedChild = data.child_id ? childrenList.find((c) => c.id === data.child_id) : null;

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-4 text-sm"
        style={{ backgroundColor: 'rgba(2, 126, 126, 0.05)', border: '1px solid rgba(2, 126, 126, 0.2)' }}
      >
        Vérifiez les informations avant publication. Vous pourrez modifier l&apos;annonce tant qu&apos;elle n&apos;est pas pourvue.
      </div>

      <Block title="Besoin">
        <Row label="Titre" value={data.title} />
        <div>
          <p className="text-gray-500 mb-1">Description</p>
          <p className="whitespace-pre-wrap text-gray-800">{data.description || '—'}</p>
        </div>
        <Row label="Accompagnement" value={joinLabels(ACCOMPANIMENT_OPTIONS, data.accompaniment_types)} />
        <Row label="Professions" value={joinLabels(PROFESSION_OPTIONS, data.desired_professions)} />
        <Row label="Contexte TND" value={joinLabels(TND_OPTIONS, data.tnd_context)} />
      </Block>

      <Block title="Personne accompagnée">
        <Row
          label="Proche"
          value={linkedChild ? `${linkedChild.first_name} ${linkedChild.last_name || ''}` : 'Adulte / non lié'}
        />
        <Row label="Âge" value={data.person_age !== null ? `${data.person_age} ans` : '—'} />
        <Row label="Préférence pro" value={genderLabel(data.gender_preference)} />
      </Block>

      <Block title="Lieu & horaires">
        <Row label="Adresse" value={data.location_label} />
        <Row label="Ville" value={data.city ? `${data.city} (${data.postal_code})` : '—'} />
        <Row label="Rayon" value={`${data.radius_km} km`} />
        <Row label="Lieux" value={joinLabels(PLACE_OPTIONS, data.place_types)} />
        <Row label="Volume" value={data.hours_per_week ? `${data.hours_per_week} h / sem.` : '—'} />
        <Row label="Créneaux" value={joinLabels(SCHEDULE_OPTIONS, data.schedule_preferences)} />
        <Row label="Début" value={data.start_date || '—'} />
        <Row label="Flexibilité" value={flexibilityLabel(data.start_date_flexibility)} />
      </Block>

      <p className="text-xs text-gray-500 text-center px-4">
        Votre annonce sera publiée après validation par notre équipe (24-48h).
      </p>
    </div>
  );
}
