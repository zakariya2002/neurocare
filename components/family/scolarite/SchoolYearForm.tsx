'use client';

import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import {
  SCHOOL_TYPE_LABELS,
  SCHOOL_TYPES,
  SCHOOL_DEVICE_LABELS,
  SCHOOL_DEVICE_DESCRIPTIONS,
  SCHOOL_DEVICES,
  NOTES_MAX_LENGTH,
  NOTES_ADMIN_HINT,
  defaultSchoolYearOptions,
  isValidSchoolYear,
  type SchoolYearRow,
  type SchoolType,
  type SchoolDevice,
} from '@/lib/family/scolarite';

interface SchoolYearFormProps {
  initial?: SchoolYearRow | null;
  /** Liste des années déjà créées pour cet enfant — pour exclure du sélecteur */
  existingYears?: string[];
  onCancel: () => void;
  onSubmit: (payload: SchoolYearFormValues) => Promise<void>;
  saving?: boolean;
  error?: string | null;
}

export interface SchoolYearFormValues {
  school_year: string;
  school_name: string | null;
  school_type: SchoolType | null;
  school_address: string | null;
  school_postal_code: string | null;
  school_city: string | null;
  level: string | null;
  teacher_name: string | null;
  teacher_email: string | null;
  teacher_phone: string | null;
  devices: SchoolDevice[];
  has_aesh: boolean;
  aesh_hours_per_week: number | null;
  aesh_first_name: string | null;
  last_ess_date: string | null;
  next_ess_date: string | null;
  notes: string | null;
}

/** Couleurs pastel par dispositif scolaire */
const DEVICE_STYLES: Record<SchoolDevice, { bg: string; color: string; border: string }> = {
  pps: { bg: '#cffafe', color: '#0891b2', border: '#67e8f9' },          // cyan
  pap: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },          // ambre
  pai: { bg: '#fce7f3', color: '#be185d', border: '#f9a8d4' },          // rose
  ppre: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },         // bleu
  ulis: { bg: '#ede9fe', color: '#7c3aed', border: '#c4b5fd' },         // violet
  segpa: { bg: '#c9eaea', color: '#015c5c', border: '#3a9e9e' },        // teal
  aucun: { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db' },        // gris
};

const trimOrNull = (v: string): string | null => {
  const t = v.trim();
  return t.length > 0 ? t : null;
};

interface SectionCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  description?: string;
}

