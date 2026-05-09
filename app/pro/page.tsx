'use client';

import Link from 'next/link';
import Image from 'next/image';
import ProNavbar from '@/components/ProNavbar';
import BetaModal from '@/components/BetaModal';

export default function ProLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProNavbar />
      <BetaModal />

      {/* JSON-LD FAQPage pour rich snippets Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'Combien ça coûte ?', acceptedAnswer: { '@type': 'Answer', text: 'L\'inscription est 100% gratuite. NeuroCare prélève uniquement une commission sur les séances réalisées via la plateforme. Aucun frais caché, aucun engagement.' }},
            { '@type': 'Question', name: 'Quand suis-je payé ?', acceptedAnswer: { '@type': 'Answer', text: 'Les paiements sont automatiques via Stripe. Vous êtes crédité sur votre compte bancaire dans un délai de 2 à 5 jours après chaque séance, sans avoir à relancer les familles.' }},
            { '@type': 'Question', name: 'Puis-je gérer mon agenda librement ?', acceptedAnswer: { '@type': 'Answer', text: 'Oui. Vous définissez vos créneaux, vos tarifs, vos jours d\'indisponibilité. Vous pouvez bloquer ou modifier vos disponibilités à tout moment depuis votre tableau de bord.' }},
            { '@type': 'Question', name: 'Comment communiquer avec les familles ?', acceptedAnswer: { '@type': 'Answer', text: 'Une messagerie sécurisée intégrée vous permet d\'échanger avec les familles sans partager votre numéro personnel. Tous les échanges sont centralisés dans votre espace pro.' }},
            { '@type': 'Question', name: 'Quels documents sont vérifiés ?', acceptedAnswer: { '@type': 'Answer', text: 'Avant la mise en ligne de votre profil, nous vérifions votre numéro RPPS/ADELI, vos diplômes et certifications. Cette vérification garantit la confiance des familles.' }},
            { '@type': 'Question', name: 'Puis-je mettre en pause mon profil ?', acceptedAnswer: { '@type': 'Answer', text: 'Oui, à tout moment. Vous pouvez désactiver votre profil temporairement (vacances, congé maladie) ou définitivement, sans pénalité.' }},
          ]
        })}}
      />

      {/* JSON-LD Service pour rich snippets Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'NeuroCare Pro',
          serviceType: 'Plateforme pour professionnels de l\'accompagnement TND',
          provider: {
            '@type': 'Organization',
            name: 'NeuroCare',
          },
          areaServed: {
            '@type': 'Country',
            name: 'France',
          },
        })}}
      />

      <main role="main" className="mt-14 xl:mt-16">

        {/* ═══════════════════════════════════════════ */}
        {/* HERO SECTION                               */}
        {/* ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden min-h-[65vh] flex items-center" style={{ background: 'linear-gradient(135deg, #41005c 0%, #2d0040 50%, #1a0026 100%)' }}>
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-10 bg-pink-400 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full opacity-10 bg-purple-300 blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Texte à gauche */}
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 sm:mb-8">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-pink-300 border-2 border-white/20" />
                    <div className="w-6 h-6 rounded-full bg-purple-300 border-2 border-white/20" />
                    <div className="w-6 h-6 rounded-full bg-teal-300 border-2 border-white/20" />
                  </div>
                  <span className="text-sm text-white/90 font-medium">Rejoignez les professionnels NeuroCare</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5 sm:mb-6">
                  Soyez{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10" style={{ color: '#f0879f' }}>référencé au niveau national</span>
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-pink-500/20 rounded-full" aria-hidden="true" />
                  </span>
                </h1>

                <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-8 sm:mb-10 leading-relaxed">
                  Profil visible partout en France auprès des familles à la recherche d&apos;un professionnel TND. Agenda, messagerie, factures, paiements — tous vos outils en un seul tableau de bord.
                </p>

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

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-white/70">
                  {['Inscription gratuite', 'Profil prêt en 5 min', 'Sans engagement'].map((text) => (
                    <div key={text} className="flex items-center gap-1.5">
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image à droite (au-dessus en mobile) */}
              <div className="relative order-first lg:order-last">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/images/therapeute-enfant-autiste-salle-de-therapie-860x573.jpg"
                    alt="Professionnelle accompagnant un enfant en séance de thérapie"
                    className="w-full h-auto max-h-[260px] sm:max-h-[360px] lg:max-h-none object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent" />
                </div>
                {/* Carte flottante - inscription rapide */}
                <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Inscription en 5 min</p>
                    <p className="text-xs text-gray-500">Profil prêt rapidement</p>
                  </div>
                </div>
                {/* Carte flottante - paiements Stripe */}
                <div className="hidden sm:flex absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-3 items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-700">Paiements Stripe</span>
                </div>
                {/* Carte flottante - agenda intelligent */}
                <div className="hidden lg:flex absolute top-1/3 -right-8 bg-white rounded-xl shadow-xl p-3 items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-700">Agenda en ligne</span>
                </div>
                {/* Carte flottante - factures auto */}
                <div className="hidden lg:flex absolute bottom-1/4 -left-8 bg-white rounded-xl shadow-xl p-3 items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fce7f3' }}>
                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-700">Factures auto</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* BANDE DE STATS                             */}
        {/* ═══════════════════════════════════════════ */}
        <section className="border-b border-gray-100" style={{ backgroundColor: '#faf8fc' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
              {[
                { value: '100%', label: 'Gratuit' },
                { value: '5 min', label: 'Pour créer votre profil' },
                { value: 'Stripe', label: 'Paiement sécurisé' },
                { value: '24/7', label: 'Votre profil visible' },
              ].map((stat) => (
                <div key={stat.value}>
                  <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#41005c' }}>{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* 3 BÉNÉFICES (inspiré Doctolib)             */}
        {/* ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                3 raisons de rejoindre{' '}
                <span style={{ color: '#41005c' }}>NeuroCare</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
                Une plateforme pensée pour les professionnels du neurodéveloppement, pas un annuaire généraliste.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Bénéfice 1 - Visibilité nationale */}
              <div className="relative bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 sm:p-8 border border-purple-100">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-md" style={{ background: 'linear-gradient(135deg, #41005c 0%, #6b21a8 100%)' }}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Visibilité nationale</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Votre profil est référencé partout en France auprès des familles qui cherchent un pro TND. Pas de prospection.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  {[
                    { d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'Recherche par ville et spécialité' },
                    { d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Diplômes RPPS / ADELI vérifiés' },
                    { d: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 3.674a1 1 0 00.838.61l3.95.292c.969.072 1.371 1.24.588 1.81l-3.073 2.231a1 1 0 00-.364 1.118l1.18 3.794c.3.921-.755 1.688-1.54 1.118l-3.197-2.323a1 1 0 00-1.175 0l-3.197 2.323c-.785.57-1.84-.197-1.54-1.118l1.18-3.794a1 1 0 00-.364-1.118L2.682 9.313c-.783-.57-.38-1.738.588-1.81l3.95-.292a1 1 0 00.838-.61l1.519-3.674z', label: 'Mise en avant spécialisations TND' },
                  ].map((f) => (
                    <li key={f.label} className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#41005c' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={f.d} /></svg>
                      <span>{f.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bénéfice 2 - Outils tech */}
              <div className="relative bg-gradient-to-br from-pink-50 to-white rounded-2xl p-6 sm:p-8 border border-pink-100">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-md" style={{ background: 'linear-gradient(135deg, #f0879f 0%, #ec4899 100%)' }}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Tous vos outils intégrés</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Gérez votre activité depuis un seul tableau de bord. Moins d&apos;administratif, plus de temps pour vos bénéficiaires.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  {[
                    { d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Agenda en ligne synchronisé' },
                    { d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Messagerie centralisée familles' },
                    { d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Factures générées automatiquement' },
                    { d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Paiements sécurisés Stripe' },
                  ].map((f) => (
                    <li key={f.label} className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ec4899' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={f.d} /></svg>
                      <span>{f.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bénéfice 3 - Suivi & coordination */}
              <div className="relative bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 sm:p-8 border border-purple-100">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-md" style={{ background: 'linear-gradient(135deg, #41005c 0%, #6b21a8 100%)' }}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Suivi & coordination</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Structurez le parcours de chaque bénéficiaire. Coordonnez-vous avec les autres pros qui suivent l&apos;enfant.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  {[
                    { d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Dossier de suivi structuré' },
                    { d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: 'PPA (Projet Personnalisé) intégré' },
                    { d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: 'Coordination multi-pros' },
                    { d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Tableau de bord unifié' },
                  ].map((f) => (
                    <li key={f.label} className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#41005c' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={f.d} /></svg>
                      <span>{f.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* APERÇU INTERFACE (mockup CSS)               */}
        {/* ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: '#faf8fc' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Votre tableau de bord,{' '}
                <span style={{ color: '#41005c' }}>simple et puissant</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
                Tout ce dont vous avez besoin pour gérer votre activité au quotidien, en un coup d'oeil.
              </p>
            </div>

            {/* Mockup navigateur */}
            <div className="relative mx-auto max-w-4xl">
              <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                {/* Barre navigateur */}
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs">
                      neurocare.fr/dashboard/educator
                    </div>
                  </div>
                </div>

                {/* Contenu dashboard mockup */}
                <div className="bg-white p-4 sm:p-6">
                  {/* Header mockup */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="h-5 w-48 bg-gray-800 rounded mb-1.5" />
                      <div className="h-3 w-32 bg-gray-300 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg className="w-4 h-4" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'RDV cette semaine', value: '8', color: '#41005c', bg: '#f3e8ff' },
                      { label: 'Nouveaux messages', value: '3', color: '#f0879f', bg: '#fce7f3' },
                      { label: 'Revenus du mois', value: '1 240 €', color: '#059669', bg: '#ecfdf5' },
                      { label: 'Avis reçus', value: '4.9/5', color: '#d97706', bg: '#fef3c7' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg p-3 border border-gray-100" style={{ backgroundColor: stat.bg }}>
                        <p className="text-lg sm:text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* RDV liste */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm font-bold text-gray-700 mb-3">Prochains rendez-vous</p>
                    <div className="space-y-2">
                      {[
                        { time: '10:00', name: 'Famille Martin', type: 'Séance ABA', status: 'Confirmé', statusColor: '#059669' },
                        { time: '14:00', name: 'Famille Dupont', type: 'Bilan initial', status: 'En attente', statusColor: '#d97706' },
                        { time: '16:30', name: 'Famille Bernard', type: 'Suivi PPA', status: 'Confirmé', statusColor: '#059669' },
                      ].map((rdv) => (
                        <div key={rdv.time} className="flex items-center gap-3 bg-white rounded-md p-2.5 border border-gray-100">
                          <span className="text-xs font-mono font-bold text-gray-500 w-10">{rdv.time}</span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#41005c' }}>
                            {rdv.name.split(' ')[1]?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{rdv.name}</p>
                            <p className="text-xs text-gray-400">{rdv.type}</p>
                          </div>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: rdv.statusColor, backgroundColor: `${rdv.statusColor}15` }}>
                            {rdv.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ombre décorative */}
              <div className="absolute inset-x-8 -bottom-4 h-8 bg-purple-200/30 blur-xl rounded-full" />
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
              {[
                { num: '1', title: 'Créez votre profil', desc: 'Renseignez vos spécialités TND, tarifs et disponibilités. C\'est gratuit et prend 5 minutes.', gradient: 'linear-gradient(135deg, #41005c, #6b21a8)' },
                { num: '2', title: 'Recevez des demandes', desc: 'Les familles de votre ville vous trouvent et réservent directement. Paiement sécurisé inclus.', gradient: 'linear-gradient(135deg, #f0879f, #ec4899)' },
                { num: '3', title: 'Accompagnez sereinement', desc: 'Gérez vos RDV, suivez vos bénéficiaires et recevez vos paiements automatiquement.', gradient: 'linear-gradient(135deg, #41005c, #6b21a8)' },
              ].map((step) => (
                <div key={step.num} className="text-center">
                  <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-5 shadow-lg" style={{ background: step.gradient }}>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">{step.num}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

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
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
                Agenda, paiements, messagerie, suivi patient — tout est intégré pour que vous puissiez vous concentrer sur l'essentiel.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[
                { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Agenda intelligent', desc: 'Gérez vos disponibilités et recevez des réservations automatiques.' },
                { icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', title: 'Paiement sécurisé', desc: 'Encaissement automatique à la réservation. 88% reversés directement sur votre compte.' },
                { icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', title: 'Téléconsultation', desc: 'Visio intégrée pour vos séances à distance. Rien à installer.' },
                { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Dossier & PPA', desc: 'Projet personnalisé d\'accompagnement, objectifs et suivi centralisés pour chaque bénéficiaire.' },
                { icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Facturation auto', desc: 'Factures générées automatiquement après chaque séance. Compatible URSSAF et CESU.' },
                { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', title: 'Réseau pro TND', desc: 'Connectez-vous avec d\'autres spécialistes pour un suivi pluridisciplinaire cohérent.' },
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-xl p-5 sm:p-6 border border-gray-100">
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
        {/* AVANT / APRÈS                               */}
        {/* ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Avant vs{' '}
                <span style={{ color: '#41005c' }}>avec NeuroCare</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500">
                Ce qui change concrètement dans votre quotidien.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Avant */}
              <div className="rounded-2xl border-2 border-red-100 bg-red-50/50 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-red-700">Sans NeuroCare</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    'Vous prospectez seul sur les réseaux sociaux',
                    'Les familles annulent sans prévenir (no-show)',
                    'Relances de paiements manuelles et impayés',
                    'Pas de dossier de suivi structuré',
                    'Facturation manuelle chronophage',
                    'Aucune visibilité en ligne pour les familles',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-red-700/80">
                      <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Avec NeuroCare */}
              <div className="rounded-2xl border-2 p-6 sm:p-8" style={{ borderColor: '#e9d5ff', backgroundColor: 'rgba(65, 0, 92, 0.03)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
                    <svg className="w-5 h-5" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: '#41005c' }}>Avec NeuroCare</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    'Les familles vous trouvent et réservent en ligne',
                    'Paiement à la réservation = zéro no-show',
                    '88% reversés automatiquement sur votre compte',
                    'Dossier PPA structuré et partagé avec les parents',
                    'Factures générées automatiquement (URSSAF, CESU)',
                    'Profil professionnel visible par toutes les familles TND',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(65, 0, 92, 0.8)' }}>
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* RÉASSURANCE (inspiré Doctolib)              */}
        {/* ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Lancez-vous en{' '}
                <span style={{ color: '#41005c' }}>toute sérénité</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
                On a anticipé toutes vos questions. Voici pourquoi vous ne prenez aucun risque.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Gratuit */}
              <div className="text-center p-6 rounded-2xl border border-gray-100">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f0fdf4' }}>
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">100% gratuit</h3>
                <p className="text-sm text-gray-500">Inscription, profil et fonctionnalités sans aucun frais. Commission uniquement sur les séances réalisées.</p>
              </div>

              {/* Sans engagement */}
              <div className="text-center p-6 rounded-2xl border border-gray-100">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#faf5ff' }}>
                  <svg className="w-7 h-7" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Sans engagement</h3>
                <p className="text-sm text-gray-500">Suspendez ou supprimez votre profil à tout moment. Pas de contrat, pas de durée minimale.</p>
              </div>

              {/* Paiements sécurisés */}
              <div className="text-center p-6 rounded-2xl border border-gray-100">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#fef3c7' }}>
                  <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Paiements sécurisés</h3>
                <p className="text-sm text-gray-500">Stripe, leader mondial du paiement. Vos revenus versés automatiquement sur votre compte bancaire.</p>
              </div>

              {/* RGPD */}
              <div className="text-center p-6 rounded-2xl border border-gray-100">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#eff6ff' }}>
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Conforme RGPD</h3>
                <p className="text-sm text-gray-500">Données hébergées en Europe. Protection des données personnelles et de santé garantie.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* SPÉCIALITÉS ACCEPTÉES                      */}
        {/* ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#faf8fc' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Pensé pour{' '}
              <span style={{ color: '#41005c' }}>votre spécialité</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-500 mb-10 sm:mb-12">
              NeuroCare accueille tous les professionnels de l'accompagnement neurodéveloppemental.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {[
                'Éducateur spécialisé',
                'Moniteur éducateur',
                'Psychologue',
                'Psychomotricien',
                'Ergothérapeute',
                'Orthophoniste',
                'Kinésithérapeute',
                'Enseignant APA',
                'Musicothérapeute',
              ].map((specialty) => (
                <span
                  key={specialty}
                  className="px-4 py-2 rounded-full text-sm font-medium border-2"
                  style={{ borderColor: '#41005c', color: '#41005c', backgroundColor: 'rgba(65, 0, 92, 0.05)' }}
                >
                  {specialty}
                </span>
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
              Prêt à développer votre activité ?
            </h2>
            <p className="text-base sm:text-lg text-white/80 mb-8 sm:mb-10 max-w-xl mx-auto">
              Rejoignez les professionnels qui accompagnent des familles TND avec NeuroCare.
              Créez votre profil en 5 minutes, c'est gratuit et sans engagement.
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
              <span>Profil prêt en 5 min</span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════ */}
        {/* FAQ                                        */}
        {/* ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
              Questions fréquentes
            </h2>
            <p className="text-center text-base text-gray-500 mb-10 sm:mb-12">
              Tout ce que vous devez savoir avant de rejoindre NeuroCare.
            </p>

            <div className="space-y-4">
              {[
                { q: 'Combien ça coûte ?', a: 'L\'inscription est 100% gratuite. NeuroCare prélève uniquement une commission sur les séances réalisées via la plateforme. Aucun frais caché, aucun engagement.' },
                { q: 'Quand suis-je payé ?', a: 'Les paiements sont automatiques via Stripe. Vous êtes crédité sur votre compte bancaire dans un délai de 2 à 5 jours après chaque séance, sans avoir à relancer les familles.' },
                { q: 'Puis-je gérer mon agenda librement ?', a: 'Oui. Vous définissez vos créneaux, vos tarifs, vos jours d\'indisponibilité. Vous pouvez bloquer ou modifier vos disponibilités à tout moment depuis votre tableau de bord.' },
                { q: 'Comment communiquer avec les familles ?', a: 'Une messagerie sécurisée intégrée vous permet d\'échanger avec les familles sans partager votre numéro personnel. Tous les échanges sont centralisés dans votre espace pro.' },
                { q: 'Quels documents sont vérifiés ?', a: 'Avant la mise en ligne de votre profil, nous vérifions votre numéro RPPS/ADELI, vos diplômes et certifications. Cette vérification garantit la confiance des familles.' },
                { q: 'Puis-je mettre en pause mon profil ?', a: 'Oui, à tout moment. Vous pouvez désactiver votre profil temporairement (vacances, congé maladie) ou définitivement, sans pénalité.' },
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
