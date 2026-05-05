'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentPosition, reverseGeocode } from '@/lib/geolocation';
import CityAutocomplete from '@/components/CityAutocomplete';
import { useToast } from '@/components/Toast';

interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

// ─── Validation helpers ──────────────────────────────────────────────────────

function validateSIRET(siret: string): { valid: boolean; message?: string } {
  if (siret.length !== 14) return { valid: false, message: 'Le SIRET doit contenir exactement 14 chiffres' };
  if (!/^\d{14}$/.test(siret)) return { valid: false, message: 'Le SIRET ne doit contenir que des chiffres' };
  const siren = siret.substring(0, 9);
  let sum = 0;
  for (let i = 0; i < siren.length; i++) {
    let digit = parseInt(siren[i]);
    if ((siren.length - i) % 2 === 0) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
  }
  if (sum % 10 !== 0) return { valid: false, message: 'Le numéro SIRET est invalide' };
  return { valid: true };
}

// ─── Static data (identical to register-educator) ────────────────────────────

const professions = [
  { value: 'educator', label: 'Éducateur spécialisé', category: 'Éducatif', requiresRpps: false, diplomas: ['DEES', 'CAFERUIS', 'OTHER'], icon: '👨‍🏫' },
  { value: 'moniteur_educateur', label: 'Moniteur éducateur', category: 'Éducatif', requiresRpps: false, diplomas: ['DEME', 'OTHER'], icon: '👩‍🏫' },
  { value: 'psychologist', label: 'Psychologue', category: 'Psychologie', requiresRpps: true, diplomas: ['MASTER_PSY', 'OTHER'], icon: '🧠' },
  { value: 'psychomotricist', label: 'Psychomotricien', category: 'Thérapies', requiresRpps: true, diplomas: ['DE_PSYCHOMOT', 'OTHER'], icon: '🤸' },
  { value: 'occupational_therapist', label: 'Ergothérapeute', category: 'Thérapies', requiresRpps: true, diplomas: ['DE_ERGO', 'OTHER'], icon: '🎯' },
  { value: 'speech_therapist', label: 'Orthophoniste', category: 'Thérapies', requiresRpps: true, diplomas: ['CCO', 'OTHER'], icon: '🗣️' },
  { value: 'physiotherapist', label: 'Kinésithérapeute', category: 'Thérapies', requiresRpps: true, diplomas: ['DE_KINE', 'OTHER'], icon: '💪' },
  { value: 'apa_teacher', label: 'Enseignant APA', category: 'Autres', requiresRpps: false, diplomas: ['LICENCE_STAPS_APA', 'MASTER_STAPS_APA', 'OTHER'], icon: '🏃' },
  { value: 'music_therapist', label: 'Musicothérapeute', category: 'Autres', requiresRpps: false, diplomas: ['DU_MUSICOTHERAPIE', 'CERTIFICATION_MUSICOTHERAPIE', 'OTHER'], icon: '🎵' },
];

const diplomaLabels: { [key: string]: string } = {
  'DEES': 'Diplôme d\'État d\'Éducateur Spécialisé (DEES)',
  'DEME': 'Diplôme d\'État de Moniteur Éducateur (DEME)',
  'CAFERUIS': 'CAFERUIS',
  'MASTER_PSY': 'Master 2 Psychologie',
  'DES_PSYCHIATRIE': 'DES de Psychiatrie',
  'DE_PSYCHOMOT': 'Diplôme d\'État de Psychomotricien',
  'DE_ERGO': 'Diplôme d\'État d\'Ergothérapeute',
  'CCO': 'Certificat de Capacité d\'Orthophoniste (CCO)',
  'DE_KINE': 'Diplôme d\'État de Masseur-Kinésithérapeute',
  'LICENCE_STAPS_APA': 'Licence STAPS mention APA-S',
  'MASTER_STAPS_APA': 'Master STAPS APA-S',
  'DU_MUSICOTHERAPIE': 'DU Musicothérapie',
  'CERTIFICATION_MUSICOTHERAPIE': 'Certification Musicothérapeute',
  'OTHER': 'Autre diplôme / certification',
};

