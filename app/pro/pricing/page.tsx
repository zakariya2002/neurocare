'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProNavbar from '@/components/ProNavbar';

export default function ProPricingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
    // Overscroll violet
    document.documentElement.classList.add('pro-theme');
    return () => {
      document.documentElement.classList.remove('pro-theme');
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  const features = [
    { icon: '🎯', title: 'Visibilité Maximum', description: 'Profil visible par toutes les familles de votre région' },
    { icon: '📅', title: 'Rendez-vous Illimités', description: 'Acceptez autant de rendez-vous que vous le souhaitez' },
    { icon: '💬', title: 'Messagerie Illimitée', description: 'Communication directe et sécurisée avec toutes les familles' },
    { icon: '💳', title: 'Gestion Financière', description: 'Définissez votre tarif et suivez vos interventions' },
    { icon: '⭐', title: 'Badge Vérifié', description: 'Inspirez confiance avec un profil vérifié' },
    { icon: '🔒', title: 'Sécurité & RGPD', description: 'Données cryptées et conformité RGPD' },
    { icon: '📊', title: 'Dashboard Pro', description: 'Statistiques complètes et calendrier intégré' },
    { icon: '🤝', title: 'Support Dédié', description: 'Assistance technique réactive' },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <ProNavbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-22 md:pt-24 pb-24 sm:pb-8">
        {/* Bouton retour */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-gray-800 mb-3 sm:mb-4 md:mb-6 transition-colors"
          aria-label="Retour"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs md:text-sm font-medium">Retour</span>
        </button>

        {/* Hero */}
        <div className="text-center mb-5 sm:mb-8 md:mb-12">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4 text-white font-bold text-xs sm:text-sm" style={{ backgroundColor: '#f0879f' }}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            100% Gratuit
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Un modèle{' '}
            <span style={{ color: '#41005c' }}>transparent</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-2">
            Inscription et utilisation gratuites. Vous ne payez que lorsque vous gagnez de l'argent.
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-10 md:mb-14">
          <div className="rounded-xl md:rounded-2xl shadow-xl border-2 overflow-hidden" style={{ borderColor: '#41005c' }}>
            {/* Header */}
            <div className="p-4 sm:p-5 md:p-6 text-white text-center" style={{ background: 'linear-gradient(135deg, #41005c 0%, #5a1a75 100%)' }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-base sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Accès complet et gratuit</h2>
              <p className="text-white/80 text-xs sm:text-sm">Toutes les fonctionnalités, sans abonnement</p>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-5 md:p-6 bg-white">
              {/* Price */}
              <div className="text-center mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold" style={{ color: '#41005c' }}>0€</div>
                    <p className="text-gray-500 font-medium text-[10px] sm:text-xs md:text-sm">Inscription gratuite</p>
                  </div>
                  <div className="text-xl sm:text-2xl text-gray-300">+</div>
                  <div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold" style={{ color: '#41005c' }}>12%</div>
                    <p className="text-gray-500 font-medium text-[10px] sm:text-xs md:text-sm">Commission sur RDV*</p>
                  </div>
                </div>
              </div>

              {/* Features list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {[
                  'Rendez-vous illimités',
                  'Conversations illimitées',
                  'Profil mis en avant',
                  'Badge vérifié',
                  'Dashboard complet',
                  'Support dédié',
                  'Outils de gestion',
                  'Statistiques avancées',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0879f' }}>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium text-xs sm:text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href={isLoggedIn ? "/dashboard/educator" : "/auth/register-educator"}
                className="block w-full text-center px-4 sm:px-6 py-2.5 sm:py-3 text-white rounded-xl font-bold text-xs sm:text-sm md:text-base shadow-lg hover:shadow-xl transition-all hover:opacity-90"
                style={{ backgroundColor: '#41005c' }}
              >
                {isLoggedIn ? 'Accéder à mon compte' : 'Créer mon profil gratuitement'}
              </Link>

              <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-3 sm:mt-4">
                * Commission uniquement sur les prestations réservées via NeuroCare
              </p>
            </div>
          </div>
        </div>

        {/* Comment ça marche */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5 md:p-6 mb-3 sm:mb-4 md:mb-6">
          <h2 className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-5 md:mb-6 text-center">
            Comment fonctionne la commission ?
          </h2>

          <div className="grid md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6">
            {[
              { num: '1', title: 'Créez votre profil', desc: 'Inscription 100% gratuite, aucun frais caché' },
              { num: '2', title: 'Recevez des demandes', desc: 'Les familles vous contactent via la plateforme' },
              { num: '3', title: 'Soyez rémunéré', desc: '12% de commission sur les RDV conclus' },
            ].map(step => (
              <div key={step.num} className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                  <span className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#41005c' }}>{step.num}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1 text-xs sm:text-sm md:text-base">{step.title}</h3>
                <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-3 sm:p-4 border" style={{ backgroundColor: 'rgba(65, 0, 92, 0.05)', borderColor: 'rgba(65, 0, 92, 0.2)' }}>
            <h4 className="font-bold text-gray-900 mb-2 sm:mb-3 text-xs sm:text-sm md:text-base">Exemple concret :</h4>
            <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm">
              Une famille vous réserve pour <strong style={{ color: '#41005c' }}>400€/mois</strong> via la plateforme
            </p>
            <div className="flex flex-wrap gap-4 sm:gap-6 text-gray-700">
              <div>
                <span className="text-[10px] sm:text-xs text-gray-500">Vous recevez</span>
                <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: '#41005c' }}>352€</p>
              </div>
              <div>
                <span className="text-[10px] sm:text-xs text-gray-500">Commission NeuroCare</span>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">48€</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(65, 0, 92, 0.2)' }}>
              <p className="font-semibold text-xs sm:text-sm" style={{ color: '#f0879f' }}>
                Vos clients existants ou trouvés en dehors de la plateforme = 0% de commission !
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-3 sm:mb-4 md:mb-6">
          <h2 className="text-sm sm:text-lg md:text-xl font-bold text-center text-gray-900 mb-3 sm:mb-5 md:mb-6">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 sm:p-3 md:p-4 border border-gray-100"
              >
                <div className="text-xl sm:text-2xl md:text-3xl mb-1.5 sm:mb-2">{feature.icon}</div>
                <h3 className="font-bold text-gray-900 mb-0.5 sm:mb-1 text-[11px] sm:text-xs md:text-sm">{feature.title}</h3>
                <p className="text-gray-600 text-[10px] sm:text-xs">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pourquoi ce modèle */}
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl md:rounded-2xl shadow-sm p-3 sm:p-5 md:p-6 border border-purple-100 mb-3 sm:mb-4 md:mb-6">
          <h2 className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-5 md:mb-6 text-center">
            Pourquoi ce modèle ?
          </h2>

          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
                title: 'Pas de frais fixes',
                desc: 'Vous ne payez rien pour vous inscrire et utiliser la plateforme. Zéro risque financier.',
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
                title: 'Alignement des intérêts',
                desc: 'Nous gagnons uniquement quand vous gagnez. Notre succès dépend du vôtre.',
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
                title: 'Transparence totale',
                desc: 'Un seul tarif simple : 12%. Pas de frais cachés, pas de surprises.',
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
                title: 'Focus sur la qualité',
                desc: 'Nous investissons dans la plateforme pour vous apporter toujours plus de familles.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0879f' }}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.icon}
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5 sm:mb-1 text-xs sm:text-sm">{item.title}</h3>
                  <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-3 sm:mb-4 md:mb-6">
          <h2 className="text-sm sm:text-lg md:text-xl font-bold text-center text-gray-900 mb-3 sm:mb-5 md:mb-6">
            Questions fréquentes
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {[
              {
                q: "L'inscription est-elle vraiment gratuite ?",
                a: "Oui, 100% gratuite. Vous créez votre profil, accédez à toutes les fonctionnalités et commencez à recevoir des demandes sans rien payer."
              },
              {
                q: "Comment fonctionne la commission de 12% ?",
                a: "La commission s'applique uniquement sur les prestations réservées et payées via NeuroCare. Vos clients existants ou trouvés en dehors de la plateforme ne sont pas concernés : 0% de commission."
              },
              {
                q: "Y a-t-il des limites sur le nombre de rendez-vous ?",
                a: "Non, aucune limite ! Vous pouvez accepter autant de rendez-vous et de conversations que vous le souhaitez."
              },
              {
                q: "Quand suis-je payé ?",
                a: "Après chaque prestation réalisée, le paiement vous est transféré directement sur votre compte bancaire, moins la commission de 12%."
              },
              {
                q: "Puis-je quitter la plateforme à tout moment ?",
                a: "Absolument. Pas d'engagement, pas de frais de résiliation. Vous êtes libre de partir quand vous le souhaitez."
              },
            ].map((faq, index) => (
              <details key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
                <summary className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 transition flex items-center justify-between text-xs sm:text-sm md:text-base">
                  {faq.q}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 group-open:rotate-180 transition-transform flex-shrink-0 ml-2" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 bg-gray-50 text-gray-700 border-t border-gray-200 text-xs sm:text-sm">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="rounded-xl md:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 text-center text-white" style={{ backgroundColor: '#41005c' }}>
          <h2 className="text-base sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">
            Prêt à développer votre activité ?
          </h2>
          <p className="text-xs sm:text-sm md:text-base mb-4 sm:mb-5 opacity-90">
            Rejoignez les professionnels qui font confiance à NeuroCare
          </p>
          <Link
            href={isLoggedIn ? "/dashboard/educator" : "/auth/register-educator"}
            className="inline-block px-5 sm:px-6 py-2.5 sm:py-3 bg-white rounded-xl hover:bg-gray-100 font-bold text-xs sm:text-sm md:text-base shadow-lg transition-all"
            style={{ color: '#41005c' }}
          >
            {isLoggedIn ? 'Accéder à mon compte' : 'Créer mon profil gratuitement'}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-white py-6 sm:py-8 md:py-10 px-3 sm:px-4 md:px-6 mt-6 sm:mt-10 md:mt-14" style={{ backgroundColor: '#41005c' }} role="contentinfo">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
            {/* Logo et description */}
            <div className="col-span-2 lg:col-span-1">
              <Link href="/pro" className="inline-block mb-3">
                <div className="flex items-center gap-2">
                  <img
                    src="/images/logo-neurocare.svg"
                    alt="Logo NeuroCare Pro"
                    className="h-10 sm:h-12 md:h-14 brightness-0 invert"
                  />
                  <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full" style={{ backgroundColor: '#f0879f' }}>
                    PRO
                  </span>
                </div>
              </Link>
              <p className="text-[10px] sm:text-xs md:text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                La plateforme de référence pour les professionnels de l'accompagnement des troubles neurodéveloppementaux.
              </p>
            </div>

            {/* Pour les pros */}
            <nav aria-labelledby="footer-nav-pros">
              <h3 id="footer-nav-pros" className="font-bold text-white mb-2 sm:mb-3 text-xs sm:text-sm">Pour les pros</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/pro/pricing" className="hover:text-white transition-colors">Notre modèle</Link></li>
                <li><Link href="/pro/how-it-works" className="hover:text-white transition-colors">Comment ça marche</Link></li>
                <li><Link href="/pro/sap-accreditation" className="hover:text-white transition-colors">Guide SAP</Link></li>
                <li><Link href="/auth/register-educator" className="hover:text-white transition-colors">S'inscrire</Link></li>
              </ul>
            </nav>

            {/* Ressources */}
            <nav aria-labelledby="footer-nav-ressources">
              <h3 id="footer-nav-ressources" className="font-bold text-white mb-2 sm:mb-3 text-xs sm:text-sm">Ressources</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </nav>

            {/* Familles */}
            <nav aria-labelledby="footer-nav-familles">
              <h3 id="footer-nav-familles" className="font-bold text-white mb-2 sm:mb-3 text-xs sm:text-sm">Familles</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs md:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/" className="hover:text-white transition-colors">Accueil familles</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Trouver un professionnel</Link></li>
                <li><Link href="/familles/aides-financieres" className="hover:text-white transition-colors">Aides financières</Link></li>
              </ul>
            </nav>
          </div>

          {/* Séparateur */}
          <div className="border-t pt-4 sm:pt-6" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <nav aria-label="Informations légales">
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
                  <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
                  <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
                </div>
              </nav>
              <p className="text-[10px] sm:text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                © 2025 NeuroCare. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
