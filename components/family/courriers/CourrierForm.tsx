'use client';

/**
 * Formulaire client pour générer un courrier administratif.
 *
 * - Pré-remplit les champs avec les infos du parent / enfant.
 * - Sélecteur d'enfant si plusieurs proches.
 * - Aperçu PDF dans une modale avec iframe (Object URL).
 * - Téléchargement PDF (POST /api/family/courriers/[modele]).
 */

import { useEffect, useMemo, useState } from 'react';
import type {
  CourrierModeleDef,
  CourrierFieldDef,
} from '@/lib/pdf/courriers/templates';

interface ChildOption {
  id: string;
  firstName: string;
  lastName: string | null;
  birthDate: string | null;
}

interface MdphInfo {
  mdphNumber: string | null;
  departmentCode: string | null;
}

interface CourrierFormProps {
  modele: CourrierModeleDef;
  children: ChildOption[];
  mdphByChild: Record<string, MdphInfo>;
  family: {
    parentFullName: string;
    location: string;
    phone: string;
    email: string;
  };
}

const ACCENT = '#2563eb'; // Accent bleu courrier
const ACCENT_BG = '#dbeafe';
const TEAL = '#027e7e';

function buildInitialFields(
  modele: CourrierModeleDef,
  mdph: MdphInfo | undefined
): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const f of modele.fields) {
    initial[f.name] = '';
  }
  // Pré-remplissage MDPH si dispo
  if (mdph?.mdphNumber && Object.prototype.hasOwnProperty.call(initial, 'mdph_number')) {
    initial.mdph_number = mdph.mdphNumber;
  }
  return initial;
}

