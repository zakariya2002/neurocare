'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { UserRole, CertificationType } from '@/types';
import { getCurrentPosition, reverseGeocode } from '@/lib/geolocation';
import Logo from '@/components/Logo';
import { useToast } from '@/components/Toast';

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Données d'authentification
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'family' as UserRole,
  });

  // Détecter si l'utilisateur est déjà connecté et a un rôle dans l'URL
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const roleParam = searchParams.get('role');

      if (session && roleParam) {
        // L'utilisateur est déjà connecté, on passe directement au formulaire de profil
        setAuthData(prev => ({ ...prev, role: roleParam as UserRole }));
        setStep(2);
      } else if (roleParam) {
        // Pas encore connecté mais role défini dans l'URL
        setAuthData(prev => ({ ...prev, role: roleParam as UserRole }));
      }
    };

    checkSession();
  }, [searchParams]);

  // Données de profil éducateur
  const [educatorData, setEducatorData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    phone: '',
    location: '',
    years_of_experience: 0,
    hourly_rate: '',
    specializations: '',
    languages: '',
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

  const [certifications, setCertifications] = useState<Array<{
    type: CertificationType;
    name: string;
    issuing_organization: string;
    issue_date: string;
  }>>([]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authData.password !== authData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (authData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Créer le compte utilisateur avec Supabase Auth
      const { data: authResult, error: authError } = await supabase.auth.signUp({
        email: authData.email,
        password: authData.password,
        options: {
          data: {
            role: authData.role,
          },
        },
      });

      if (authError) {
        // Message d'erreur plus explicite pour l'utilisateur
        const { translateError } = await import('@/lib/error-messages');
        throw new Error(translateError(authError.message));
      }

      if (!authResult.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      // Si l'email nécessite une confirmation et n'est pas confirmé
      if (authResult.user.email_confirmed_at === null) {
        setError('Un email de confirmation a été envoyé. Veuillez vérifier votre boîte mail.');
        setLoading(false);
        return;
      }

      // 2. Créer le profil via l'API
      const profileData = authData.role === 'educator' ? {
        first_name: educatorData.first_name,
        last_name: educatorData.last_name,
        bio: educatorData.bio,
        phone: educatorData.phone,
        location: educatorData.location,
        years_of_experience: educatorData.years_of_experience,
        hourly_rate: educatorData.hourly_rate ? parseFloat(educatorData.hourly_rate) : null,
        specializations: educatorData.specializations.split(',').map(s => s.trim()).filter(Boolean),
        languages: educatorData.languages.split(',').map(l => l.trim()).filter(Boolean),
      } : {
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

      const response = await fetch('/api/create-profile-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: authResult.user.id,
          role: authData.role,
          profileData,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de la création du profil');
      }

      // 3. Si éducateur venant de /pricing, rediriger vers Stripe Checkout
      const planParam = searchParams.get('plan');
      if (authData.role === 'educator' && planParam && result.data?.id) {
        // Créer la session Stripe
        const checkoutResponse = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            educatorId: result.data.id,
            planType: planParam,
          }),
        });

        const checkoutData = await checkoutResponse.json();

        if (checkoutData.url) {
          // Rediriger vers Stripe Checkout
          window.location.href = checkoutData.url;
          return;
        }
      }

      // 4. Sinon, rediriger vers le dashboard
      if (authData.role === 'educator') {
        router.push('/dashboard/educator');
      } else {
        router.push('/dashboard/family');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const addCertification = () => {
    setCertifications([...certifications, {
      type: 'ABA',
      name: '',
      issuing_organization: '',
      issue_date: '',
    }]);
  };

  const updateCertification = (index: number, field: string, value: any) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
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

  const handleUseCurrentLocation = async (type: 'educator' | 'family') => {
    setGeolocating(true);
    try {
      const position = await getCurrentPosition();
      const address = await reverseGeocode(position.latitude, position.longitude);

      if (address) {
        if (type === 'educator') {
          setEducatorData({ ...educatorData, location: address });
        } else {
          setFamilyData({ ...familyData, location: address });
        }
      } else {
        showToast('Impossible de déterminer votre adresse. Veuillez la saisir manuellement.', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la géolocalisation', 'error');
    } finally {
      setGeolocating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Logo iconSize="lg" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900">
            Créer votre compte
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Déjà inscrit ?{' '}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
              Se connecter
            </Link>
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step >= 1 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Compte</span>
            </div>
            <div className={`w-16 h-0.5 mx-4 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step >= 2 ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Profil</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Étape 1 : Création du compte */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Je suis
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="role-family"
                      type="radio"
                      value="family"
                      checked={authData.role === 'family'}
                      onChange={(e) => setAuthData({ ...authData, role: e.target.value as UserRole })}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                    />
                    <label htmlFor="role-family" className="ml-3 block text-sm font-medium text-gray-700">
                      Une famille / Personne avec TSA
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="role-educator"
                      type="radio"
                      value="educator"
                      checked={authData.role === 'educator'}
                      onChange={(e) => setAuthData({ ...authData, role: e.target.value as UserRole })}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                    />
                    <label htmlFor="role-educator" className="ml-3 block text-sm font-medium text-gray-700">
                      Un éducateur spécialisé
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mot de passe *</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe *</label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={authData.confirmPassword}
                    onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Continuer
              </button>
            </form>
          )}

          {/* Étape 2 : Profil Éducateur */}
          {step === 2 && authData.role === 'educator' && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Votre profil éducateur</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={educatorData.first_name}
                    onChange={(e) => setEducatorData({ ...educatorData, first_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom *</label>
                  <input
                    type="text"
                    required
                    value={educatorData.last_name}
                    onChange={(e) => setEducatorData({ ...educatorData, last_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  type="tel"
                  value={educatorData.phone}
                  onChange={(e) => setEducatorData({ ...educatorData, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Localisation *</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paris, France"
                    value={educatorData.location}
                    onChange={(e) => setEducatorData({ ...educatorData, location: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleUseCurrentLocation('educator')}
                    disabled={geolocating}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {geolocating ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="hidden sm:inline">Localisation...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  rows={3}
                  value={educatorData.bio}
                  onChange={(e) => setEducatorData({ ...educatorData, bio: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Années d'expérience *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={educatorData.years_of_experience}
                    onChange={(e) => setEducatorData({ ...educatorData, years_of_experience: parseInt(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tarif horaire (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={educatorData.hourly_rate}
                    onChange={(e) => setEducatorData({ ...educatorData, hourly_rate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Spécialisations (séparées par des virgules)</label>
                <input
                  type="text"
                  placeholder="Ex: Troubles du comportement, Communication, Autonomie"
                  value={educatorData.specializations}
                  onChange={(e) => setEducatorData({ ...educatorData, specializations: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Langues parlées (séparées par des virgules)</label>
                <input
                  type="text"
                  placeholder="Ex: Français, Anglais, Arabe"
                  value={educatorData.languages}
                  onChange={(e) => setEducatorData({ ...educatorData, languages: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          )}

          {/* Étape 2 : Profil Famille */}
          {step === 2 && authData.role === 'family' && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Votre profil famille</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={familyData.first_name}
                    onChange={(e) => setFamilyData({ ...familyData, first_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom *</label>
                  <input
                    type="text"
                    required
                    value={familyData.last_name}
                    onChange={(e) => setFamilyData({ ...familyData, last_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  type="tel"
                  value={familyData.phone}
                  onChange={(e) => setFamilyData({ ...familyData, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Localisation *</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paris, France"
                    value={familyData.location}
                    onChange={(e) => setFamilyData({ ...familyData, location: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleUseCurrentLocation('family')}
                    disabled={geolocating}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {geolocating ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="hidden sm:inline">Localisation...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <label className="block text-sm font-medium text-gray-700">Vous êtes *</label>
                <select
                  value={familyData.relationship}
                  onChange={(e) => setFamilyData({ ...familyData, relationship: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="parent">Parent</option>
                  <option value="guardian">Tuteur</option>
                  <option value="self">Personne avec TSA</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Âge de la personne avec TSA</label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={familyData.person_with_autism_age}
                  onChange={(e) => setFamilyData({ ...familyData, person_with_autism_age: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Niveau de soutien requis *</label>
                <select
                  value={familyData.support_level_needed}
                  onChange={(e) => setFamilyData({ ...familyData, support_level_needed: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="level_1">Niveau 1 - Nécessite un soutien</option>
                  <option value="level_2">Niveau 2 - Nécessite un soutien important</option>
                  <option value="level_3">Niveau 3 - Nécessite un soutien très important</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Besoins spécifiques (séparés par des virgules)</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Communication non verbale, Gestion des comportements, Compétences sociales"
                  value={familyData.specific_needs}
                  onChange={(e) => setFamilyData({ ...familyData, specific_needs: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
