'use client';

import Link from 'next/link';
import ProNavbar from '@/components/ProNavbar';

export default function ProLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProNavbar />

      <main role="main" className="mt-14 xl:mt-16">

        {/* ═══════════════════════════════════════════ */}
        {/* HERO SECTION - 80vh, conversion-first      */}
        {/* ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden min-h-[80vh] flex items-center" style={{ background: 'linear-gradient(135deg, #41005c 0%, #2d0040 50%, #1a0026 100%)' }}>
          {/* Motifs décoratifs */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-10 bg-pink-400 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full opacity-10 bg-purple-300 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full opacity-5 bg-white blur-3xl -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 w-full">
            <div className="max-w-3xl">
              {/* Badge social proof */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 sm:mb-8">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-pink-300 border-2 border-white/20" />
                  <div className="w-6 h-6 rounded-full bg-purple-300 border-2 border-white/20" />
                  <div className="w-6 h-6 rounded-full bg-teal-300 border-2 border-white/20" />
                </div>
                <span className="text-sm text-white/90 font-medium">Rejoignez les professionnels NeuroCare</span>
              </div>

              {/* H1 - Bénéfice chiffré + émotionnel */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-5 sm:mb-6">
                Recevez vos premiers{' '}
                <span className="relative inline-block">
                  <span className="relative z-10" style={{ color: '#f0879f' }}>RDV en 7 jours</span>
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-pink-500/20 rounded-full" aria-hidden="true" />
                </span>
                {' '}avec des familles motivées
              </h1>

              {/* Sous-titre - Problème → Solution */}
              <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-8 sm:mb-10 leading-relaxed max-w-2xl">
                Vous passez trop de temps à chercher des familles ?
                NeuroCare vous connecte directement avec des parents qui cherchent
                un professionnel TND dans votre ville.
              </p>

              {/* CTA duo */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
                <Link
                  href="/auth/register-educator"
                  className="inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group"
                  style={{ backgroundColor: '#f0879f', color: '#fff' }}
                >
                  Commencer gratuitement
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-white/70">
                <div className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Inscription gratuite</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Profil prêt en 2 min</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Sans engagement</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* BANDE DE STATS - Social proof chiffrée     */}
        {/* ═══════════════════════════════════════════ */}
        <section className="border-b border-gray-100" style={{ backgroundColor: '#faf8fc' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#41005c' }}>100%</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Gratuit pour démarrer</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#41005c' }}>2 min</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Pour créer votre profil</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#41005c' }}>0 no-show</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Paiement sécurisé</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#41005c' }}>24/7</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Votre profil visible</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* PROCESSUS EN 3 ÉTAPES                      */}
        {/* ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: '#faf8fc' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Opérationnel en{' '}
                <span style={{ color: '#41005c' }}>3 étapes</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500">
                Pas de paperasse, pas de frais cachés. C'est simple et rapide.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
              {/* Étape 1 */}
              <div className="text-center">
                <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #41005c, #6b21a8)' }}>
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">1</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Créez votre profil</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Renseignez vos spécialités, tarifs et disponibilités. C'est gratuit et prend 2 minutes.
                </p>
              </div>

              {/* Étape 2 */}
              <div className="text-center">
                <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #f0879f, #ec4899)' }}>
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">2</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Recevez des demandes</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Les familles de votre ville vous trouvent et réservent directement. Paiement sécurisé inclus.
                </p>
              </div>

              {/* Étape 3 */}
              <div className="text-center">
                <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #41005c, #6b21a8)' }}>
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">3</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Accompagnez sereinement</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Gérez vos RDV, suivez vos bénéficiaires et recevez vos paiements automatiquement.
                </p>
              </div>
            </div>

            {/* CTA intermédiaire */}
            <div className="text-center mt-10 sm:mt-14">
              <Link
                href="/auth/register-educator"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white text-base sm:text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: '#41005c' }}
              >
                Créer mon profil gratuitement
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* FONCTIONNALITÉS CLÉS                       */}
        {/* ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: '#faf8fc' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Tout ce dont vous avez besoin,{' '}
                <span style={{ color: '#41005c' }}>en un seul endroit</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[
                { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Agenda intelligent', desc: 'Gérez vos disponibilités et recevez des réservations automatiques.' },
                { icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', title: 'Paiement sécurisé', desc: 'Encaissement automatique à la réservation. Zéro impayé.' },
                { icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', title: 'Téléconsultation', desc: 'Visio intégrée pour vos séances à distance. Rien à installer.' },
                { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Dossier patient', desc: 'PPA, objectifs et suivi centralisés pour chaque bénéficiaire.' },
                { icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Facturation auto', desc: 'Factures générées automatiquement. Compatible URSSAF et CESU.' },
                { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', title: 'Réseau pro', desc: 'Connectez-vous avec d\'autres spécialistes pour un suivi global.' },
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-xl p-5 sm:p-6 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#f3e8ff' }}>
                    <svg className="w-5 h-5" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* CTA FINAL                                  */}
        {/* ═══════════════════════════════════════════ */}
        <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #41005c 0%, #2d0040 100%)' }}>
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full opacity-10 bg-pink-400 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full opacity-10 bg-purple-300 blur-3xl" />
          </div>

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
              Prêt à recevoir vos premiers RDV ?
            </h2>
            <p className="text-base sm:text-lg text-white/80 mb-8 sm:mb-10 max-w-xl mx-auto">
              Créez votre profil en 2 minutes. C'est gratuit, sans engagement,
              et vos premières demandes peuvent arriver dès cette semaine.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8">
              <Link
                href="/auth/register-educator"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: '#f0879f', color: '#fff' }}
              >
                Commencer gratuitement
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-white/60">
              <span>Inscription gratuite</span>
              <span>Sans engagement</span>
              <span>Profil prêt en 2 min</span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* FAQ RAPIDE                                 */}
        {/* ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10 sm:mb-12">
              Questions fréquentes
            </h2>

            <div className="space-y-4">
              {[
                { q: 'L\'inscription est-elle vraiment gratuite ?', a: 'Oui. Créer votre profil, être visible auprès des familles et accéder à toutes les fonctionnalités est 100% gratuit.' },
                { q: 'Combien de temps pour créer mon profil ?', a: '2 minutes suffisent. Renseignez vos spécialités, votre zone géographique et vos tarifs. Vous pouvez compléter votre profil à tout moment.' },
                { q: 'Comment sont sécurisés les paiements ?', a: 'Les paiements transitent par Stripe, leader mondial du paiement en ligne. Les familles paient à la réservation, et vous recevez le virement automatiquement après la séance.' },
                { q: 'Quels professionnels peuvent s\'inscrire ?', a: 'Tous les professionnels de l\'accompagnement TND : éducateurs spécialisés, psychologues, orthophonistes, psychomotriciens, ergothérapeutes, et bien d\'autres.' },
                { q: 'Puis-je annuler à tout moment ?', a: 'Oui. Aucun engagement. Vous pouvez suspendre ou supprimer votre profil à tout moment, sans frais.' },
              ].map((faq, index) => (
                <details key={index} className="group bg-gray-50 rounded-xl border border-gray-100">
                  <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 font-semibold text-gray-900 text-sm sm:text-base">
                    {faq.q}
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER                                     */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="text-white py-10 sm:py-12 px-4 sm:px-6" style={{ backgroundColor: '#41005c' }} role="contentinfo">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
            <div className="col-span-2 lg:col-span-1">
              <Link href="/pro" className="inline-block mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <img src="/images/logo-neurocare.svg" alt="NeuroCare Pro" className="h-12 sm:h-16 brightness-0 invert" />
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ backgroundColor: '#f0879f' }}>PRO</span>
                </div>
              </Link>
              <p className="text-xs sm:text-sm leading-relaxed text-white/70">
                La plateforme de référence pour les professionnels de l'accompagnement TND.
              </p>
            </div>

            <nav aria-labelledby="footer-nav-pros">
              <h3 id="footer-nav-pros" className="font-bold text-white text-sm sm:text-base mb-3 sm:mb-4">Pour les pros</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/70">
                <li><Link href="/pro/sap-accreditation" className="hover:text-white transition-colors">Guide SAP</Link></li>
                <li><Link href="/auth/register-educator" className="hover:text-white transition-colors">S'inscrire</Link></li>
              </ul>
            </nav>

            <nav aria-labelledby="footer-nav-ressources">
              <h3 id="footer-nav-ressources" className="font-bold text-white text-sm sm:text-base mb-3 sm:mb-4">Ressources</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/70">
                <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </nav>

            <nav aria-labelledby="footer-nav-familles">
              <h3 id="footer-nav-familles" className="font-bold text-white text-sm sm:text-base mb-3 sm:mb-4">Familles</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/70">
                <li><Link href="/" className="hover:text-white transition-colors">Accueil</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Trouver un pro</Link></li>
                <li><Link href="/familles/aides-financieres" className="hover:text-white transition-colors">Aides financières</Link></li>
              </ul>
            </nav>
          </div>

          <div className="border-t pt-6 sm:pt-8" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              <nav aria-label="Informations légales">
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/70">
                  <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
                  <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
                  <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
                </div>
              </nav>
              <p className="text-xs sm:text-sm text-white/70">
                © {new Date().getFullYear()} NeuroCare
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
