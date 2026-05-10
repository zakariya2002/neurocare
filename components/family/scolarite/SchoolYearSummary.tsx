'use client';

import {
  SCHOOL_TYPE_LABELS,
  SCHOOL_DEVICE_LABELS,
  type SchoolDevice,
  type SchoolYearRow,
} from '@/lib/family/scolarite';

interface SchoolYearSummaryProps {
  year: SchoolYearRow;
}

/** Couleurs pastel par dispositif scolaire (cohérent avec SchoolYearForm) */
const DEVICE_STYLES: Record<SchoolDevice, { bg: string; color: string; border: string }> = {
  pps: { bg: '#cffafe', color: '#0891b2', border: '#67e8f9' },
  pap: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
  pai: { bg: '#fce7f3', color: '#be185d', border: '#f9a8d4' },
  ppre: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  ulis: { bg: '#ede9fe', color: '#7c3aed', border: '#c4b5fd' },
  segpa: { bg: '#c9eaea', color: '#015c5c', border: '#3a9e9e' },
  aucun: { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db' },
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function essStatus(year: SchoolYearRow): {
  label: string;
  tone: 'neutral' | 'soon' | 'late';
} | null {
  if (!year.next_ess_date) return null;
  const next = new Date(year.next_ess_date);
  const now = new Date();
  const days = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return { label: `ESS passée (${Math.abs(days)} j)`, tone: 'late' };
  }
  if (days <= 30) {
    return { label: `ESS imminente · ${days} j`, tone: 'soon' };
  }
  return { label: `ESS prochaine · ${formatDate(year.next_ess_date)}`, tone: 'neutral' };
}

interface InfoSectionProps {
  iconPath: string;
  title: string;
  children: React.ReactNode;
}

function InfoSection({ iconPath, title, children }: InfoSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#e6f4f4' }}
          aria-hidden="true"
        >
          <svg className="w-3.5 h-3.5" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={iconPath} />
          </svg>
        </span>
        <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="pl-9">{children}</div>
    </section>
  );
}

export default function SchoolYearSummary({ year }: SchoolYearSummaryProps) {
  const ess = essStatus(year);
  const lastEss = formatDate(year.last_ess_date);

  const fullAddress = [
    year.school_address,
    [year.school_postal_code, year.school_city].filter(Boolean).join(' '),
  ]
    .filter((part) => part && part.trim().length > 0)
    .join(' — ');

  return (
    <div className="space-y-5">
      {/* École */}
      <InfoSection
        title="Établissement"
        iconPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow label="Nom" value={year.school_name} placeholder="Non renseigné" />
          <InfoRow
            label="Type"
            value={year.school_type ? SCHOOL_TYPE_LABELS[year.school_type] : null}
            placeholder="Non précisé"
          />
          <InfoRow label="Classe / niveau" value={year.level} placeholder="Non renseigné" />
          <InfoRow label="Adresse" value={fullAddress || null} placeholder="Non renseignée" />
        </div>
      </InfoSection>

      {/* Enseignant principal */}
      {(year.teacher_name || year.teacher_email || year.teacher_phone) && (
        <InfoSection
          title="Enseignant principal"
          iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InfoRow label="Nom" value={year.teacher_name} placeholder="—" />
            <InfoRow
              label="Email"
              value={
                year.teacher_email ? (
                  <a
                    href={`mailto:${year.teacher_email}`}
                    className="hover:underline break-all"
                    style={{ color: '#3a9e9e' }}
                  >
                    {year.teacher_email}
                  </a>
                ) : null
              }
              placeholder="—"
            />
            <InfoRow
              label="Téléphone"
              value={
                year.teacher_phone ? (
                  <a
                    href={`tel:${year.teacher_phone.replace(/\s+/g, '')}`}
                    className="hover:underline"
                    style={{ color: '#3a9e9e' }}
                  >
                    {year.teacher_phone}
                  </a>
                ) : null
              }
              placeholder="—"
            />
          </div>
        </InfoSection>
      )}

      {/* Dispositifs en badges colorés */}
      <InfoSection
        title="Dispositif(s)"
        iconPath="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      >
        {year.devices.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun dispositif renseigné.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {year.devices.map((d) => {
              const ds = DEVICE_STYLES[d];
              return (
                <span
                  key={d}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border"
                  style={{
                    backgroundColor: ds.bg,
                    color: ds.color,
                    borderColor: ds.border,
                    fontFamily: 'Verdana, sans-serif',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ds.color }} aria-hidden="true" />
                  {SCHOOL_DEVICE_LABELS[d]}
                </span>
              );
            })}
          </div>
        )}
      </InfoSection>

      {/* AESH */}
      <InfoSection
        title="AESH"
        iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      >
        {year.has_aesh ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow
              label="Quotité hebdomadaire"
              value={
                year.aesh_hours_per_week !== null
                  ? `${year.aesh_hours_per_week} h / semaine`
                  : null
              }
              placeholder="Non précisée"
            />
            <InfoRow label="Prénom" value={year.aesh_first_name} placeholder="—" />
          </div>
        ) : (
          <p className="text-sm text-gray-500">Pas d'AESH renseigné cette année.</p>
        )}
      </InfoSection>

      {/* ESS avec badges status */}
      <InfoSection
        title="Équipe de Suivi de Scolarité"
        iconPath="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow label="Dernière ESS" value={lastEss} placeholder="Non renseignée" />
          <InfoRow
            label="Prochaine ESS"
            value={
              year.next_ess_date ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span>{formatDate(year.next_ess_date)}</span>
                  {ess && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${
                        ess.tone === 'late'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : ess.tone === 'soon'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {ess.label}
                    </span>
                  )}
                </div>
              ) : null
            }
            placeholder="Non programmée"
          />
        </div>
      </InfoSection>

      {/* Notes */}
      {year.notes && (
        <InfoSection
          title="Notes administratives"
          iconPath="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        >
          <div
            className="text-sm text-gray-700 whitespace-pre-line rounded-xl p-3 border"
            style={{ backgroundColor: '#fdf9f4', borderColor: '#f3e8d4' }}
          >
            {year.notes}
          </div>
        </InfoSection>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: React.ReactNode;
  placeholder: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
        {label}
      </p>
      <div className="text-sm text-gray-900 mt-0.5">
        {value ?? <span className="text-gray-400">{placeholder}</span>}
      </div>
    </div>
  );
}
