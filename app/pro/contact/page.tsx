'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProNavbar from '@/components/ProNavbar';

export default function ProContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: ''
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du message');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '', userType: '' });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProNavbar />

      {/* HERO SECTION */}
      <section className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 overflow-hidden" style={{ background: 'linear-gradient(135deg, #41005c 0%, #6b21a8 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-white" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Contactez l'équipe NeuroCare Pro
          </h1>
          <p className="text-base sm:text-lg text-white max-w-2xl mx-auto mb-8" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Nous savons que chaque situation est unique. Quelle que soit votre question,
            notre équipe est là pour vous accompagner avec bienveillance.
          </p>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Réponse sous 24h</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Lun - Ven, 9h - 18h</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Données protégées</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION "AVANT DE NOUS ÉCRIRE" */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-10 mb-8 sm:mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link href="/pro/devenir-liberal" className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 sm:p-5 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0e6f5' }}>
              <svg className="w-5 h-5" style={{ color: '#6b21a8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition-colors">Devenir libéral</p>
              <p className="text-xs text-gray-500 mt-0.5">Guide complet pour se lancer</p>
            </div>
          </Link>

          <Link href="/pro" className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 sm:p-5 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0e6f5' }}>
              <svg className="w-5 h-5" style={{ color: '#6b21a8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition-colors">Découvrir NeuroCare Pro</p>
              <p className="text-xs text-gray-500 mt-0.5">Fonctionnalités et avantages</p>
            </div>
          </Link>

          <Link href="/auth/register-educator" className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 sm:p-5 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0e6f5' }}>
              <svg className="w-5 h-5" style={{ color: '#6b21a8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition-colors">Créer mon profil</p>
              <p className="text-xs text-gray-500 mt-0.5">Inscription gratuite en 2 minutes</p>
            </div>
          </Link>
        </div>
      </section>

      {/* FORMULAIRE DE CONTACT */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Envoyez-nous un message
            </h2>
            <p className="text-sm text-gray-500">
              Tous les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires.
            </p>
          </div>

          {success && (
            <div className="mb-6 rounded-xl p-4 sm:p-5" style={{ backgroundColor: '#f0e6f5' }} role="alert" aria-live="assertive">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6b21a8' }}>
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Message envoyé avec succès</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Merci pour votre message. Notre équipe vous répondra dans les 24 heures ouvrées.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4" role="alert" aria-live="assertive">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom complet <span className="text-red-500" aria-label="champ requis">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  aria-required="true"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adresse email <span className="text-red-500" aria-label="champ requis">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  aria-required="true"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="jean.dupont@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vous êtes <span className="text-red-500" aria-label="champ requis">*</span>
                </label>
                <select
                  id="userType"
                  name="userType"
                  required
                  aria-required="true"
                  value={formData.userType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                >
                  <option value="" disabled>Sélectionnez votre profil</option>
                  <option value="educator">Éducateur / Éducatrice</option>
                  <option value="psychologist">Psychologue</option>
                  <option value="therapist">Orthophoniste / Psychomotricien</option>
                  <option value="institution">Institution ou association</option>
                  <option value="other">Autre professionnel</option>
                </select>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sujet <span className="text-red-500" aria-label="champ requis">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  aria-required="true"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                >
                  <option value="" disabled>Choisissez un sujet</option>
                  <option value="Question générale">Question générale</option>
                  <option value="Inscription / Profil">Inscription / Profil</option>
                  <option value="Problème technique">Problème technique</option>
                  <option value="Vérification de diplôme">Vérification de diplôme</option>
                  <option value="Demande de partenariat">Demande de partenariat</option>
                  <option value="Signaler un problème">Signaler un problème</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                Votre message <span className="text-red-500" aria-label="champ requis">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                aria-required="true"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm resize-none bg-gray-50 focus:bg-white"
                placeholder="Décrivez votre demande. N'hésitez pas à être précis, cela nous aidera à mieux vous répondre."
              />
            </div>

            <div className="flex items-start gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p>
                Vos données sont protégées conformément au RGPD et utilisées uniquement pour répondre à votre demande.{' '}
                <Link href="/privacy" className="underline hover:text-purple-700" style={{ color: '#6b21a8' }}>
                  Politique de confidentialité
                </Link>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              aria-label={loading ? 'Envoi du message en cours' : 'Envoyer mon message'}
              className="w-full sm:w-auto px-8 py-3 text-sm text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 hover:opacity-90 shadow-md hover:shadow-lg"
              style={{ backgroundColor: '#6b21a8' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Envoyer mon message
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* INFOS PRATIQUES */}
      <section className="border-t border-gray-200" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <h2 className="text-center text-lg sm:text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Autres moyens de nous joindre
          </h2>
          <p className="text-center text-sm text-gray-500 mb-8">
            Vous préférez un contact direct ? Voici nos coordonnées.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-5 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0e6f5' }}>
                <svg className="w-6 h-6" style={{ color: '#6b21a8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Email</p>
              <a href="mailto:contact@neuro-care.fr" className="text-sm hover:underline" style={{ color: '#6b21a8' }} aria-label="Envoyer un email à contact@neuro-care.fr">
                contact@neuro-care.fr
              </a>
            </div>

            <div className="text-center p-5 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0e6f5' }}>
                <svg className="w-6 h-6" style={{ color: '#6b21a8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Horaires</p>
              <p className="text-sm text-gray-600">Lundi - Vendredi</p>
              <p className="text-sm text-gray-600">9h00 - 18h00</p>
            </div>

            <div className="text-center p-5 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0e6f5' }}>
                <svg className="w-6 h-6" style={{ color: '#6b21a8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Délai de réponse</p>
              <p className="text-sm text-gray-600">Sous 24 heures ouvrées</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-white py-8 sm:py-10" style={{ backgroundColor: '#41005c' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4">
              <Link href="/pro" className="inline-block">
                <img
                  src="/images/logo-neurocare.svg"
                  alt="NeuroCare"
                  className="h-14 sm:h-16 brightness-0 invert mx-auto"
                />
              </Link>
            </div>
            <p className="text-purple-200 text-sm mb-5">
              La plateforme des professionnels du neurodéveloppement
            </p>
            <div className="flex justify-center gap-4 sm:gap-6 mb-5 flex-wrap text-sm">
              <Link href="/pro" className="text-purple-200 hover:text-white transition-colors">
                Accueil Pro
              </Link>
              <Link href="/pro/devenir-liberal" className="text-purple-200 hover:text-white transition-colors">
                Devenir libéral
              </Link>
              <Link href="/auth/register-educator" className="text-purple-200 hover:text-white transition-colors">
                Créer mon profil
              </Link>
            </div>
            <div className="flex justify-center gap-4 sm:gap-6 mb-5 flex-wrap text-xs">
              <Link href="/privacy" className="text-purple-300 hover:text-white transition-colors">
                Politique de confidentialité
              </Link>
              <Link href="/mentions-legales" className="text-purple-300 hover:text-white transition-colors">
                Mentions légales
              </Link>
              <Link href="/terms" className="text-purple-300 hover:text-white transition-colors">
                CGU
              </Link>
            </div>
            <div className="border-t border-purple-800 pt-5">
              <p className="text-purple-300 text-xs">
                © {new Date().getFullYear()} NeuroCare. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
