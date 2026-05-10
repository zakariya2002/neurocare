'use client';

import {
  SCHOOL_TYPE_LABELS,
  SCHOOL_DEVICE_LABELS,
  type SchoolYearRow,
} from '@/lib/family/scolarite';

interface SchoolYearSummaryProps {
  year: SchoolYearRow;
}

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
    return { label: `ESS prévue passée (${Math.abs(days)} j)`, tone: 'late' };
  }
  if (days <= 30) {
    return { label: `ESS dans ${days} j`, tone: 'soon' };
  }
  return { label: `Prochaine ESS : ${formatDate(year.next_ess_date)}`, tone: 'neutral' };
}

export default function SchoolYearSummary({ year }: SchoolYearSummaryProps) {
  const ess = essStatus(year);
  const lastEss = formatDate(year.last_ess_date);

  const fullAddress = [year.school_address, [year.school_postal_code, year.school_city]
    .filter(Boolean)
    .join(' ')]
    .filter((part) => part && part.trim().length > 0)
    .join(' — ');

  return (
    <div className="space-y-5">
      {/* Bandeau confidentialité */}
      <div
        className="rounded-xl border p-3 sm:p-4 text-xs sm:text-sm"
        style={{
          backgroundColor: 'rgba(58, 158, 158, 0.07)',
          borderColor: 'rgba(58, 158, 158, 0.25)',
          color: '#015c5c',
        }}
        role="note"
      >
        Cet espace centralise les <strong>métadonnées scolaires</strong> (école,
        dispositif, AESH, ESS). Il <strong>ne stocke pas</strong> vos documents
        médicaux ; le coffre-fort sécurisé arrivera prochainement.
      </div>

      {/* École */}
      <section>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
          Établissement
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow
            label="Nom"
            value={year.school_name}
            placeholder="Non renseigné"
          />
          <InfoRow
            label="Type"
            value={year.school_type ? SCHOOL_TYPE_LABELS[year.school_type] : null}
            placeholder="Non précisé"
          />
          <InfoRow
            label="Classe / niveau"
            value={year.level}
            placeholder="Non renseigné"
          />
          <InfoRow
            label="Adresse"
            value={fullAddress || null}
            placeholder="Non renseignée"
          />
        </div>
      </section>

      {/* Enseignant principal */}
      {(year.teacher_name || year.teacher_email || year.teacher_phone) && (
        <section>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
            Enseignant principal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InfoRow label="Nom" value={year.teacher_name} placeholder="—" />
            <InfoRow
              label="Email"
              value={
                year.teacher_email ? (
                  <a
                    href={`mailto:${year.teacher_email}`}
                    className="hover:underline"
                    style={{ color: '#027e7e' }}
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
                    style={{ color: '#027e7e' }}
                  >
                    {year.teacher_phone}
                  </a>
                ) : null
              }
              placeholder="—"
            />
          </div>
        </section>
      )}

      {/* Dispositifs */}
      <section>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
          Dispositif(s)
        </h3>
        {year.devices.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun dispositif renseigné.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {year.devices.map((d) => (
              <span
                key={d}
                className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border"
                style={{
                  backgroundColor: 'rgba(2, 126, 126, 0.08)',
                  color: '#027e7e',
                  borderColor: 'rgba(2, 126, 126, 0.25)',
                }}
              >
                {SCHOOL_DEVICE_LABELS[d]}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* AESH */}
      <section>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
          AESH
        </h3>
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
            <InfoRow
              label="Prénom"
              value={year.aesh_first_name}
              placeholder="—"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">Pas d'AESH renseigné cette année.</p>
        )}
      </section>

      {/* ESS */}
      <section>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
          Équipe de Suivi de Scolarité
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow label="Dernière ESS" value={lastEss} placeholder="Non renseignée" />
          <InfoRow
            label="Prochaine ESS"
            value={
              year.next_ess_date ? (
                <span className="flex items-center gap-2">
                  {formatDate(year.next_ess_date)}
                  {ess && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        ess.tone === 'late'
                          ? 'bg-red-100 text-red-700'
                          : ess.tone === 'soon'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ess.label}
                    </span>
                  )}
                </span>
              ) : null
            }
            placeholder="Non programmée"
          />
        </div>
      </section>

      {/* Notes */}
      {year.notes && (
        <section>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
            Notes administratives
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 border border-gray-200 rounded-xl p-3">
            {year.notes}
          </p>
        </section>
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
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <div className="text-sm text-gray-900 mt-0.5">
        {value ?? <span className="text-gray-400">{placeholder}</span>}
      </div>
    </div>
  );
}