export default function CourrierForm({
  modele,
  children,
  mdphByChild,
  family,
}: CourrierFormProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>(
    children[0]?.id ?? ''
  );

  const [recipientAddressBlock, setRecipientAddressBlock] = useState<string>(
    modele.defaultRecipient
  );
  const [objectField, setObjectField] = useState<string>(modele.defaultObject);

  const initialFields = useMemo(
    () => buildInitialFields(modele, mdphByChild[selectedChildId]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modele.id, selectedChildId]
  );

  const [fields, setFields] = useState<Record<string, string>>(initialFields);

  useEffect(() => {
    setFields(initialFields);
  }, [initialFields]);

  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cleanup de l'object URL d'aperçu
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFieldChange = (name: string, value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (!selectedChildId) return "Veuillez sélectionner l'enfant concerné.";
    if (!recipientAddressBlock.trim())
      return 'Le destinataire doit être renseigné.';
    if (!objectField.trim()) return "L'objet du courrier est requis.";
    for (const f of modele.fields) {
      if (f.required && !(fields[f.name] ?? '').trim()) {
        return `Le champ « ${f.label} » est requis.`;
      }
    }
    return null;
  };

  const requestPdf = async (
    mode: 'preview' | 'download'
  ): Promise<Blob | null> => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return null;
    }
    setError('');
    const res = await fetch(`/api/family/courriers/${modele.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId: selectedChildId,
        fields,
        object: objectField,
        recipientAddressBlock,
        mode,
      }),
    });
    if (!res.ok) {
      let msg = 'Erreur lors de la génération du PDF.';
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch {
        // ignore
      }
      setError(msg);
      return null;
    }
    return await res.blob();
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const blob = await requestPdf('preview');
      if (!blob) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownload = async () => {
    setSubmitting(true);
    try {
      const blob = await requestPdf('download');
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const childName =
        children.find((c) => c.id === selectedChildId)?.firstName ?? 'enfant';
      link.download = `${modele.id}-${childName.toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setSubmitting(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const inputBase =
    'w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:border-[#027e7e] focus:ring-2 focus:ring-[#027e7e]/20 outline-none transition';

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,420px)] gap-4 lg:gap-6 pb-24 lg:pb-0">
        {/* Colonne formulaire */}
        <div className="space-y-4">
          {/* Sélecteur enfant */}
          <SectionCard
            title="Enfant concerné"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            }
          >
            {children.length > 1 ? (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className={inputBase}
                aria-label="Sélectionner l'enfant"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {[c.firstName, c.lastName].filter(Boolean).join(' ')}
                  </option>
                ))}
              </select>
            ) : (
              <div
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                style={{ backgroundColor: '#f9fafb' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: ACCENT_BG, color: ACCENT }}
                  aria-hidden="true"
                >
                  {children[0]?.firstName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <p className="text-sm text-gray-800 font-medium truncate">
                  {(() => {
                    const c = children[0];
                    if (!c) return 'Aucun enfant sélectionné.';
                    return [c.firstName, c.lastName].filter(Boolean).join(' ');
                  })()}
                </p>
              </div>
            )}
          </SectionCard>

          {/* Destinataire */}
          <SectionCard
            title="Destinataire"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            }
          >
            <label
              htmlFor="recipient-block"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Bloc d&apos;adresse <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Nom du destinataire, organisme, adresse postale.
            </p>
            <textarea
              id="recipient-block"
              value={recipientAddressBlock}
              onChange={(e) => setRecipientAddressBlock(e.target.value)}
              rows={4}
              className={inputBase}
              required
            />
          </SectionCard>

          {/* Objet */}
          <SectionCard
            title="Objet du courrier"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            }
          >
            <label
              htmlFor="object-field"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Objet <span className="text-red-500">*</span>
            </label>
            <input
              id="object-field"
              type="text"
              value={objectField}
              onChange={(e) => setObjectField(e.target.value)}
              className={inputBase}
              required
            />
          </SectionCard>

          {/* Champs spécifiques */}
          {modele.fields.length > 0 && (
            <SectionCard
              title="Détails spécifiques"
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              }
            >
              <div className="space-y-4">
                {modele.fields.map((f) => (
                  <FieldInput
                    key={f.name}
                    field={f}
                    value={fields[f.name] ?? ''}
                    onChange={(v) => handleFieldChange(f.name, v)}
                    inputBase={inputBase}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {/* Vos informations (lecture seule) */}
          <SectionCard
            title="Vos informations"
            subtitle="Pré-rempli depuis votre profil"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            }
          >
            <p className="text-xs text-gray-500 mb-3">
              Pour les modifier, rendez-vous dans{' '}
              <a
                href="/dashboard/family/profile"
                className="font-semibold underline"
                style={{ color: TEAL }}
              >
                Mon profil
              </a>
              .
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <ReadOnlyField
                label="Nom et prénom"
                value={family.parentFullName}
              />
              <ReadOnlyField
                label="Adresse / ville"
                value={family.location}
              />
              {family.phone && (
                <ReadOnlyField label="Téléphone" value={family.phone} />
              )}
              {family.email && (
                <ReadOnlyField label="Email" value={family.email} />
              )}
            </dl>
          </SectionCard>

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
              role="alert"
              aria-live="assertive"
            >
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Actions desktop */}
          <div className="hidden lg:flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing || submitting}
              className="px-5 py-2.5 rounded-xl font-semibold border-2 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              {previewing ? (
                <>
                  <Spinner />
                  Préparation…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Aperçu
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={previewing || submitting}
              className="px-5 py-2.5 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
              style={{ backgroundColor: TEAL }}
            >
              {submitting ? (
                <>
                  <Spinner />
                  Génération…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Télécharger en PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Colonne aperçu (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              aria-label="Aperçu du courrier"
            >
              <div
                className="px-4 py-3 border-b border-gray-100 flex items-center justify-between"
                style={{ backgroundColor: '#f9fafb' }}
              >
                <h2
                  className="text-sm font-bold text-gray-900"
                  style={{ fontFamily: 'Verdana, sans-serif' }}
                >
                  Aperçu
                </h2>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={closePreview}
                    className="text-xs text-gray-500 hover:text-gray-900 transition font-medium"
                  >
                    Effacer
                  </button>
                )}
              </div>
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  title="Aperçu du courrier en PDF"
                  className="w-full h-[600px] bg-gray-50"
                />
              ) : (
                <div className="px-6 py-12 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: ACCENT_BG }}
                    aria-hidden="true"
                  >
                    <svg
                      className="w-8 h-8"
                      style={{ color: ACCENT }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p
                    className="text-sm font-semibold text-gray-900 mb-1"
                    style={{ fontFamily: 'Verdana, sans-serif' }}
                  >
                    Aperçu du courrier
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                    Remplissez le formulaire puis cliquez sur «&nbsp;Aperçu&nbsp;»
                    pour visualiser le PDF avant téléchargement.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky bar mobile */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur px-3 py-3 flex gap-2"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewing || submitting}
          className="flex-1 px-4 py-3 rounded-xl font-semibold border-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          style={{ borderColor: ACCENT, color: ACCENT }}
        >
          {previewing ? (
            <>
              <Spinner />
              Préparation…
            </>
          ) : (
            'Aperçu'
          )}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={previewing || submitting}
          className="flex-1 px-4 py-3 rounded-xl font-semibold text-white text-sm transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-sm"
          style={{ backgroundColor: TEAL }}
        >
          {submitting ? (
            <>
              <Spinner />
              Génération…
            </>
          ) : (
            'Télécharger'
          )}
        </button>
      </div>

      {/* Modal aperçu mobile uniquement */}
      {previewUrl ? (
        <div className="lg:hidden">
          <PreviewModal url={previewUrl} onClose={closePreview} />
        </div>
      ) : null}
    </>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: ACCENT_BG }}
          aria-hidden="true"
        >
          <svg
            className="w-5 h-5"
            style={{ color: ACCENT }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {icon}
          </svg>
        </div>
        <div className="min-w-0">
          <h2
            className="text-sm sm:text-base font-bold text-gray-900"
            style={{ fontFamily: 'Verdana, sans-serif' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500 font-medium">
        {label}
      </dt>
      <dd className="text-gray-900 font-medium mt-0.5 break-words">
        {value || <span className="text-gray-400">Non renseigné</span>}
      </dd>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  inputBase,
}: {
  field: CourrierFieldDef;
  value: string;
  onChange: (v: string) => void;
  inputBase: string;
}) {
  const inputId = `courrier-field-${field.name}`;
  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-900 mb-1"
      >
        {field.label}
        {field.required ? <span className="text-red-500"> *</span> : null}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={field.placeholder}
          required={field.required}
          className={inputBase}
        />
      ) : field.type === 'date' ? (
        <input
          id={inputId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={inputBase}
        />
      ) : (
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          className={inputBase}
        />
      )}
      {field.helper ? (
        <p className="mt-1 text-xs text-gray-500">{field.helper}</p>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function PreviewModal({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu du courrier"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-4xl h-full sm:h-[90vh] bg-white sm:rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2
            className="text-base font-bold text-gray-900"
            style={{ fontFamily: 'Verdana, sans-serif' }}
          >
            Aperçu du courrier
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            aria-label="Fermer l'aperçu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <iframe
          src={url}
          title="Aperçu du courrier en PDF"
          className="flex-1 w-full"
        />
      </div>
    </div>
  );
}