function SectionCard({ title, icon, children, description }: SectionCardProps) {
  return (
    <fieldset className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#c9eaea' }}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h3
            className="text-sm sm:text-base font-bold"
            style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
          >
            {title}
          </h3>
          {description && (
            <p className="text-[11px] sm:text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

const inputClass =
  'w-full border border-gray-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#3a9e9e] focus:ring-2 focus:ring-[#3a9e9e]/20 transition text-base bg-white';

export default function SchoolYearForm({
  initial = null,
  existingYears = [],
  onCancel,
  onSubmit,
  saving = false,
  error = null,
}: SchoolYearFormProps) {
  const isEdit = Boolean(initial);

  const [schoolYear, setSchoolYear] = useState(initial?.school_year ?? '');
  const [schoolName, setSchoolName] = useState(initial?.school_name ?? '');
  const [schoolType, setSchoolType] = useState<SchoolType | ''>(
    initial?.school_type ?? ''
  );
  const [schoolAddress, setSchoolAddress] = useState(initial?.school_address ?? '');
  const [schoolPostalCode, setSchoolPostalCode] = useState(
    initial?.school_postal_code ?? ''
  );
  const [schoolCity, setSchoolCity] = useState(initial?.school_city ?? '');
  const [level, setLevel] = useState(initial?.level ?? '');
  const [teacherName, setTeacherName] = useState(initial?.teacher_name ?? '');
  const [teacherEmail, setTeacherEmail] = useState(initial?.teacher_email ?? '');
  const [teacherPhone, setTeacherPhone] = useState(initial?.teacher_phone ?? '');
  const [devices, setDevices] = useState<SchoolDevice[]>(initial?.devices ?? []);
  const [hasAesh, setHasAesh] = useState(initial?.has_aesh ?? false);
  const [aeshHours, setAeshHours] = useState(
    initial?.aesh_hours_per_week !== undefined && initial?.aesh_hours_per_week !== null
      ? String(initial.aesh_hours_per_week)
      : ''
  );
  const [aeshFirstName, setAeshFirstName] = useState(initial?.aesh_first_name ?? '');
  const [lastEssDate, setLastEssDate] = useState(initial?.last_ess_date ?? '');
  const [nextEssDate, setNextEssDate] = useState(initial?.next_ess_date ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
  }, [schoolYear, schoolType, devices, hasAesh, aeshHours]);

  const yearOptions = (() => {
    const defaults = defaultSchoolYearOptions();
    const all = new Set<string>(defaults);
    if (initial?.school_year) all.add(initial.school_year);
    return Array.from(all).sort((a, b) => b.localeCompare(a));
  })();

  const taken = new Set<string>(
    existingYears.filter((y) => y !== initial?.school_year)
  );

  const toggleDevice = (device: SchoolDevice) => {
    setDevices((prev) => {
      const isAucun = device === 'aucun';
      const has = prev.includes(device);
      if (has) {
        return prev.filter((d) => d !== device);
      }
      // Sélection mutuellement exclusive : "aucun" exclut le reste, et inversement.
      if (isAucun) return ['aucun'];
      return [...prev.filter((d) => d !== 'aucun'), device];
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!isValidSchoolYear(schoolYear)) {
      setLocalError('Année scolaire invalide. Format attendu : 2025-2026.');
      return;
    }
    if (!isEdit && taken.has(schoolYear)) {
      setLocalError('Cette année scolaire existe déjà pour cet enfant.');
      return;
    }
    if (hasAesh && aeshHours !== '') {
      const n = Number(aeshHours);
      if (!Number.isFinite(n) || n < 0 || n > 50) {
        setLocalError('Quotité AESH invalide (entre 0 et 50 h/semaine).');
        return;
      }
    }
    if (notes.length > NOTES_MAX_LENGTH) {
      setLocalError(`Les notes dépassent ${NOTES_MAX_LENGTH} caractères.`);
      return;
    }

    const payload: SchoolYearFormValues = {
      school_year: schoolYear,
      school_name: trimOrNull(schoolName),
      school_type: (schoolType as SchoolType) || null,
      school_address: trimOrNull(schoolAddress),
      school_postal_code: trimOrNull(schoolPostalCode),
      school_city: trimOrNull(schoolCity),
      level: trimOrNull(level),
      teacher_name: trimOrNull(teacherName),
      teacher_email: trimOrNull(teacherEmail),
      teacher_phone: trimOrNull(teacherPhone),
      devices,
      has_aesh: hasAesh,
      aesh_hours_per_week:
        hasAesh && aeshHours !== '' ? Number(aeshHours) : null,
      aesh_first_name: hasAesh ? trimOrNull(aeshFirstName) : null,
      last_ess_date: lastEssDate || null,
      next_ess_date: nextEssDate || null,
      notes: trimOrNull(notes),
    };

    await onSubmit(payload);
  };

  const displayError = localError ?? error;
  const remainingChars = NOTES_MAX_LENGTH - notes.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {displayError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2.5"
          role="alert"
        >
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{displayError}</span>
        </div>
      )}

      {/* Bandeau confidentialité */}
      <div
        className="rounded-xl md:rounded-2xl border overflow-hidden p-4 flex items-start gap-3"
        style={{ backgroundColor: '#c9eaea', borderColor: '#a5d4d4' }}
      >
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#015c5c' }}>
          Cet espace ne stocke pas vos <strong>documents médicaux</strong>. Les PAI, PPS et autres
          pièces justificatives sont à conserver dans le <strong>coffre-fort sécurisé</strong> (arrive prochainement).
        </p>
      </div>

      {/* Année scolaire */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5">
        <label className="block text-sm font-bold text-gray-800 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
          Année scolaire <span className="text-red-500">*</span>
        </label>
        {isEdit ? (
          <input
            type="text"
            value={schoolYear}
            disabled
            className="w-full border border-gray-200 rounded-xl py-2.5 px-3 bg-gray-50 text-gray-700"
          />
        ) : (
          <select
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Sélectionnez…</option>
            {yearOptions.map((y) => (
              <option key={y} value={y} disabled={taken.has(y)}>
                {y}
                {taken.has(y) ? ' (déjà ajoutée)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* École */}
      <SectionCard
        title="École"
        icon={
          <svg className="w-5 h-5" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Nom de l'établissement
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className={inputClass}
              placeholder="Ex: École Jules Ferry"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Type d'établissement
            </label>
            <select
              value={schoolType}
              onChange={(e) => setSchoolType(e.target.value as SchoolType | '')}
              className={inputClass}
            >
              <option value="">Non précisé</option>
              {SCHOOL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SCHOOL_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Classe / niveau
            </label>
            <input
              type="text"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={inputClass}
              placeholder="Ex: CE2, 6e SEGPA"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Adresse
            </label>
            <input
              type="text"
              value={schoolAddress}
              onChange={(e) => setSchoolAddress(e.target.value)}
              className={inputClass}
              placeholder="Ex: 12 rue des Écoles"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Code postal
            </label>
            <input
              type="text"
              value={schoolPostalCode}
              onChange={(e) => setSchoolPostalCode(e.target.value)}
              className={inputClass}
              placeholder="75001"
              inputMode="numeric"
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Ville
            </label>
            <input
              type="text"
              value={schoolCity}
              onChange={(e) => setSchoolCity(e.target.value)}
              className={inputClass}
              placeholder="Paris"
            />
          </div>
        </div>
      </SectionCard>

      {/* Enseignant */}
      <SectionCard
        title="Classe et enseignant"
        icon={
          <svg className="w-5 h-5" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
        description="Enseignant principal — référent pour la communication"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Nom
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className={inputClass}
              placeholder="Mme Dupont"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              className={inputClass}
              placeholder="prenom.nom@ac-academie.fr"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Téléphone
            </label>
            <input
              type="tel"
              value={teacherPhone}
              onChange={(e) => setTeacherPhone(e.target.value)}
              className={inputClass}
              placeholder="01 23 45 67 89"
            />
          </div>
        </div>
      </SectionCard>

      {/* Dispositifs en pills colorées */}
      <SectionCard
        title="Dispositif d'accompagnement"
        description="Cochez les dispositifs administratifs en cours. Le contenu médical n'est jamais stocké ici."
        icon={
          <svg className="w-5 h-5" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SCHOOL_DEVICES.map((d) => {
            const checked = devices.includes(d);
            const ds = DEVICE_STYLES[d];
            return (
              <label
                key={d}
                className="flex items-start gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all hover:shadow-sm"
                style={
                  checked
                    ? { backgroundColor: ds.bg, borderColor: ds.border }
                    : { backgroundColor: 'white', borderColor: '#e5e7eb' }
                }
                title={SCHOOL_DEVICE_DESCRIPTIONS[d]}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDevice(d)}
                  className="h-4 w-4 mt-0.5 border-gray-300 rounded flex-shrink-0"
                  style={{ accentColor: ds.color }}
                  aria-label={SCHOOL_DEVICE_LABELS[d]}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold"
                    style={{
                      color: checked ? ds.color : '#1f2937',
                      fontFamily: 'Verdana, sans-serif',
                    }}
                  >
                    {SCHOOL_DEVICE_LABELS[d]}
                  </p>
                  <p
                    className="text-[10px] sm:text-xs leading-tight"
                    style={{ color: checked ? ds.color : '#6b7280', opacity: checked ? 0.85 : 1 }}
                  >
                    {SCHOOL_DEVICE_DESCRIPTIONS[d]}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </SectionCard>

      {/* AESH */}
      <SectionCard
        title="AESH"
        description="Accompagnant·e des élèves en situation de handicap"
        icon={
          <svg className="w-5 h-5" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      >
        <div
          className="flex items-center justify-between gap-3 p-3 rounded-xl border transition"
          style={{
            backgroundColor: hasAesh ? '#c9eaea' : '#fafafa',
            borderColor: hasAesh ? '#3a9e9e' : '#e5e7eb',
          }}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800">
              Un(e) AESH accompagne l'enfant cette année
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Bascule pour activer la saisie des informations.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hasAesh}
            onClick={() => setHasAesh(!hasAesh)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3a9e9e]/40 flex-shrink-0"
            style={{ backgroundColor: hasAesh ? '#3a9e9e' : '#d1d5db' }}
          >
            <span
              className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition"
              style={{ transform: hasAesh ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {hasAesh && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Quotité (heures / semaine)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={aeshHours}
                onChange={(e) => setAeshHours(e.target.value)}
                className={inputClass}
                placeholder="12"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Prénom de l'AESH
              </label>
              <input
                type="text"
                value={aeshFirstName}
                onChange={(e) => setAeshFirstName(e.target.value)}
                className={inputClass}
                placeholder="Optionnel"
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* ESS */}
      <SectionCard
        title="ESS — Équipe de Suivi de Scolarité"
        description="Réunion bilan de l'accompagnement, organisée par l'enseignant référent MDPH"
        icon={
          <svg className="w-5 h-5" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Date de la dernière ESS
            </label>
            <input
              type="date"
              value={lastEssDate}
              onChange={(e) => setLastEssDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Date de la prochaine ESS
            </label>
            <input
              type="date"
              value={nextEssDate}
              onChange={(e) => setNextEssDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </SectionCard>

      {/* Notes */}
      <SectionCard
        title="Notes administratives"
        description={NOTES_ADMIN_HINT}
        icon={
          <svg className="w-5 h-5" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        }
      >
        <div>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX_LENGTH))}
            maxLength={NOTES_MAX_LENGTH}
            className={inputClass}
            placeholder="Informations utiles pour la coordination scolaire (réunions, contacts, démarches en cours…)"
          />
          <p
            className={`mt-1 text-xs ${
              remainingChars < 100 ? 'text-orange-600 font-medium' : 'text-gray-400'
            }`}
            aria-live="polite"
          >
            {remainingChars} caractères restants
          </p>
        </div>
      </SectionCard>

      {/* Boutons */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition font-semibold"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl hover:opacity-90 hover:shadow-md disabled:opacity-50 transition-all font-semibold shadow-sm"
          style={{ backgroundColor: '#3a9e9e' }}
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enregistrement…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {isEdit ? 'Enregistrer' : 'Ajouter cette année'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
