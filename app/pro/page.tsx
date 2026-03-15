'use client';

import Link from 'next/link';
import ProNavbar from '@/components/ProNavbar';

export default function ProLandingPage() {

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <ProNavbar />

      {/* Hero Section */}
      <main role="main" className="mt-14 xl:mt-16">
      <section className="relative overflow-hidden" style={{ backgroundColor: '#fdf9f4' }}>
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: 'rgba(65, 0, 92, 0.08)' }} aria-hidden="true"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: 'rgba(240, 135, 159, 0.15)' }} aria-hidden="true"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6">
                Développez votre activité avec{' '}
                <span style={{ color: '#41005c' }}>
                  NeuroCare
                </span>{' '}
                <span style={{ color: '#f0879f' }}>
                  Pro
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Rejoignez la première plateforme qui met en relation les professionnels de l'accompagnement autisme avec les familles.
                Gagnez en visibilité et simplifiez votre gestion au quotidien.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <Link
                  href="/auth/register-educator"
                  className="inline-flex items-center justify-center gap-2 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all shadow-lg hover:shadow-xl hover:opacity-90 group"
                  style={{ backgroundColor: '#41005c' }}
                >
                  <span className="sm:hidden">Créer mon profil</span>
                  <span className="hidden sm:inline">Créer mon profil gratuitement</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/pro/how-it-works"
                  className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg border-2 border-gray-200 transition-all hover:border-[#41005c] hover:text-[#41005c]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="sm:hidden">Comment ça marche</span>
                  <span className="hidden sm:inline">Voir comment ça marche</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#41005c' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs sm:text-sm">Inscription gratuite</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#41005c' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs sm:text-sm">Sans engagement</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#41005c' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs sm:text-sm">Profil en 5 min</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Nos Solutions Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden" style={{ backgroundColor: '#fdf9f4' }}>
        {/* Background decorations */}
        <div className="absolute top-1/2 left-0 w-72 h-72 rounded-full blur-3xl -translate-x-1/2" style={{ backgroundColor: 'rgba(65, 0, 92, 0.05)' }}></div>
        <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full blur-3xl translate-x-1/2" style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Une plateforme{' '}
              <span style={{ color: '#41005c' }}>
                tout-en-un
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Découvrez comment NeuroCare simplifie votre quotidien et améliore l'accompagnement des familles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {/* Solution 1 - Gestion RDV - Icône à gauche */}
            <div className="group bg-white rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#41005c]/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#41005c] to-[#6b21a8] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="12" cy="16" r="2" fill="currentColor"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#41005c] transition-colors">Gestion des RDV</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Planifiez et gérez vos rendez-vous avec notifications automatiques.</p>
                </div>
              </div>
            </div>

            {/* Solution 2 - Visibilité - Icône à droite */}
            <div className="group bg-white rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#f0879f]/30">
              <div className="flex items-start gap-4 flex-row-reverse">
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#f0879f] to-[#ec4899] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 12C4 7 7.5 4 12 4C16.5 4 20 7 22 12C20 17 16.5 20 12 20C7.5 20 4 17 2 12Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 9V12L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#f0879f] transition-colors">Plus de visibilité</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Soyez visible auprès des familles de votre région.</p>
                </div>
              </div>
            </div>

            {/* Solution 3 - Pluriprofessionnels - Icône à gauche */}
            <div className="group bg-white rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#41005c]/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#41005c] to-[#6b21a8] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="17" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 21V19C3 16.7909 4.79086 15 7 15H11C13.2091 15 15 16.7909 15 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M17 15C19.2091 15 21 16.7909 21 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#41005c] transition-colors">Pluriprofessionnels</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Toutes les spécialités réunies sur une plateforme.</p>
                </div>
              </div>
            </div>

            {/* Solution 4 - Liens renforcés - Icône à droite */}
            <div className="group bg-white rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#f0879f]/30">
              <div className="flex items-start gap-4 flex-row-reverse">
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#f0879f] to-[#ec4899] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M10 13L8.5 14.5C7.11929 15.8807 7.11929 18.1193 8.5 19.5C9.88071 20.8807 12.1193 20.8807 13.5 19.5L15 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M14 11L15.5 9.5C16.8807 8.11929 16.8807 5.88071 15.5 4.5C14.1193 3.11929 11.8807 3.11929 10.5 4.5L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M9 15L15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#f0879f] transition-colors">Liens renforcés</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Collaborez facilement avec les autres professionnels.</p>
                </div>
              </div>
            </div>

            {/* Solution 5 - Meilleur suivi - Icône à gauche */}
            <div className="group bg-white rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#41005c]/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#41005c] to-[#6b21a8] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M9 16H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#41005c] transition-colors">Meilleur suivi</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Dossier centralisé avec historique et objectifs.</p>
                </div>
              </div>
            </div>

            {/* Solution 6 - Solution financière - Icône à droite */}
            <div className="group bg-white rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#f0879f]/30">
              <div className="flex items-start gap-4 flex-row-reverse">
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#f0879f] to-[#ec4899] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 7V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M12 15.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M9.5 10C9.5 8.89543 10.6193 8 12 8C13.3807 8 14.5 8.89543 14.5 10C14.5 11.1046 13.3807 12 12 12C10.6193 12 9.5 12.8954 9.5 14C9.5 15.1046 10.6193 16 12 16C13.3807 16 14.5 15.1046 14.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#f0879f] transition-colors">Solution financière</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Facturation simplifiée URSSAF et CESU.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Prêt à rejoindre NeuroCare ?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8">
            Créez votre profil gratuitement en quelques minutes et commencez à recevoir des demandes de familles.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/auth/register-educator"
              className="inline-flex items-center justify-center gap-2 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all shadow-lg hover:shadow-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#41005c] focus:ring-offset-2"
              style={{ backgroundColor: '#41005c' }}
            >
              <span className="sm:hidden">Créer mon profil</span>
              <span className="hidden sm:inline">Créer mon profil gratuitement</span>
            </Link>
            <Link
              href="/pro/pricing"
              className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-[#41005c] focus:ring-offset-2"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="text-white py-8 sm:py-10 lg:py-12 px-4 sm:px-6" style={{ backgroundColor: '#41005c' }} role="contentinfo">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
            {/* Logo et description */}
            <div className="col-span-2 lg:col-span-1">
              <Link href="/pro" className="inline-block mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src="/images/logo-neurocare.svg"
                    alt="Logo NeuroCare Pro"
                    className="h-12 sm:h-16 brightness-0 invert"
                  />
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ backgroundColor: '#f0879f' }}>
                    PRO
                  </span>
                </div>
              </Link>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                La plateforme de référence pour les professionnels de l'accompagnement TND.
              </p>
            </div>

            {/* Pour les pros */}
            <nav aria-labelledby="footer-nav-pros">
              <h3 id="footer-nav-pros" className="font-bold text-white text-sm sm:text-base mb-3 sm:mb-4">Pour les pros</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/pro/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/pro/how-it-works" className="hover:text-white transition-colors">Comment ça marche</Link></li>
                <li><Link href="/pro/sap-accreditation" className="hover:text-white transition-colors">Guide SAP</Link></li>
                <li><Link href="/auth/register-educator" className="hover:text-white transition-colors">S'inscrire</Link></li>
              </ul>
            </nav>

            {/* Ressources */}
            <nav aria-labelledby="footer-nav-ressources">
              <h3 id="footer-nav-ressources" className="font-bold text-white text-sm sm:text-base mb-3 sm:mb-4">Ressources</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </nav>

            {/* Familles */}
            <nav aria-labelledby="footer-nav-familles">
              <h3 id="footer-nav-familles" className="font-bold text-white text-sm sm:text-base mb-3 sm:mb-4">Familles</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/" className="hover:text-white transition-colors">Accueil</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Trouver un pro</Link></li>
                <li><Link href="/familles/aides-financieres" className="hover:text-white transition-colors">Aides financières</Link></li>
              </ul>
            </nav>
          </div>

          {/* Séparateur */}
          <div className="border-t pt-6 sm:pt-8" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              {/* Liens légaux */}
              <nav aria-label="Informations légales">
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
                  <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
                  <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
                </div>
              </nav>

              {/* Copyright */}
              <p className="text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                © 2025 NeuroCare
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
