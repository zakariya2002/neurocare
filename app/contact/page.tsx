'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import TndToggle from '@/components/TndToggle';
import { useTnd } from '@/contexts/TndContext';
import ContactTnd from './page-tnd';

export default function ContactPage() {
  const { tndMode } = useTnd();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: 'family'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du message');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        userType: 'family'
      });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (tndMode) {
    return (
      <>
        <ContactTnd />
        <TndToggle />
      </>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <PublicNavbar />

      {/* Section Titre */}
      <section className="pt-16 xl:pt-20 pb-6 sm:pb-10 md:pb-12 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Pictogramme */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#027e7e' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Contactez-nous
          </h1>
          {/* Ligne décorative */}
          <div className="w-20 sm:w-28 h-[2px] bg-gray-300 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Une question ? Un besoin d'accompagnement ? Notre équipe est là pour vous aider.
          </p>
        </div>
      </section>

      {/* Contenu Principal */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 pb-6 sm:pb-10 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Formulaire de contact */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-3.5 sm:p-5 md:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
                Envoyez-nous un message
              </h2>

              {success && (
                <div className="mb-4 bg-teal-50 border-l-4 p-3 rounded-r-lg" style={{ borderColor: '#027e7e' }} role="alert" aria-live="assertive">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="font-medium" style={{ color: '#027e7e' }}>Votre message a été envoyé avec succès !</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg" role="alert" aria-live="assertive">
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      Nom complet <span className="text-red-600" aria-label="champ requis">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      aria-required="true"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-2 md:px-2.5 lg:px-3.5 py-1.5 md:py-1.5 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                      placeholder="Votre nom"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      Email <span className="text-red-600" aria-label="champ requis">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      aria-required="true"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-2 md:px-2.5 lg:px-3.5 py-1.5 md:py-1.5 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="userType" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Vous êtes <span className="text-red-600" aria-label="champ requis">*</span>
                  </label>
                  <select
                    id="userType"
                    name="userType"
                    required
                    aria-required="true"
                    value={formData.userType}
                    onChange={handleChange}
                    className="w-full px-2 md:px-2.5 lg:px-3.5 py-1.5 md:py-1.5 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                  >
                    <option value="family">Aidant</option>
                    <option value="educator">Professionnel</option>
                    <option value="institution">Institution</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Sujet <span className="text-red-600" aria-label="champ requis">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    aria-required="true"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-2 md:px-2.5 lg:px-3.5 py-1.5 md:py-1.5 lg:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                    placeholder="Comment pouvons-nous vous aider ?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Message <span className="text-red-600" aria-label="champ requis">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    aria-required="true"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                    placeholder="Décrivez votre demande en détail..."
                  />
                </div>

                {/* Mention RGPD */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold mb-1">Protection de vos données personnelles</p>
                      <p className="mb-2">
                        Les informations recueillies font l'objet d'un traitement informatique destiné à répondre à votre demande de contact.
                        Vos données sont conservées de manière sécurisée et ne seront pas transmises à des tiers.
                      </p>
                      <p className="text-xs text-gray-600">
                        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
                        Pour en savoir plus, consultez notre{' '}
                        <Link href="/privacy" className="underline hover:text-blue-600" style={{ color: '#027e7e' }}>
                          politique de confidentialité
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  aria-label={loading ? "Envoi du message en cours" : "Envoyer le message de contact"}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ backgroundColor: '#f0879f' }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Envoyer le message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Informations de contact */}
          <div className="space-y-3 sm:space-y-4">
            {/* Coordonnées */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-3.5 sm:p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
                Nos coordonnées
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#027e7e' }}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Email</p>
                    <a href="mailto:admin@neuro-care.fr" className="hover:underline" style={{ color: '#027e7e' }} aria-label="Envoyer un email à admin@neuro-care.fr">
                      admin@neuro-care.fr
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3a9e9e' }}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Horaires</p>
                    <p className="text-gray-600">Lundi - Vendredi</p>
                    <p className="text-gray-600">9h00 - 18h00</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6bbebe' }}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Temps de réponse</p>
                    <p className="text-gray-600">Moins de 24h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ rapide */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-3.5 sm:p-5">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2.5 sm:mb-3" style={{ fontFamily: 'Verdana, sans-serif' }}>
                Questions fréquentes
              </h3>
              <div className="space-y-2.5">
                <Link href="/about" className="block font-medium transition-colors flex items-center gap-2 hover:underline" style={{ color: '#027e7e' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Qui sommes-nous ?
                </Link>
                <Link href="/search" className="block font-medium transition-colors flex items-center gap-2 hover:underline" style={{ color: '#027e7e' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Trouver un professionnel
                </Link>
                <Link href="/familles/aides-financieres" className="block font-medium transition-colors flex items-center gap-2 hover:underline" style={{ color: '#027e7e' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Aides financières
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-white py-6 sm:py-10" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-3 sm:mb-4">
              <Link href="/" className="inline-block">
                <img
                  src="/images/logo-neurocare.svg"
                  alt="neurocare"
                  className="h-14 sm:h-16 brightness-0 invert mx-auto"
                />
              </Link>
            </div>
            <p className="text-teal-100 text-xs sm:text-sm md:text-base mb-4 sm:mb-6">
              Connecter les familles avec les meilleurs éducateurs spécialisés
            </p>
            <div className="flex justify-center gap-3 sm:gap-5 mb-4 sm:mb-6 flex-wrap text-xs sm:text-sm">
              <Link href="/about" className="text-teal-100 hover:text-white transition-colors">
                Qui sommes-nous ?
              </Link>
              <Link href="/search" className="text-teal-100 hover:text-white transition-colors">
                Trouver un professionnel
              </Link>
              <Link href="/contact" className="text-teal-100 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
            <div className="flex justify-center gap-3 sm:gap-5 mb-4 sm:mb-6 flex-wrap text-xs sm:text-xs">
              <Link href="/privacy" className="text-teal-100 hover:text-white transition-colors">
                Politique de confidentialité
              </Link>
              <Link href="/legal" className="text-teal-100 hover:text-white transition-colors">
                Mentions légales
              </Link>
              <Link href="/terms" className="text-teal-100 hover:text-white transition-colors">
                CGU
              </Link>
            </div>
            <div className="border-t border-teal-600 pt-4 sm:pt-6">
              <p className="text-teal-200 text-xs sm:text-sm">
                © 2024 neurocare. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
      <TndToggle />
    </div>
  );
}
