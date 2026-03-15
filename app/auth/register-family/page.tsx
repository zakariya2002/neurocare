'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCurrentPosition, reverseGeocode } from '@/lib/geolocation';
import CityAutocomplete from '@/components/CityAutocomplete';

interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export default function RegisterFamilyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Données d'authentification
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Données de profil famille
  const [familyData, setFamilyData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    relationship: 'parent',
    person_with_autism_age: '',
    support_level_needed: 'level_1',
    specific_needs: '',
    preferred_certifications: [] as string[],
    budget_min: '',
    budget_max: '',
  });

  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

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
    setAuthData({ ...authData, password: newPassword });
    setShowPasswordStrength(newPassword.length > 0);
    validatePassword(newPassword);
  };

  const getPasswordStrength = (): { label: string; color: string; percentage: number } => {
    const validCount = Object.values(passwordCriteria).filter(Boolean).length;

    if (validCount === 5) {
      return { label: 'Très fort', color: 'bg-green-500', percentage: 100 };
    } else if (validCount === 4) {
      return { label: 'Fort', color: 'bg-green-400', percentage: 80 };
    } else if (validCount === 3) {
      return { label: 'Moyen', color: 'bg-yellow-500', percentage: 60 };
    } else if (validCount >= 1) {
      return { label: 'Faible', color: 'bg-orange-500', percentage: 40 };
    } else {
      return { label: 'Très faible', color: 'bg-red-500', percentage: 20 };
    }
  };

  const handleUseCurrentLocation = async () => {
    setGeolocating(true);
    try {
      const position = await getCurrentPosition();
      const address = await reverseGeocode(position.latitude, position.longitude);

      if (address) {
        setFamilyData({ ...familyData, location: address });
      } else {
        alert('Impossible de déterminer votre adresse. Veuillez la saisir manuellement.');
      }
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la géolocalisation');
    } finally {
      setGeolocating(false);
    }
  };

  const handleCertificationToggle = (cert: string) => {
    const current = familyData.preferred_certifications;
    if (current.includes(cert)) {
      setFamilyData({
        ...familyData,
        preferred_certifications: current.filter(c => c !== cert),
      });
    } else {
      setFamilyData({
        ...familyData,
        preferred_certifications: [...current, cert],
      });
    }
  };

  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation du mot de passe
    if (authData.password !== authData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!validatePassword(authData.password)) {
      setError('Le mot de passe ne respecte pas tous les critères de sécurité');
      return;
    }

    setLoading(true);

    try {
      // Préparer les données du profil
      const profileData = {
        first_name: familyData.first_name,
        last_name: familyData.last_name,
        phone: familyData.phone,
        location: familyData.location,
        relationship: familyData.relationship,
        person_with_autism_age: familyData.person_with_autism_age ? parseInt(familyData.person_with_autism_age) : null,
        support_level_needed: familyData.support_level_needed,
        specific_needs: familyData.specific_needs.split(',').map(s => s.trim()).filter(Boolean),
        preferred_certifications: familyData.preferred_certifications,
        budget_min: familyData.budget_min ? parseFloat(familyData.budget_min) : null,
        budget_max: familyData.budget_max ? parseFloat(familyData.budget_max) : null,
      };

      // Appeler la nouvelle API d'inscription avec confirmation
      const response = await fetch('/api/register-with-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: authData.email,
          password: authData.password,
          role: 'family',
          profileData,
          baseUrl: window.location.origin,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création du compte');
      }

      // Marquer pour lancer le tutoriel après la première connexion
      localStorage.setItem('pending_family_onboarding', authData.email);

      // Afficher le message de succès avec instruction de vérifier l'email
      setRegistrationSuccess(true);

    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Si l'inscription a réussi, afficher le message de confirmation
  if (registrationSuccess) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="max-w-md w-full">
          <div
            className="bg-white rounded-xl md:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 text-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-description"
          >
            {/* Icône email */}
            <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
              <svg className="w-10 h-10" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            {/* Titre */}
            <h2 id="confirmation-title" className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Vérifiez votre boîte mail !
            </h2>

            {/* Message */}
            <div id="confirmation-description">
              <p className="text-gray-600 mb-6">
                Nous avons envoyé un email de confirmation à <strong className="text-gray-900">{authData.email}</strong>.
              </p>

              <p className="text-gray-500 text-sm mb-8">
                Cliquez sur le lien dans l'email pour activer votre compte et commencer à utiliser NeuroCare.
              </p>
            </div>

            {/* Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Vous n'avez pas reçu l'email ?</strong><br />
                Vérifiez votre dossier spam ou courrier indésirable.
              </p>
            </div>

            {/* Bouton retour */}
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
              style={{ backgroundColor: '#027e7e' }}
            >
              Aller à la page de connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8" style={{ backgroundColor: '#fdf9f4' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img
              src="/images/logo-neurocare.svg"
              alt="NeuroCare"
              className="h-32 mx-auto"
              style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(93%) saturate(1015%) hue-rotate(152deg) brightness(93%) contrast(98%)' }}
            />
          </Link>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm">
            <Link href="/auth/login" className="font-medium hover:underline" style={{ color: '#027e7e' }}>
              Déjà un compte ? Connectez-vous
            </Link>
            <span className="hidden sm:inline text-gray-300">|</span>
            <Link href="/auth/signup" className="text-gray-500 hover:text-gray-700">
              ← Changer de type de compte
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 lg:p-8">
          {error && (
            <div
              className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Section Compte */}
            <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(2, 126, 126, 0.05)', border: '1px solid rgba(2, 126, 126, 0.2)' }}>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  Compte Aidant / Personne avec TND
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                aria-required="true"
                value={authData.email}
                onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 md:py-3 px-3 md:px-4 text-sm focus:ring-2 focus:ring-[#027e7e] focus:border-[#027e7e] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  aria-required="true"
                  value={authData.password}
                  onChange={handlePasswordChange}
                  className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 pr-12 focus:ring-2 focus:ring-[#027e7e] focus:border-[#027e7e] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Indicateur de force du mot de passe */}
              {showPasswordStrength && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">
                      Force du mot de passe :
                    </span>
                    <span className={`text-xs font-semibold ${
                      getPasswordStrength().percentage === 100 ? 'text-green-600' :
                      getPasswordStrength().percentage >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {getPasswordStrength().label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrength().color}`}
                      style={{ width: `${getPasswordStrength().percentage}%` }}
                    ></div>
                  </div>

                  {/* Critères de validation */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'minLength', label: 'Au moins 8 caractères' },
                      { key: 'hasUppercase', label: 'Une lettre majuscule' },
                      { key: 'hasLowercase', label: 'Une lettre minuscule' },
                      { key: 'hasNumber', label: 'Un chiffre' },
                      { key: 'hasSpecialChar', label: 'Un caractère spécial' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center text-xs">
                        {passwordCriteria[key as keyof PasswordCriteria] ? (
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={passwordCriteria[key as keyof PasswordCriteria] ? 'text-green-700' : 'text-gray-600'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  aria-required="true"
                  value={authData.confirmPassword}
                  onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                  className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 pr-12 focus:ring-2 focus:ring-[#027e7e] focus:border-[#027e7e] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Séparateur */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Votre profil aidant</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  required
                  aria-required="true"
                  value={familyData.first_name}
                  onChange={(e) => setFamilyData({ ...familyData, first_name: e.target.value })}
                  className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 md:py-3 px-3 md:px-4 text-sm focus:ring-2 focus:ring-[#027e7e] focus:border-[#027e7e] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  aria-required="true"
                  value={familyData.last_name}
                  onChange={(e) => setFamilyData({ ...familyData, last_name: e.target.value })}
                  className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 md:py-3 px-3 md:px-4 text-sm focus:ring-2 focus:ring-[#027e7e] focus:border-[#027e7e] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={familyData.phone}
                onChange={(e) => setFamilyData({ ...familyData, phone: e.target.value })}
                className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 md:py-3 px-3 md:px-4 text-sm focus:ring-2 focus:ring-[#027e7e] focus:border-[#027e7e] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Localisation *</label>
              <div className="flex gap-2">
                <CityAutocomplete
                  value={familyData.location}
                  onChange={(val) => setFamilyData({ ...familyData, location: val })}
                  required
                  className="flex-1 border border-gray-300 rounded-xl shadow-sm py-2 md:py-3 px-3 md:px-4 text-sm focus:ring-2 focus:ring-[#027e7e] focus:border-[#027e7e] transition-all"
                />
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={geolocating}
                  aria-busy={geolocating}
                  aria-label="Utiliser ma position actuelle"
                  className="flex items-center gap-2 px-4 py-3 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  {geolocating ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" aria-hidden="true"></div>
                      <span className="hidden sm:inline">...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="hidden sm:inline">Ma position</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Vous êtes *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'parent', label: 'Parent' },
                  { value: 'guardian', label: 'Tuteur' },
                  { value: 'self', label: 'Personne avec TND' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFamilyData({ ...familyData, relationship: option.value })}
                    className={`py-2 md:py-3 px-3 md:px-4 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all ${
                      familyData.relationship === option.value
                        ? 'border-[#027e7e] bg-[#027e7e] text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-[#027e7e] hover:bg-[#f0fdfa]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Consentement RGPD */}
            <div className="space-y-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  aria-required="true"
                  className="mt-1 h-4 w-4 rounded cursor-pointer border-gray-300"
                  style={{ accentColor: '#027e7e' }}
                />
                <span className="text-sm text-gray-700">
                  J'accepte les{' '}
                  <a href="/cgu" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: '#027e7e' }}>
                    conditions générales d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: '#027e7e' }}>
                    politique de confidentialité
                  </a>
                  . <span className="text-red-500">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  aria-required="true"
                  className="mt-1 h-4 w-4 rounded cursor-pointer border-gray-300"
                  style={{ accentColor: '#027e7e' }}
                />
                <span className="text-sm text-gray-700">
                  Je consens au traitement de mes données personnelles pour la mise en relation avec des professionnels. <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-2.5 md:py-3.5 px-4 rounded-xl text-xs sm:text-sm md:text-base text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#027e7e' }}
            >
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </form>

          {/* Liens légaux RGPD */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
              <a href="/mentions-legales" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#027e7e' }}>
                Mentions légales
              </a>
              <span aria-hidden="true">•</span>
              <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#027e7e' }}>
                Politique de confidentialité
              </a>
              <span aria-hidden="true">•</span>
              <a href="/cgu" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#027e7e' }}>
                CGU
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
