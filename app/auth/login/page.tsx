'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, signInWithGoogle } from '@/lib/auth';
import PublicNavbar from '@/components/PublicNavbar';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Vérifier si l'utilisateur vient de confirmer son email
  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    if (confirmed === 'true') {
      setShowConfirmationPopup(true);
      // Retirer le paramètre de l'URL sans recharger la page
      window.history.replaceState({}, '', '/auth/login');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await signIn(email, password);
      const role = user?.user_metadata?.role;

      // Rediriger selon le rôle
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'educator') {
        router.push('/dashboard/educator');
      } else if (role === 'family') {
        router.push('/dashboard/family');
      } else {
        router.push('/dashboard/educator');
      }
    } catch (err: any) {
      const { translateError } = await import('@/lib/error-messages');
      showToast(translateError(err.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      showToast(err.message || 'Une erreur est survenue lors de la connexion avec Google', 'error');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar showAuthButtons={true} />

      <div className="flex-1 flex flex-col justify-center pt-20 xl:pt-24 pb-8 sm:pb-12 px-3 sm:px-6 lg:px-8 relative z-0">
        {/* Logo et Titre */}
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
          <h2 className="text-center text-xl sm:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Connexion
          </h2>
          {/* Ligne décorative */}
          <div className="w-16 h-[2px] mx-auto mb-4" style={{ background: 'linear-gradient(90deg, #027e7e 0%, #f0879f 100%)' }}></div>
          <p className="text-center text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Pas encore de compte ?{' '}
            <Link href="/auth/signup" className="font-semibold hover:underline transition-colors" style={{ color: '#027e7e' }}>
              Inscrivez-vous gratuitement
            </Link>
          </p>
        </div>

      {/* Formulaire de connexion */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 sm:py-8 md:py-10 px-4 sm:px-6 shadow-xl rounded-xl md:rounded-2xl sm:px-12 border border-gray-100">
          <form className="space-y-4 sm:space-y-5 md:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                Adresse email <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="appearance-none block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm text-gray-900 bg-white"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                Mot de passe <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full pl-10 pr-12 py-2 md:py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm text-gray-900 bg-white"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
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
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 border-gray-300 rounded"
                  style={{ accentColor: '#027e7e' }}
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs md:text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-semibold hover:underline transition-colors" style={{ color: '#027e7e' }}>
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="group relative w-full flex justify-center py-2.5 md:py-3 px-4 border border-transparent rounded-lg text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 hover:opacity-90"
                style={{ backgroundColor: '#027e7e' }}
                aria-busy={loading}
              >
                {loading ? (
                  <div className="flex items-center" role="status" aria-live="polite">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Connexion en cours...</span>
                  </div>
                ) : (
                  <span className="flex items-center">
                    Se connecter
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Séparateur */}
          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-xs md:text-sm text-gray-500">ou continuer avec</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Bouton Google */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 md:py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow text-sm"
            >
              {googleLoading ? (
                <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>{googleLoading ? 'Connexion...' : 'Continuer avec Google'}</span>
            </button>
          </div>

          {/* Retour à l'accueil */}
          <div className="mt-6">
            <Link href="/" className="flex items-center justify-center text-sm text-gray-600 hover:underline transition-colors" style={{ '--hover-color': '#027e7e' } as any}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour à l&apos;accueil
            </Link>
          </div>

          {/* Liens RGPD */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">
              En vous connectant, vous acceptez nos conditions d&apos;utilisation.
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <Link href="/politique-confidentialite" className="text-gray-500 hover:underline" style={{ '--hover-color': '#027e7e' } as any}>
                Politique de confidentialité
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/cgu" className="text-gray-500 hover:underline" style={{ '--hover-color': '#027e7e' } as any}>
                CGU
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/mentions-legales" className="text-gray-500 hover:underline" style={{ '--hover-color': '#027e7e' } as any}>
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Popup de confirmation d'email */}
      {showConfirmationPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
          aria-describedby="confirmation-description"
        >
          <div className="bg-white rounded-xl md:rounded-2xl max-w-md w-full p-5 sm:p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              {/* Icône de succès */}
              <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#e6f4f4' }}>
                <svg className="w-10 h-10" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Titre */}
              <h3 id="confirmation-title" className="text-xl sm:text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Verdana, sans-serif' }}>
                Email vérifié !
              </h3>

              {/* Message */}
              <p id="confirmation-description" className="text-gray-600 mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Votre adresse email a bien été confirmée. Vous pouvez maintenant vous connecter à votre compte.
              </p>

              {/* Bouton de fermeture */}
              <button
                onClick={() => setShowConfirmationPopup(false)}
                className="w-full py-3 px-4 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: '#027e7e' }}
                autoFocus
              >
                C&apos;est compris !
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
