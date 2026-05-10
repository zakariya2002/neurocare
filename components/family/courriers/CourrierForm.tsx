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

  return (
    <div className="space-y-4">
      {/* Bloc info expéditeur */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <h2 className="text-base font-bold text-gray-900 mb-3">
          Coordonnées de l&apos;expéditeur
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Ces informations proviennent de votre profil. Pour les modifier,
          rendez-vous dans{' '}
          <a
            href="/dashboard/family/profile"
            className="font-semibold underline"
            style={{ color: '#027e7e' }}
          >
            Mon profil
          </a>
          .
        </p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Nom et prénom
            </dt>
            <dd className="text-gray-900 font-medium mt-0.5">
              {family.parentFullName || (
                <span className="text-gray-400">Non renseigné</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Adresse / ville
            </dt>
            <dd className="text-gray-900 font-medium mt-0.5">
              {family.location || (
                <span className="text-gray-400">Non renseignée</span>
              )}
            </dd>
          </div>
          {family.phone ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Téléphone
              </dt>
              <dd className="text-gray-900 font-medium mt-0.5">
                {family.phone}
              </dd>
            </div>
          ) : null}
          {family.email ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Email
              </dt>
              <dd className="text-gray-900 font-medium mt-0.5">
                {family.email}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {/* Sélecteur enfant */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <h2 className="text-base font-bold text-gray-900 mb-3">
          Enfant concerné
        </h2>
        {children.length > 1 ? (
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
            style={{ ['--tw-ring-color' as any]: '#027e7e' }}
            aria-label="Sélectionner l'enfant"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {[c.firstName, c.lastName].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-gray-700">
            {(() => {
              const c = children[0];
              if (!c) return 'Aucun enfant sélectionné.';
              return [c.firstName, c.lastName].filter(Boolean).join(' ');
            })()}
          </p>
        )}
      </section>

      {/* Bloc destinataire et objet */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Destinataire <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Bloc d&apos;adresse complet (nom du destinataire, organisme,
            adresse postale).
          </p>
          <textarea
            value={recipientAddressBlock}
            onChange={(e) => setRecipientAddressBlock(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
            style={{ ['--tw-ring-color' as any]: '#027e7e' }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Objet du courrier <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={objectField}
            onChange={(e) => setObjectField(e.target.value)}
            className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
            style={{ ['--tw-ring-color' as any]: '#027e7e' }}
            required
          />
        </div>
      </section>

      {/* Champs spécifiques au modèle */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
        <h2 className="text-base font-bold text-gray-900">
          Informations spécifiques
        </h2>
        {modele.fields.map((f) => (
          <FieldInput
            key={f.name}
            field={f}
            value={fields[f.name] ?? ''}
            onChange={(v) => handleFieldChange(f.name, v)}
          />
        ))}
      </section>

      {error ? (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      ) : null}

      {/* Boutons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewing || submitting}
          className="px-5 py-2.5 text-sm font-semibold rounded-lg border transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderColor: '#027e7e', color: '#027e7e' }}
        >
          {previewing ? 'Préparation…' : 'Aperçu'}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={previewing || submitting}
          className="px-5 py-2.5 text-sm font-semibold rounded-lg text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#027e7e' }}
        >
          {submitting ? 'Génération…' : 'Télécharger le PDF'}
        </button>
      </div>

      {/* Modal aperçu */}
      {previewUrl ? (
        <PreviewModal url={previewUrl} onClose={closePreview} />
      ) : null}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CourrierFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const baseClasses =
    'w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent';
  const ringStyle = { ['--tw-ring-color' as any]: '#027e7e' };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-1">
        {field.label}
        {field.required ? <span className="text-red-500"> *</span> : null}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={field.placeholder}
          required={field.required}
          className={baseClasses}
          style={ringStyle}
        />
      ) : field.type === 'date' ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={baseClasses}
          style={ringStyle}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          className={baseClasses}
          style={ringStyle}
        />
      )}
      {field.helper ? (
        <p className="mt-1 text-xs text-gray-500">{field.helper}</p>
      ) : null}
    </div>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu du courrier"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            Aperçu du courrier
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-lg"
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
