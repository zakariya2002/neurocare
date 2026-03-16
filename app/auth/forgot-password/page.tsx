'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth';
import PublicNavbar from '@/components/PublicNavbar';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      const { translateError } = await import('@/lib/error-messages');
      setError(translateError(err.message || ''));
    } finally {
      setLoading(false);
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
            Mot de passe oublié
          </h2>
          {/* Ligne décorative */}
          <div className="w-16 h-[2px] mx-auto mb-4" style={{ background: 'linear-gradient(90deg, #027e7e 0%, #f0879f 100%)' }}></div>
          <p className="text-center text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Formulaire */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-6 sm:py-8 md:py-10 px-4 sm:px-6 shadow-xl rounded-xl md:rounded-2xl sm:px-12 border border-gray-100">
            {success ? (
              <div className="text-center" role="alert" aria-live="assertive">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4" style={{ backgroundColor: '#e6f4f4' }}>
                  <svg className="h-8 w-8" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  Email envoyé !
                </h3>
                <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Un lien de réinitialisation a été envoyé à <span className="font-semibold">{email}</span>.
                  Vérifiez votre boîte de réception et suivez les instructions.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="block w-full py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white text-center transition-all shadow-md hover:shadow-lg hover:opacity-90"
                    style={{ backgroundColor: '#027e7e' }}
                  >
                    Retour à la connexion
                  </Link>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                    }}
                    className="block w-full py-3 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 text-center transition-all"
                  >
                    Envoyer un autre email
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-4 sm:space-y-5 md:space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r" role="alert" aria-live="assertive">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

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
                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className="group relative w-full flex justify-center py-2.5 md:py-3 px-4 border border-transparent rounded-lg text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 hover:opacity-90"
                    style={{ backgroundColor: '#027e7e' }}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Envoi en cours...
                      </div>
                    ) : (
                      <span className="flex items-center">
                        Envoyer le lien de réinitialisation
                        <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">ou</span>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <Link href="/auth/login" className="text-sm font-semibold hover:underline transition-colors flex items-center" style={{ color: '#027e7e' }}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Retour à la connexion
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Informations supplémentaires */}
          {!success && (
            <div className="mt-6 border rounded-lg p-4" style={{ backgroundColor: '#e6f4f4', borderColor: '#b3d9d9' }}>
              <div className="flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm" style={{ color: '#065f5f' }}>
                  <p className="font-semibold mb-1">Que se passe-t-il ensuite ?</p>
                  <ul className="list-disc list-inside space-y-1" style={{ color: '#087878' }}>
                    <li>Vous recevrez un email avec un lien sécurisé</li>
                    <li>Le lien est valable pendant 1 heure</li>
                    <li>Cliquez sur le lien pour créer un nouveau mot de passe</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Liens RGPD */}
          <div className="mt-6 pt-6">
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
  );
}
