'use client';

import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import TndToggle from '@/components/TndToggle';
import { useTnd } from '@/contexts/TndContext';
import AboutTnd from './page-tnd';

export default function AboutPage() {
  const { tndMode } = useTnd();

  if (tndMode) {
    return (
      <>
        <AboutTnd />
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Qui sommes-nous ?
          </h1>
          {/* Ligne décorative */}
          <div className="w-20 sm:w-28 h-[2px] bg-gray-300 mx-auto mb-3 sm:mb-4" aria-hidden="true"></div>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            neurocare est né d'une vision simple : faciliter la rencontre entre les familles
            concernées par l'autisme et les professionnels qualifiés qui peuvent les accompagner.
          </p>
          <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-5 shadow-md">
            <p className="text-xs sm:text-sm md:text-base text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Notre plateforme a été pensée avant tout pour <span className="font-bold" style={{ color: '#027e7e' }}>aider les institutions et les familles en manque de places</span>,
              sans solutions ou avec des solutions qui ne correspondent pas à leurs besoins spécifiques.
            </p>
          </div>
        </div>
      </section>

      {/* Notre Mission */}
      <section className="py-6 sm:py-10 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-5 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Connecter, accompagner, <span style={{ color: '#027e7e' }}>transformer</span>
            </h2>
            <div className="w-20 h-[2px] bg-gray-300 mx-auto" aria-hidden="true"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-5 shadow-md">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2 sm:mb-3" style={{ backgroundColor: '#027e7e' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5" style={{ fontFamily: 'Verdana, sans-serif' }}>Diplômes vérifiés</h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Tous les éducateurs sont vérifiés par la DREETS pour garantir leur qualification.
              </p>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-5 shadow-md">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#3a9e9e' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5" style={{ fontFamily: 'Verdana, sans-serif' }}>Gain de temps</h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Trouvez et contactez des professionnels en quelques clics seulement.
              </p>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-5 shadow-md">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#6bbebe' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5" style={{ fontFamily: 'Verdana, sans-serif' }}>Gratuit pour les familles</h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Recherche, contact et prise de rendez-vous sans aucun frais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Valeurs */}
      <section className="py-6 sm:py-10 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-5 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Ce qui guide notre <span style={{ color: '#027e7e' }}>action</span>
            </h2>
            <div className="w-20 h-[2px] bg-gray-300 mx-auto mb-3" aria-hidden="true"></div>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Des principes fondamentaux qui inspirent chacune de nos décisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-5 shadow-md text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#f0879f' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>Bienveillance</h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Nous mettons l'humain au cœur de notre démarche, avec empathie et respect pour chaque famille et chaque professionnel.
              </p>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-5 shadow-md text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#f4a3b3' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>Confiance</h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                La vérification rigoureuse des diplômes et la transparence des profils garantissent une relation de confiance.
              </p>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-5 shadow-md text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#f8bfc7' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>Accessibilité</h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Nous rendons l'accès aux services d'éducation spécialisée simple, rapide et sans barrière financière pour les familles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* L'équipe */}
      <section className="py-6 sm:py-10 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-5 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Les visages <span style={{ color: '#027e7e' }}>derrière le projet</span>
            </h2>
            <div className="w-20 h-[2px] bg-gray-300 mx-auto mb-3" aria-hidden="true"></div>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Une équipe passionnée et engagée pour faire bouger les choses dans le secteur médico-social
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-5 sm:mb-8">
            {/* Fondateur */}
            <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-5 shadow-md text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#027e7e' }}>
                ZB
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Zakariya B.</h3>
              <p className="text-sm font-semibold mb-2" style={{ color: '#027e7e' }}>Fondateur & Développeur</p>
              <p className="text-gray-600 text-xs" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Passionné par l'impact social et la technologie, Zakariya a créé neurocare pour répondre à un besoin réel du secteur médico-social.
              </p>
            </div>

            {/* Partenaire éducateur */}
            <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-5 shadow-md text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#3a9e9e' }}>
                ML
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Marie L.</h3>
              <p className="text-sm font-semibold mb-2" style={{ color: '#3a9e9e' }}>Éducatrice Spécialisée DEES</p>
              <p className="text-gray-600 text-xs" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Avec 8 ans d'expérience, Marie apporte son expertise terrain pour garantir que la plateforme réponde aux besoins réels des professionnels.
              </p>
            </div>

            {/* Représentant familles */}
            <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-5 shadow-md text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#6bbebe' }}>
                SP
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Sophie P.</h3>
              <p className="text-sm font-semibold mb-2" style={{ color: '#6bbebe' }}>Ambassadrice Familles</p>
              <p className="text-gray-600 text-xs" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Maman d'un enfant avec TSA, Sophie partage l'expérience des familles pour orienter le développement de la plateforme.
              </p>
            </div>
          </div>

          {/* Engagement */}
          <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-5 md:p-6 shadow-md">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#f0879f' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>Notre engagement humain</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-700" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              <p className="flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>
                  Nous sommes <strong style={{ color: '#027e7e' }}>à l'écoute</strong> de chaque retour, chaque suggestion, pour améliorer continuellement notre plateforme.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>
                  Notre équipe est <strong style={{ color: '#027e7e' }}>disponible</strong> pour vous accompagner à chaque étape, que vous soyez famille ou éducateur.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>
                  Nous travaillons chaque jour pour <strong style={{ color: '#027e7e' }}>faciliter l'inclusion</strong> et l'accès à des accompagnements de qualité pour tous.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-6 sm:py-10 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-5 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Comment <span style={{ color: '#027e7e' }}>ça marche ?</span>
            </h2>
            <div className="w-20 h-[2px] bg-gray-300 mx-auto mb-3" aria-hidden="true"></div>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Quatre étapes simples pour trouver l'accompagnement parfait
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-lg font-bold" style={{ backgroundColor: '#027e7e' }}>
                1
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Créez votre compte</h3>
              <p className="text-gray-600 text-xs" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Inscription gratuite en quelques minutes
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-lg font-bold" style={{ backgroundColor: '#3a9e9e' }}>
                2
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Recherchez</h3>
              <p className="text-gray-600 text-xs" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Filtrez par localisation et certifications
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-lg font-bold" style={{ backgroundColor: '#6bbebe' }}>
                3
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Contactez</h3>
              <p className="text-gray-600 text-xs" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Échangez directement avec les éducateurs
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-lg font-bold" style={{ backgroundColor: '#9bd4d4' }}>
                4
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Réservez</h3>
              <p className="text-gray-600 text-xs" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Prenez rendez-vous en ligne facilement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-6 sm:py-10 px-3 sm:px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 text-center text-white" style={{ backgroundColor: '#027e7e' }}>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Rejoignez neurocare dès aujourd'hui
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm mb-4 sm:mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Que vous soyez une famille ou un éducateur spécialisé, nous sommes là pour vous accompagner.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ color: '#027e7e' }}
                aria-label="Trouver un professionnel"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Trouver un professionnel
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-5 py-2.5 border-2 border-white rounded-lg text-sm font-semibold text-white transition-all hover:bg-white/10"
                aria-label="Créer un compte"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-6 sm:py-10" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-3 sm:mb-4">
              <Link href="/" className="inline-block" aria-label="Retour à l'accueil">
                <img
                  src="/images/logo-neurocare.svg"
                  alt="Logo neurocare"
                  className="h-14 sm:h-16 brightness-0 invert mx-auto"
                />
              </Link>
            </div>
            <p className="text-teal-100 text-xs sm:text-sm md:text-base mb-4 sm:mb-6">
              Connecter les familles avec les meilleurs éducateurs spécialisés
            </p>
            <div className="flex justify-center gap-3 sm:gap-4 mb-4 sm:mb-6 flex-wrap text-xs sm:text-sm">
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
            <div className="border-t border-teal-600 pt-4 sm:pt-6">
              <p className="text-teal-200 text-xs">
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
