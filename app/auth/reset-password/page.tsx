'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import { useToast } from '@/components/Toast';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { showToast } = useToast();

  useEffect(() => {
    if (!token) {
      setTokenError('Aucun token de réinitialisation trouvé');
      setChecking(false);
      return;
    }
    setIsValidToken(true);
    setChecking(false);
  }, [token]);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (!/[A-Z]/.test(pass)) {
      return 'Le mot de passe doit contenir au moins une majuscule';
    }
    if (!/[a-z]/.test(pass)) {
      return 'Le mot de passe doit contenir au moins une minuscule';
    }
    if (!/[0-9]/.test(pass)) {
      return 'Le mot de passe doit contenir au moins un chiffre';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordError = validatePassword(password);
    if (passwordError) {
      showToast(passwordError, 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error || 'Une erreur est survenue';
        if (msg.includes('expiré') || msg.includes('invalide')) {
          setTokenError(msg);
          setIsValidToken(false);
        } else {
          showToast(msg, 'error');
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      showToast(err.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        <PublicNavbar showAuthButtons={true} />
        <div className="flex-1 flex items-center justify-center pt-20 xl:pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#027e7e' }}></div>
            <p className="text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>Vérification du lien...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken && !checking) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        <PublicNavbar showAuthButtons={true} />
        <div className="flex-1 flex flex-col justify-center pt-20 xl:pt-24 pb-8 sm:pb-12 px-3 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Link href="/">
                <img
                  src="/images/logo-neurocare.svg"
                  alt="neurocare"
                  className="h-36"
                  style={{ filter: 'brightness(0) saturate(100%) invert(30%) sepia(80%) saturate(500%) hue-rotate(140deg) brightness(95%)' }}
                />
              </Link>
            </div>
            <div className="bg-white py-6 sm:py-8 md:py-10 px-4 sm:px-6 shadow-xl rounded-xl md:rounded-2xl sm:px-12 border border-gray-100">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  Lien invalide ou expiré
                </h3>
                <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  {tokenError || 'Le lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau.'}
                </p>
                <Link
                  href="/auth/forgot-password"
                  className="inline-block w-full py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white text-center transition-all shadow-md hover:shadow-lg hover:opacity-90"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  Demander un nouveau lien
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar showAuthButtons={true} />

      <div className="flex-1 flex flex-col justify-center pt-20 xl:pt-24 pb-8 sm:pb-12 px-3 sm:px-6 lg:px-8 relative z-0">
        {/* Logo et Titre */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <Link href="/">
              <img
                src="/images/logo-neurocare.svg"
                alt="neurocare"
                className="h-36"
                style={{ filter: 'brightness(0) saturate(100%) invert(30%) sepia(80%) saturate(500%) hue-rotate(140deg) brightness(95%)' }}
              />
            </Link>
          </div>
          <h2 className="text-center text-xl sm:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Nouveau mot de passe
          </h2>
          <div className="w-16 h-[2px] mx-auto mb-4" style={{ background: 'linear-gradient(90deg, #027e7e 0%, #f0879f 100%)' }}></div>
          <p className="text-center text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Choisissez un mot de passe sécurisé pour votre compte
          </p>
        </div>

        {/* Formulaire */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-6 sm:py-8 md:py-10 px-4 sm:px-6 shadow-xl rounded-xl md:rounded-2xl sm:px-12 border border-gray-100">
            {success ? (
              <div className="text-center" role="alert" aria-live="assertive">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4" style={{ backgroundColor: '#e6f4f4' }}>
                  <svg className="h-8 w-8" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  Mot de passe modifié !
                </h3>
                <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...
                </p>
                <div style={{ color: '#027e7e' }}>
                  <svg className="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            ) : (
              <form className="space-y-4 sm:space-y-5 md:space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="password" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                    Nouveau mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="appearance-none block w-full pl-10 pr-12 py-2 md:py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm"
                      style={{ '--tw-ring-color': '#027e7e' } as any}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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

                  {/* Indicateur de force */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded ${
                              i < passwordStrength
                                ? passwordStrength <= 2
                                  ? 'bg-red-500'
                                  : passwordStrength <= 4
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">
                        Force : {passwordStrength <= 2 ? 'Faible' : passwordStrength <= 4 ? 'Moyen' : 'Fort'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="appearance-none block w-full pl-10 pr-12 py-2 md:py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm"
                      style={{ '--tw-ring-color': '#027e7e' } as any}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="mt-1 text-xs text-green-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Les mots de passe correspondent
                    </p>
                  )}
                </div>

                {/* Critères du mot de passe */}
                <div className="border rounded-lg p-4" style={{ backgroundColor: '#e6f4f4', borderColor: '#b3d9d9' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#065f5f' }}>Votre mot de passe doit contenir :</p>
                  <ul className="text-xs space-y-1" style={{ color: '#087878' }}>
                    <li className="flex items-center">
                      <span className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                        {password.length >= 8 ? '✓' : '○'}
                      </span>
                      <span className="ml-2">Au moins 8 caractères</span>
                    </li>
                    <li className="flex items-center">
                      <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                        {/[A-Z]/.test(password) ? '✓' : '○'}
                      </span>
                      <span className="ml-2">Une lettre majuscule</span>
                    </li>
                    <li className="flex items-center">
                      <span className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                        {/[a-z]/.test(password) ? '✓' : '○'}
                      </span>
                      <span className="ml-2">Une lettre minuscule</span>
                    </li>
                    <li className="flex items-center">
                      <span className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                        {/[0-9]/.test(password) ? '✓' : '○'}
                      </span>
                      <span className="ml-2">Un chiffre</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                    className="group relative w-full flex justify-center py-2.5 md:py-3 px-4 border border-transparent rounded-lg text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 hover:opacity-90"
                    style={{ backgroundColor: '#027e7e' }}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Réinitialisation...
                      </div>
                    ) : (
                      <span className="flex items-center">
                        Réinitialiser le mot de passe
                        <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center">
                  <Link href="/auth/login" className="text-sm font-semibold hover:underline transition-colors flex items-center" style={{ color: '#027e7e' }}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Retour à la connexion
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Liens RGPD */}
          <div className="mt-6 pt-6">
            <div className="flex justify-center gap-4 text-xs">
              <Link href="/politique-confidentialite" className="text-gray-500 hover:underline">
                Politique de confidentialité
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/cgu" className="text-gray-500 hover:underline">
                CGU
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/mentions-legales" className="text-gray-500 hover:underline">
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