const availableSpecializations = [
  'Troubles du spectre autistique (TSA)',
  'Communication alternative (PECS, Makaton)',
  'Méthode ABA',
  'Méthode TEACCH',
  'Troubles du comportement',
  'Autonomie quotidienne',
  'Habiletés sociales',
  'Intégration sensorielle',
  'Accompagnement petite enfance (0-6 ans)',
  'Accompagnement scolaire',
  'Guidance parentale',
  'Accompagnement adolescents',
  'Accompagnement adultes autistes',
  'Transition vers l\'âge adulte',
  'Insertion professionnelle',
  'Vie en autonomie (logement, budget)',
  'Accompagnement vie affective',
];

const availableLanguages = [
  'Français',
  'Anglais',
  'Arabe',
  'Espagnol',
  'Portugais',
  'Allemand',
  'Italien',
  'Langue des signes (LSF)',
  'Chinois',
  'Russe',
];

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex-1 h-px bg-gray-200" />
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{children}</h3>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ─── Eye toggle SVGs ──────────────────────────────────────────────────────────

function EyeOff() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function EyeOn() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CampagnePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Auth
  const [authData, setAuthData] = useState({ email: '', password: '', confirmPassword: '' });

  // Profession
  const [professionType, setProfessionType] = useState('');

  // Profile data
  const [educatorData, setEducatorData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    phone: '',
    location: '',
    years_of_experience: '' as number | '',
    hourly_rate: '',
    siret: '',
    sap_number: '',
    rpps_number: '',
    diploma_type: '',
  });

  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Français']);

  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
    minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecialChar: false,
  });

  // SIRET validation state
  const [siretValidationState, setSiretValidationState] = useState<{
    isValid: boolean | null; verified: boolean; message: string; loading: boolean;
  }>({ isValid: null, verified: false, message: '', loading: false });

  // RPPS validation state
  const [rppsValidationState, setRppsValidationState] = useState<{
    isValid: boolean | null; verified: boolean; message: string; loading: boolean;
    data: { firstName?: string; lastName?: string } | null;
  }>({ isValid: null, verified: false, message: '', loading: false, data: null });

  const selectedProfession = professions.find(p => p.value === professionType);

  // ── Password helpers ─────────────────────────────────────────────────────────

  const validatePassword = (pwd: string) => {
    const criteria = {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };
    setPasswordCriteria(criteria);
    return Object.values(criteria).every(Boolean);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setAuthData(prev => ({ ...prev, password: newPassword }));
    setShowPasswordStrength(newPassword.length > 0);
    validatePassword(newPassword);
  };

  const getPasswordStrength = () => {
    const count = Object.values(passwordCriteria).filter(Boolean).length;
    if (count === 5) return { label: 'Très fort', color: 'bg-green-500', percentage: 100 };
    if (count === 4) return { label: 'Fort', color: 'bg-green-400', percentage: 80 };
    if (count === 3) return { label: 'Moyen', color: 'bg-yellow-500', percentage: 60 };
    if (count >= 1) return { label: 'Faible', color: 'bg-orange-500', percentage: 40 };
    return { label: 'Très faible', color: 'bg-red-500', percentage: 20 };
  };

  // ── Specializations & languages ──────────────────────────────────────────────

  const toggleSpecialization = (spec: string) =>
    setSelectedSpecializations(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]);

  const toggleLanguage = (lang: string) =>
    setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);

  // ── Geolocation ──────────────────────────────────────────────────────────────

  const handleUseCurrentLocation = async () => {
    setGeolocating(true);
    try {
      const position = await getCurrentPosition();
      const address = await reverseGeocode(position.latitude, position.longitude);
      if (address) {
        setEducatorData(prev => ({ ...prev, location: address }));
      } else {
        showToast('Impossible de déterminer votre adresse. Veuillez la saisir manuellement.', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la géolocalisation', 'error');
    } finally {
      setGeolocating(false);
    }
  };

  // ── SIRET / RPPS verification ─────────────────────────────────────────────────

  const verifySIRET = async (siret: string) => {
    if (siret.length !== 14) {
      setSiretValidationState({ isValid: null, verified: false, message: `${siret.length}/14 chiffres`, loading: false });
      return;
    }
    setSiretValidationState(prev => ({ ...prev, loading: true, message: 'Vérification en cours...' }));
    try {
      const response = await fetch('/api/verify-siret', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siret }),
      });
      const result = await response.json();
      if (result.valid) {
        if (result.verified && result.data) {
          setSiretValidationState({
            isValid: result.data.isActive,
            verified: true,
            message: result.data.isActive ? (result.data.companyName || 'Établissement vérifié') : 'Établissement fermé',
            loading: false,
          });
        } else {
          setSiretValidationState({ isValid: true, verified: false, message: result.message || 'Format valide', loading: false });
        }
      } else {
        setSiretValidationState({ isValid: false, verified: false, message: result.message || 'SIRET invalide', loading: false });
      }
    } catch {
      setSiretValidationState({ isValid: true, verified: false, message: 'Erreur — sera vérifié manuellement', loading: false });
    }
  };

  const verifyRPPS = async (rppsNumber: string) => {
    if (rppsNumber.length !== 11) {
      setRppsValidationState({ isValid: null, verified: false, message: `${rppsNumber.length}/11 chiffres`, loading: false, data: null });
      return;
    }
    setRppsValidationState(prev => ({ ...prev, loading: true, message: 'Vérification en cours...' }));
    try {
      const response = await fetch('/api/verify-rpps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rppsNumber }),
      });
      const result = await response.json();
      if (result.valid) {
        if (result.verified && result.data) {
          setRppsValidationState({
            isValid: true, verified: true,
            message: `Vérifié : ${result.data.firstName || ''} ${result.data.lastName || ''}`.trim() || 'Numéro RPPS vérifié',
            loading: false, data: result.data,
          });
        } else {
          setRppsValidationState({ isValid: true, verified: false, message: result.message || 'Format valide', loading: false, data: null });
        }
      } else {
        setRppsValidationState({ isValid: false, verified: false, message: result.message || 'RPPS invalide', loading: false, data: null });
      }
    } catch {
      setRppsValidationState({ isValid: true, verified: false, message: 'Erreur — sera vérifié manuellement', loading: false, data: null });
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!professionType) { showToast('Veuillez sélectionner votre profession', 'error'); return; }
    if (!educatorData.diploma_type) { showToast('Veuillez sélectionner votre diplôme principal', 'error'); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authData.email)) { showToast('L\'adresse email n\'est pas valide', 'error'); return; }

    if (!validatePassword(authData.password)) {
      showToast('Le mot de passe ne respecte pas tous les critères de sécurité', 'error');
      return;
    }
    if (authData.password !== authData.confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    if (!educatorData.first_name.trim()) { showToast('Le prénom est obligatoire', 'error'); return; }
    if (!educatorData.last_name.trim()) { showToast('Le nom est obligatoire', 'error'); return; }
    if (!educatorData.location.trim()) { showToast('La localisation est obligatoire', 'error'); return; }

    const yoe = typeof educatorData.years_of_experience === 'number'
      ? educatorData.years_of_experience
      : parseInt(educatorData.years_of_experience as string, 10);
    if (!Number.isFinite(yoe) || yoe < 1) {
      showToast('Minimum 1 an d\'expérience requis pour s\'inscrire', 'error');
      return;
    }

    if (selectedProfession?.requiresRpps) {
      if (!educatorData.rpps_number) { showToast('Le numéro RPPS est obligatoire pour votre profession', 'error'); return; }
      if (educatorData.rpps_number.length !== 11) { showToast('Le numéro RPPS doit contenir 11 chiffres', 'error'); return; }
    }

    if (educatorData.siret) {
      const siretValidation = validateSIRET(educatorData.siret);
      if (!siretValidation.valid) { showToast(siretValidation.message || 'SIRET invalide', 'error'); return; }
    }

    setLoading(true);

    try {
      const profileData = {
        first_name: educatorData.first_name,
        last_name: educatorData.last_name,
        bio: educatorData.bio,
        phone: educatorData.phone,
        location: educatorData.location,
        years_of_experience: typeof educatorData.years_of_experience === 'number'
          ? educatorData.years_of_experience
          : parseInt(educatorData.years_of_experience as string, 10),
        hourly_rate: educatorData.hourly_rate ? parseFloat(educatorData.hourly_rate) : null,
        specializations: selectedSpecializations,
        languages: selectedLanguages,
        siret: educatorData.siret,
        sap_number: educatorData.sap_number || null,
        profession_type: professionType,
        diploma_type: educatorData.diploma_type,
        rpps_number: educatorData.rpps_number || null,
        cgu_accepted_at: new Date().toISOString(),
        data_consent_at: new Date().toISOString(),
        cgu_version: '2026-03-24',
      };

      const response = await fetch('/api/register-with-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authData.email,
          password: authData.password,
          role: 'educator',
          profileData,
          baseUrl: window.location.origin,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erreur lors de la création du compte');

      // Meta pixel tracking
      try {
        const { trackEvent } = await import('@/lib/meta-pixel');
        trackEvent('Lead', { content_name: 'campagne_educator_registration', profession: professionType });
      } catch { /* non-blocking */ }

      setRegistrationSuccess(true);
    } catch (err: any) {
      const { translateError } = await import('@/lib/error-messages');
      showToast(translateError(err.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────────

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        {/* Minimal nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center">
            <Link href="/" aria-label="NeuroCare — accueil">
              <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-20"
                style={{ filter: 'brightness(0) saturate(100%) invert(30%) sepia(80%) saturate(500%) hue-rotate(140deg) brightness(95%)' }} />
            </Link>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-12">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(2,126,126,0.1)' }}>
              <svg className="w-10 h-10" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vérifiez votre boîte mail !</h2>
            <p className="text-gray-600 mb-4">
              Un email de confirmation a été envoyé à <strong className="text-gray-900">{authData.email}</strong>.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Cliquez sur le lien dans l'email pour activer votre compte et commencer à recevoir des patients.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Vous n'avez pas reçu l'email ?</strong><br />
                Vérifiez votre dossier spam ou courrier indésirable.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 text-white rounded-lg font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#027e7e' }}
            >
              Aller à la page de connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main page ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafb' }}>

      {/* ── 1. Minimal navbar ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-center">
          <Link href="/" aria-label="NeuroCare — accueil">
            <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-20"
              style={{ filter: 'brightness(0) saturate(100%) invert(30%) sepia(80%) saturate(500%) hue-rotate(140deg) brightness(95%)' }} />
          </Link>
        </div>
      </nav>

      {/* ── 2. Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-14">
        <div
          className="relative overflow-hidden"
          style={{ background: '#027e7e', minHeight: '340px' }}
        >
          {/* Illustration full-width en fond, rognée sur les côtés sur mobile */}
          <img
            src="/images/hero-campagne.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
            style={{ opacity: 0.92 }}
          />

          {/* Overlay gradient central pour lisibilité du texte */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(1,47,47,0.72) 0%, transparent 100%)' }}
          />

          {/* Contenu centré */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-16 sm:py-20">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight max-w-2xl">
              Rejoignez NeuroCare —<br className="hidden sm:block" />
              la plateforme pour les professionnels<br className="hidden sm:block" />
              du neurodéveloppement
            </h1>
            <p className="text-teal-100 text-base mb-8 max-w-xl">
              100&nbsp;% gratuit · Inscription en 2 minutes · Commencez à recevoir des patients dès aujourd&apos;hui
            </p>

            {/* 3 trust signals */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
              {[
                { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', label: 'Visible par les familles TND' },
                { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Agenda & rendez-vous en ligne' },
                { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Facturation automatique' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-teal-100 text-sm">
                  <svg className="w-4 h-4 text-teal-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Registration section ──────────────────────────────────────────── */}
      <section className="py-10 px-4 bg-gray-50" id="inscription">
        <div className="max-w-2xl mx-auto">

          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Créer mon profil gratuitement</h2>
            <p className="text-gray-400 text-sm">
              Déjà inscrit ?{' '}
              <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: '#027e7e' }}>
                Connectez-vous →
              </Link>
            </p>
          </div>

          {/* Réassurance strip */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
            {[
              '✓ Aucun abonnement',
              '✓ Sans engagement',
              '✓ Données sécurisées',
              '✓ Support inclus',
            ].map(item => (
              <span key={item} className="text-xs font-medium" style={{ color: '#027e7e' }}>{item}</span>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-8 sm:px-8 space-y-10">

              {/* ── Section Connexion ─────────────────────────────────────── */}
              <div>
                <SectionTitle>Connexion</SectionTitle>
                <div className="space-y-4">

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      required
                      aria-required="true"
                      value={authData.email}
                      onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all"
                      style={{ '--tw-ring-color': '#027e7e' } as any}
                      placeholder="votre@email.com"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        aria-required="true"
                        value={authData.password}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all"
                        style={{ '--tw-ring-color': '#027e7e' } as any}
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? 'Masquer' : 'Afficher'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff /> : <EyeOn />}
                      </button>
                    </div>
                    {showPasswordStrength && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Force</span>
                          <span className={getPasswordStrength().percentage === 100 ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                            {getPasswordStrength().label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrength().color}`}
                            style={{ width: `${getPasswordStrength().percentage}%` }} />
                        </div>
                        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                          {[
                            ['minLength', '8 caractères minimum'],
                            ['hasUppercase', 'Une majuscule'],
                            ['hasLowercase', 'Une minuscule'],
                            ['hasNumber', 'Un chiffre'],
                            ['hasSpecialChar', 'Un caractère spécial'],
                          ].map(([key, label]) => (
                            <li key={key} className={`flex items-center gap-1 ${passwordCriteria[key as keyof PasswordCriteria] ? 'text-green-600' : 'text-gray-400'}`}>
                              <span>{passwordCriteria[key as keyof PasswordCriteria] ? '✓' : '○'}</span> {label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmer le mot de passe <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        aria-required="true"
                        value={authData.confirmPassword}
                        onChange={(e) => setAuthData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all"
                        style={{ '--tw-ring-color': '#027e7e' } as any}
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                        aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                        {showConfirmPassword ? <EyeOff /> : <EyeOn />}
                      </button>
                    </div>
                    {authData.confirmPassword && (
                      <p className={`mt-1 text-xs ${authData.password === authData.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                        {authData.password === authData.confirmPassword ? '✓ Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Section Identité ──────────────────────────────────────── */}
              <div>
                <SectionTitle>Votre identité</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Prénom */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom <span className="text-red-500">*</span></label>
                    <input type="text" required aria-required="true"
                      value={educatorData.first_name}
                      onChange={(e) => setEducatorData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all"
                      style={{ '--tw-ring-color': '#027e7e' } as any}
                      placeholder="Jean" />
                  </div>

                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
                    <input type="text" required aria-required="true"
                      value={educatorData.last_name}
                      onChange={(e) => setEducatorData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all"
                      style={{ '--tw-ring-color': '#027e7e' } as any}
                      placeholder="Dupont" />
                  </div>

                  {/* Profession select */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type de profession <span className="text-red-500">*</span></label>
                    <select
                      required aria-required="true"
                      value={professionType}
                      onChange={(e) => { setProfessionType(e.target.value); setEducatorData(prev => ({ ...prev, diploma_type: '' })); }}
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all bg-white"
                      style={{ '--tw-ring-color': '#027e7e' } as any}
                    >
                      <option value="">Sélectionnez votre profession</option>
                      <optgroup label="Éducatif">
                        {professions.filter(p => p.category === 'Éducatif').map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Psychologie">
                        {professions.filter(p => p.category === 'Psychologie').map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Thérapies">
                        {professions.filter(p => p.category === 'Thérapies').map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Autres">
                        {professions.filter(p => p.category === 'Autres').map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Diplôme (shown only when profession selected) */}
                  {selectedProfession && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Diplôme principal <span className="text-red-500">*</span></label>
                      <select
                        required aria-required="true"
                        value={educatorData.diploma_type}
                        onChange={(e) => setEducatorData(prev => ({ ...prev, diploma_type: e.target.value }))}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all bg-white"
                        style={{ '--tw-ring-color': '#027e7e' } as any}
                      >
                        <option value="">Sélectionnez votre diplôme</option>
                        {selectedProfession.diplomas.map(d => (
                          <option key={d} value={d}>{diplomaLabels[d]}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Section Pratique ──────────────────────────────────────── */}
              <div>
                <SectionTitle>Votre pratique</SectionTitle>
                <div className="space-y-6">

                  {/* Spécialisations */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Spécialisations</label>
                    <div className="flex flex-wrap gap-2">
                      {availableSpecializations.map(spec => (
                        <button key={spec} type="button" onClick={() => toggleSpecialization(spec)}
                          className="px-3 py-1.5 text-xs rounded-full border-2 transition-all"
                          style={selectedSpecializations.includes(spec)
                            ? { backgroundColor: 'rgba(2,126,126,0.1)', borderColor: '#027e7e', color: '#027e7e', fontWeight: 600 }
                            : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#4b5563' }
                          }
                        >
                          {selectedSpecializations.includes(spec) && '✓ '}{spec}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Langues */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Langues parlées</label>
                    <div className="flex flex-wrap gap-2">
                      {availableLanguages.map(lang => (
                        <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all ${
                            selectedLanguages.includes(lang)
                              ? 'bg-green-100 border-green-500 text-green-700 font-semibold'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-green-300'
                          }`}
                        >
                          {selectedLanguages.includes(lang) && '✓ '}{lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expérience + tarif */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Années d'expérience <span className="text-red-500">*</span></label>
                      <input type="number" required aria-required="true" min="1" placeholder="Ex : 5"
                        value={educatorData.years_of_experience}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEducatorData(prev => ({ ...prev, years_of_experience: v === '' ? '' : parseInt(v, 10) }));
                        }}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all"
                        style={{ '--tw-ring-color': '#027e7e' } as any} />
                      <p className="text-xs text-gray-400 mt-1">Minimum 1 an requis</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tarif horaire (€)</label>
                      <input type="number" step="0.01" min="0" placeholder="Ex : 55"
                        value={educatorData.hourly_rate}
                        onChange={(e) => setEducatorData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all"
                        style={{ '--tw-ring-color': '#027e7e' } as any} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section Localisation ──────────────────────────────────── */}
              <div>
                <SectionTitle>Localisation</SectionTitle>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ville d'exercice <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <CityAutocomplete
                      value={educatorData.location}
                      onChange={(val) => setEducatorData(prev => ({ ...prev, location: val }))}
                      required
                      className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all"
                      placeholder="Ex : Paris, Lyon..."
                    />
                    <button type="button" onClick={handleUseCurrentLocation} disabled={geolocating}
                      aria-label="Utiliser ma position actuelle" aria-busy={geolocating}
                      title="Utiliser ma position"
                      className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all flex-shrink-0">
                      {geolocating ? (
                        <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full" style={{ borderColor: '#027e7e', borderTopColor: 'transparent' }} aria-hidden="true" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Section Informations légales ─────────────────────────── */}
              <div>
                <SectionTitle>Informations légales</SectionTitle>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-5 text-sm text-blue-800">
                  <strong>Version bêta :</strong> Le numéro SIRET n'est pas obligatoire pour le moment. Il sera requis pour la facturation lors de la mise en production.
                </div>

                <div className="space-y-4">

                  {/* RPPS (si requis par la profession) */}
                  {selectedProfession?.requiresRpps && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Numéro RPPS <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type="text" maxLength={11}
                          value={educatorData.rpps_number}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setEducatorData(prev => ({ ...prev, rpps_number: value }));
                            if (value.length < 11) {
                              setRppsValidationState({ isValid: null, verified: false, message: value.length > 0 ? `${value.length}/11 chiffres` : '', loading: false, data: null });
                            } else if (value.length === 11) {
                              verifyRPPS(value);
                            }
                          }}
                          placeholder="12345678901"
                          className={`w-full px-4 py-3 pr-12 border rounded-xl transition-all ${
                            rppsValidationState.isValid === true ? 'border-green-500 bg-green-50'
                            : rppsValidationState.isValid === false && educatorData.rpps_number.length === 11 ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center" aria-live="polite">
                          {rppsValidationState.loading ? (
                            <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full" style={{ borderColor: '#027e7e', borderTopColor: 'transparent' }} aria-hidden="true" />
                          ) : rppsValidationState.isValid === true ? (
                            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : rppsValidationState.isValid === false && educatorData.rpps_number.length === 11 ? (
                            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          ) : null}
                        </div>
                      </div>
                      <p className={`mt-1 text-xs ${rppsValidationState.isValid === true ? 'text-green-600' : rppsValidationState.isValid === false ? 'text-red-600' : 'text-gray-500'}`}>
                        {rppsValidationState.message || '11 chiffres — obligatoire pour les professions de santé réglementées'}
                      </p>
                    </div>
                  )}

                  {/* SIRET */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Numéro SIRET
                      <span className="text-green-600 font-normal ml-2">(Facultatif en bêta)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text" maxLength={14}
                        value={educatorData.siret}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setEducatorData(prev => ({ ...prev, siret: value }));
                          if (value.length < 14) {
                            setSiretValidationState({ isValid: null, verified: false, message: value.length > 0 ? `${value.length}/14 chiffres` : '', loading: false });
                          } else if (value.length === 14) {
                            verifySIRET(value);
                          }
                        }}
                        placeholder="12345678901234"
                        className={`w-full px-4 py-3 pr-12 border rounded-xl transition-all ${
                          siretValidationState.isValid === true ? 'border-green-500 bg-green-50'
                          : siretValidationState.isValid === false && educatorData.siret.length === 14 ? 'border-red-500 bg-red-50'
                          : 'border-gray-300'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center" aria-live="polite">
                        {siretValidationState.loading ? (
                          <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full" style={{ borderColor: '#027e7e', borderTopColor: 'transparent' }} aria-hidden="true" />
                        ) : siretValidationState.isValid === true ? (
                          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : siretValidationState.isValid === false && educatorData.siret.length === 14 ? (
                          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        ) : null}
                      </div>
                    </div>
                    <p className={`mt-1 text-xs ${siretValidationState.isValid === true ? 'text-green-600' : siretValidationState.isValid === false ? 'text-red-600' : 'text-gray-500'}`}>
                      {siretValidationState.message || '14 chiffres — facultatif pendant la version bêta'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── RGPD consent ──────────────────────────────────────────── */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" required aria-required="true"
                    className="mt-1 h-4 w-4 border-gray-300 rounded cursor-pointer"
                    style={{ accentColor: '#027e7e' }} />
                  <span className="text-sm text-gray-600">
                    J'accepte les{' '}
                    <a href="/cgu" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: '#027e7e' }}>conditions générales d'utilisation</a>
                    {' '}et la{' '}
                    <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: '#027e7e' }}>politique de confidentialité</a>.
                    {' '}<span className="text-red-500">*</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" required aria-required="true"
                    className="mt-1 h-4 w-4 border-gray-300 rounded cursor-pointer"
                    style={{ accentColor: '#027e7e' }} />
                  <span className="text-sm text-gray-600">
                    Je consens au traitement de mes données personnelles (nom, prénom, email, localisation, diplômes) pour la mise en relation avec des familles et la gestion de mon compte professionnel.
                    {' '}<span className="text-red-500">*</span>
                  </span>
                </label>
              </div>

              {/* ── Submit button ─────────────────────────────────────────── */}
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full py-4 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 flex items-center justify-center gap-3"
                style={{ backgroundColor: '#027e7e' }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" aria-hidden="true" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    Rejoindre NeuroCare gratuitement
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                Inscription gratuite · Aucune carte bancaire requise · Vous recevrez un email de confirmation
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* ── 5. Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center text-sm text-gray-400">
          <p>
            © 2025 NeuroCare ·{' '}
            <a href="https://neuro-care.fr" className="hover:underline">neuro-care.fr</a>
            {' '}·{' '}
            <a href="mailto:contact@neuro-care.fr?subject=Désabonnement campagne" className="hover:underline">
              Se désabonner
            </a>
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs">
            <a href="/mentions-legales" className="hover:underline">Mentions légales</a>
            <span className="text-gray-200">·</span>
            <a href="/politique-confidentialite" className="hover:underline">Politique de confidentialité</a>
            <span className="text-gray-200">·</span>
            <a href="/cgu" className="hover:underline">CGU</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
