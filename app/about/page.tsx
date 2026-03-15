'use client';

import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar />

      {/* ─── HERO ─── */}
      <section className="pt-20 sm:pt-24 pb-10 sm:pb-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#027e7e', fontFamily: 'Open Sans, sans-serif' }}>
            Notre mission
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Chaque famille mérite un accompagnement{' '}
            <span style={{ color: '#027e7e' }}>adapté et de qualité</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            NeuroCare connecte les familles confrontées aux troubles du neurodéveloppement
            avec des professionnels qualifiés et vérifiés. Parce que trouver le bon accompagnement
            ne devrait jamais être un parcours du combattant.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-5 py-2.5 text-white rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#027e7e' }}
            >
              Trouver un professionnel
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-5 py-2.5 border-2 rounded-lg text-sm font-semibold transition-all hover:bg-gray-50"
              style={{ borderColor: '#027e7e', color: '#027e7e' }}
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CHIFFRES CLÉS ─── */}
      <section className="py-8 sm:py-10 px-4" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            <div>
              <p className="text-2xl sm:text-3xl font-bold mb-1">100%</p>
              <p className="text-xs sm:text-sm text-teal-100" style={{ fontFamily: 'Open Sans, sans-serif' }}>Diplômes vérifiés</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold mb-1">100%</p>
              <p className="text-xs sm:text-sm text-teal-100" style={{ fontFamily: 'Open Sans, sans-serif' }}>Gratuit pour tous</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold mb-1">DREETS</p>
              <p className="text-xs sm:text-sm text-teal-100" style={{ fontFamily: 'Open Sans, sans-serif' }}>Vérification officielle</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold mb-1">24h</p>
              <p className="text-xs sm:text-sm text-teal-100" style={{ fontFamily: 'Open Sans, sans-serif' }}>Délai de réponse moyen</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LE CONSTAT ─── */}
      <section className="py-10 sm:py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#f0879f', fontFamily: 'Open Sans, sans-serif' }}>
                Pourquoi NeuroCare existe
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
                Un parcours encore trop complexe pour les familles
              </h2>
              <div className="space-y-3 text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <p>
                  En France, les familles confrontées à l'autisme font face à des délais d'attente
                  de plusieurs mois, voire années, pour obtenir un diagnostic et un accompagnement adapté.
                </p>
                <p>
                  Les institutions manquent de places. Les professionnels en libéral sont difficiles
                  à identifier. Les familles se retrouvent seules, sans repère.
                </p>
                <p className="font-medium text-gray-900">
                  NeuroCare est né de ce constat : il fallait créer un pont entre les familles
                  et les professionnels qualifiés du secteur.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#fde8ec' }}>
                    <svg className="w-4 h-4" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">18 mois d'attente en moyenne</p>
                    <p className="text-xs text-gray-500">Pour obtenir un diagnostic de TSA en France</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#fde8ec' }}>
                    <svg className="w-4 h-4" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">700 000 personnes autistes</p>
                    <p className="text-xs text-gray-500">Dont beaucoup sans accompagnement adapté</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#fde8ec' }}>
                    <svg className="w-4 h-4" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Institutions saturées</p>
                    <p className="text-xs text-gray-500">IME, SESSAD et structures médico-sociales débordées</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── POUR QUI ? ─── */}
      <section className="py-10 sm:py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#027e7e', fontFamily: 'Open Sans, sans-serif' }}>
              Pour qui ?
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Une plateforme pensée pour tous les acteurs du parcours
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Familles */}
            <div className="rounded-xl p-5 border-2 transition-all hover:shadow-md" style={{ borderColor: '#027e7e', backgroundColor: '#f0fafa' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: '#027e7e' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>Familles</h3>
              <ul className="space-y-2 text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Trouvez un professionnel qualifié près de chez vous</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Consultez les avis d'autres parents</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Prenez rendez-vous en ligne, gratuitement</span>
                </li>
              </ul>
            </div>

            {/* Professionnels */}
            <div className="rounded-xl p-5 border border-gray-200 bg-white transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: '#f0879f' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>Professionnels</h3>
              <ul className="space-y-2 text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f0879f' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Développez votre activité libérale</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f0879f' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Gérez vos rendez-vous et votre agenda</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f0879f' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Valorisez vos diplômes et certifications</span>
                </li>
              </ul>
            </div>

            {/* Institutions */}
            <div className="rounded-xl p-5 border border-gray-200 bg-white transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-gray-800">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>Institutions</h3>
              <ul className="space-y-2 text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Orientez les familles vers des relais qualifiés</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Complétez votre réseau de professionnels</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Déchargez vos listes d'attente</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ─── */}
      <section className="py-10 sm:py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#027e7e', fontFamily: 'Open Sans, sans-serif' }}>
              Simple et rapide
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Comment ça marche ?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Étape 1 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold" style={{ backgroundColor: '#027e7e' }}>
                1
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Recherchez</h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Trouvez un professionnel par localisation, spécialisation ou disponibilité.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold" style={{ backgroundColor: '#3a9e9e' }}>
                2
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Consultez le profil</h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Diplômes vérifiés, avis de familles, spécialisations : toutes les infos pour choisir en confiance.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold" style={{ backgroundColor: '#6bbebe' }}>
                3
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Prenez rendez-vous</h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Contactez le professionnel et réservez un créneau directement en ligne.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ENGAGEMENT QUALITÉ ─── */}
      <section className="py-10 sm:py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#027e7e', fontFamily: 'Open Sans, sans-serif' }}>
              Notre exigence
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Un processus de vérification rigoureux
            </h2>
            <p className="text-sm text-gray-600 max-w-xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Chaque professionnel inscrit sur NeuroCare passe par un parcours de validation
              en plusieurs étapes avant d'apparaître sur la plateforme.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#e0f5f5' }}>
                <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Vérification des diplômes</h3>
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Chaque diplôme est vérifié par analyse documentaire et confirmation auprès de la DREETS.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#e0f5f5' }}>
                <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Contrôle d'identité</h3>
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Vérification de l'identité et du casier judiciaire pour garantir la sécurité des familles.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#e0f5f5' }}>
                <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Avis vérifiés</h3>
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Seules les familles ayant eu un rendez-vous peuvent laisser un avis, garantissant leur authenticité.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#e0f5f5' }}>
                <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Suivi continu</h3>
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Les profils sont régulièrement mis à jour et surveillés pour maintenir un niveau de qualité élevé.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NOS VALEURS ─── */}
      <section className="py-10 sm:py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#f0879f', fontFamily: 'Open Sans, sans-serif' }}>
              Ce qui nous guide
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Nos valeurs
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="text-center p-5 rounded-xl bg-white shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#fde8ec' }}>
                <svg className="w-5 h-5" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Bienveillance</h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                L'humain au centre de chaque décision. Empathie et respect pour chaque famille, chaque professionnel.
              </p>
            </div>

            <div className="text-center p-5 rounded-xl bg-white shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#e0f5f5' }}>
                <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Confiance</h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Transparence totale sur les qualifications. Des profils vérifiés pour une relation sereine.
              </p>
            </div>

            <div className="text-center p-5 rounded-xl bg-white shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#fef3c7' }}>
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Accessibilité</h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Gratuit pour les familles. Un accès simple et sans barrière à des services de qualité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FONDATEUR ─── */}
      <section className="py-10 sm:py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#027e7e', fontFamily: 'Open Sans, sans-serif' }}>
              L'histoire
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Le mot du fondateur
            </h2>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 sm:p-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#027e7e' }}>
                ZN
              </div>
              <div>
                <blockquote className="text-sm text-gray-700 leading-relaxed mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  &laquo; En travaillant au contact du secteur médico-social, j'ai vu de près
                  la difficulté des familles à trouver un accompagnement adapté pour leur enfant.
                  Des listes d'attente interminables, des informations dispersées, un sentiment
                  d'isolement. NeuroCare est né de cette conviction : la technologie peut simplifier
                  ce parcours et redonner du pouvoir aux familles. &raquo;
                </blockquote>
                <div>
                  <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>Zakariya N.</p>
                  <p className="text-xs" style={{ color: '#027e7e', fontFamily: 'Open Sans, sans-serif' }}>Fondateur de NeuroCare</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-10 sm:py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl p-6 sm:p-8 text-center text-white" style={{ backgroundColor: '#027e7e' }}>
            <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Prêt à trouver le bon accompagnement ?
            </h2>
            <p className="text-teal-100 text-sm mb-5" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Rejoignez NeuroCare gratuitement et accédez à des professionnels vérifiés près de chez vous.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ color: '#027e7e' }}
              >
                Rechercher un professionnel
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-5 py-2.5 border-2 border-white rounded-lg text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Créer un compte gratuit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="text-white py-8" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="mb-3">
              <Link href="/" className="inline-block">
                <img
                  src="/images/logo-neurocare.svg"
                  alt="Logo NeuroCare"
                  className="h-14 brightness-0 invert mx-auto"
                />
              </Link>
            </div>
            <p className="text-teal-100 text-xs sm:text-sm mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Connecter les familles avec les professionnels qualifiés du neurodéveloppement
            </p>
            <div className="flex justify-center gap-4 mb-4 flex-wrap text-xs sm:text-sm">
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
            <div className="border-t border-teal-600 pt-4">
              <p className="text-teal-200 text-xs">
                © 2024 NeuroCare. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
