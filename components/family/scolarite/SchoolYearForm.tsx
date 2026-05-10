'use client';

import { useState, useEffect, type FormEvent } from 'react';
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

const trimOrNull = (v: string): string | null => {
  const t = v.trim();
  return t.length > 0 ? t : null;
};

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {displayError && (
        <div
          className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r"
          role="alert"
        >
          {displayError}
        </div>
      )}

      {/* Année scolaire */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Année scolaire <span className="text-red-500">*</span>
        </label>
        {isEdit ? (
          <input
            type="text"
            value={schoolYear}
            disabled
            className="w-full border border-gray-200 rounded-lg py-3 px-4 bg-gray-50 text-gray-700"
          />
        ) : (
          <select
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base bg-white"
            style={{ ['--tw-ring-color' as any]: '#027e7e' }}
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
      <fieldset className="border border-gray-200 rounded-xl p-4 space-y-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">École</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Nom de l'établissement
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
              style={{ ['--tw-ring-color' as any]: '#027e7e' }}
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
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base bg-white"
              style={{ ['--tw-ring-color' as any]: '#027e7e' }}
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
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
              style={{ ['--tw-ring-color' as any]: '#027e7e' }}
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
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
              style={{ ['--tw-ring-color' as any]: '#027e7e' }}
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
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
              style={{ ['--tw-ring-color' as any]: '#027e7e' }}
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
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
              style={{ ['--tw-ring-color' as any]: '#027e7e' }}
              placeholder="Paris"
            />
          </div>
        </div>
      </fieldset>

      {/* Enseignant */}
      <fieldset className="border border-gray-200 rounded-xl p-4 space-y-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">
          Enseignant principal
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Nom
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
              style={{ ['--tw-ring-color' as any]: '#027e7e' }}
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
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
              style={{ ['--tw-ring-color' as any]: '#027e7e' }}
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
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
              style={{ ['--tw-ring-color' as any]: '#027e7e' }}
              placeholder="01 23 45 67 89"
            />
          </div>
        </div>
      </fieldset>

      {/* Dispositifs */}
      <fieldset className="border border-gray-200 rounded-xl p-4 space-y-3">
        <legend className="px-2 text-sm font-semibold text-gray-700">
          Dispositif(s) en place
        </legend>
        <p className="text-xs text-gray-500">
          Cochez les dispositifs administratifs en cours. Le contenu médical n'est
          jamais stocké ici.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SCHOOL_DEVICES.map((d) => {
            const checked = devices.includes(d);
            return (
              <label
                key={d}
                className={`flex items-start gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                  checked
                    ? 'border-transparent'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={
                  checked
                    ? { backgroundColor: 'rgba(2, 126, 126, 0.08)', borderColor: '#027e7e' }
                    : {}
                }
                title={SCHOOL_DEVICE_DESCRIPTIONS[d]}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDevice(d)}
                  className="h-4 w-4 mt-0.5 border-gray-300 rounded flex-shrink-0"
                  style={{ accentColor: '#027e7e' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {SCHOOL_DEVICE_LABELS[d]}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">
                    {SCHOOL_DEVICE_DESCRIPTIONS[d]}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* AESH */}
      <fieldset className="border border-gray-200 rounded-xl p-4 space-y-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">AESH</legend>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={hasAesh}
            onChange={(e) => setHasAesh(e.target.checked)}
            className="h-4 w-4 border-gray-300 rounded"
            style={{ accentColor: '#027e7e' }}
          />
          <span className="text-sm text-gray-800">
            Un(e) AESH accompagne l'enfant cette année
          </span>
        </label>

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
                className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
                style={{ ['--tw-ring-color' as any]: '#027e7e' }}
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
                className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
                style={{ ['--tw-ring-color' as any]: '#027e7e' }}
                placeholder="Optionnel"
              />
            </div>
          </div>
        )}
      </fieldset>

      {/* Équipe de Suivi de Scolarité */}
      <fieldset className="border border-gray-200 rounded-xl p-4 space-y-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">
          Équipe de Suivi de Scolarité (ESS)
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Date de la dernière ESS
            </label>
            <input
              type="date"
              value={lastEssDate}
              onChange={(e) => setLastEssDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
              style={{ ['--tw-ring-color' as any]: '#027e7e' }}
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
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
              style={{ ['--tw-ring-color' as any]: '#027e7e' }}
            />
          </div>
        </div>
      </fieldset>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Notes administratives
        </label>
        <p className="text-xs text-gray-500 mb-2">{NOTES_ADMIN_HINT}</p>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX_LENGTH))}
          maxLength={NOTES_MAX_LENGTH}
          className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none text-base"
          style={{ ['--tw-ring-color' as any]: '#027e7e' }}
          placeholder="Informations utiles pour la coordination scolaire (réunions, contacts, démarches en cours…)"
        />
        <p
          className={`mt-1 text-xs ${
            remainingChars < 100 ? 'text-orange-600' : 'text-gray-400'
          }`}
        >
          {remainingChars} caractères restants
        </p>
      </div>

      {/* Boutons */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-semibold"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition font-semibold shadow-md"
          style={{ backgroundColor: '#027e7e' }}
        >
          {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter cette année'}
        </button>
      </div>
    </form>
  );
}
