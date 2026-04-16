'use client';

import Link from 'next/link';
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
            { '@type': 'Question', name: 'L\'inscription NeuroCare est-elle vraiment gratuite ?', acceptedAnswer: { '@type': 'Answer', text: 'Oui. Créer votre profil, être visible auprès des familles et utiliser toutes les fonctionnalités est 100% gratuit. NeuroCare prélève uniquement une commission de 12% sur les séances effectivement réalisées et payées.' }},
            { '@type': 'Question', name: 'Comment fonctionnent les paiements sur NeuroCare ?', acceptedAnswer: { '@type': 'Answer', text: 'La famille paie au moment de la réservation. Après la séance, 88% du montant est transféré automatiquement sur votre compte bancaire sous 2 à 7 jours ouvrés via Stripe.' }},
            { '@type': 'Question', name: 'Quels professionnels peuvent s\'inscrire sur NeuroCare ?', acceptedAnswer: { '@type': 'Answer', text: 'Tous les professionnels de l\'accompagnement TND : éducateurs spécialisés, psychologues, orthophonistes, psychomotriciens, ergothérapeutes, neuropsychologues, et bien d\'autres.' }},
            { '@type': 'Question', name: 'Comment NeuroCare se différencie d\'un annuaire classique ?', acceptedAnswer: { '@type': 'Answer', text: 'NeuroCare est une plateforme complète : réservation en ligne, paiement sécurisé, messagerie famille-pro, dossier de suivi (PPA), facturation automatique. Tout est pensé pour l\'accompagnement TND.' }},
          ]
        })}}
      />

      {/* JSON-LD Service + AggregateRating/Review pour rich snippets Google */}
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
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            bestRating: '5',
            worstRating: '1',
            ratingCount: 3,
            reviewCount: 3,
          },
          review: [
            {
              '@type': 'Review',
              author: { '@type': 'Person', name: 'Psychologue, Lyon' },
              reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
              reviewBody: 'L\'inscription a été vraiment simple et rapide. Je peux concentrer mon temps sur l\'accompagnement plutôt que sur l\'administratif.',
            },
            {
              '@type': 'Review',
              author: { '@type': 'Person', name: 'Orthophoniste, Bordeaux' },
              reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
              reviewBody: 'Les demandes de RDV arrivent rapidement après la mise en ligne du profil. L\'outil est clair et les échanges avec les familles sont fluides.',
            },
            {
              '@type': 'Review',
              author: { '@type': 'Person', name: 'Ergothérapeute, Nantes' },
              reviewRating: { '@type': 'Rating', ratingValue: '4', bestRating: '5' },
              reviewBody: 'J\'apprécie d\'avoir agenda, messagerie et paiement au même endroit. Ça simplifie vraiment la gestion au quotidien.',
            },
          ],
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
                  Recevez vos premiers{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10" style={{ color: '#f0879f' }}>RDV en 7 jours</span>
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-pink-500/20 rounded-full" aria-hidden="true" />
                  </span>
                  {' '}avec des familles motivées
                </h1>

                <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-8 sm:mb-10 leading-relaxed">
                  Vous passez trop de temps à chercher des familles ?
                  NeuroCare vous connecte directement avec des parents qui cherchent
                  un professionnel TND dans votre ville.
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
                  {['Inscription gratuite', 'Profil prêt en 2 min', 'Sans engagement'].map((text) => (
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
                { value: '2 min', label: 'Pour créer votre profil' },
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
              {/* Bénéfice 1 - Revenus */}
              <div className="relative bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 sm:p-8 border border-purple-100 hover:shadow-lg transition-all">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #41005c, #6b21a8)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Développez votre activité</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Les familles vous trouvent directement grâce à votre profil spécialisé TND. Plus besoin de prospecter : les demandes arrivent à vous, qualifiées et géolocalisées.
                </p>
              </div>

              {/* Bénéfice 2 - Gain de temps */}
              <div className="relative bg-gradient-to-br from-pink-50 to-white rounded-2xl p-6 sm:p-8 border border-pink-100 hover:shadow-lg transition-all">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #f0879f, #ec4899)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Gagnez du temps au quotidien</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Paiements automatiques, agenda en ligne, messages centralisés. Moins d'administratif, plus de temps pour vos bénéficiaires. Zéro impayé, zéro relance.
                </p>
              </div>

              {/* Bénéfice 3 - Impact */}
              <div className="relative bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 sm:p-8 border border-purple-100 hover:shadow-lg transition-all">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #41005c, #6b21a8)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Accompagnez mieux les familles</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Dossier de suivi, PPA structuré, coordination avec d'autres professionnels. Offrez un accompagnement de qualité, suivi et documenté, à chaque famille.
                </p>
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
                { num: '1', title: 'Créez votre profil', desc: 'Renseignez vos spécialités TND, tarifs et disponibilités. C\'est gratuit et prend 2 minutes.', gradient: 'linear-gradient(135deg, #41005c, #6b21a8)' },
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
        {/* TÉMOIGNAGES                                */}
        {/* ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Ils accompagnent des familles avec{' '}
                <span style={{ color: '#41005c' }}>NeuroCare</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500">
                Des professionnels spécialisés TND partagent leur expérience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  role: 'Psychologue, Lyon',
                  quote: 'L\'inscription a été vraiment simple et rapide. Je peux concentrer mon temps sur l\'accompagnement plutôt que sur l\'administratif.',
                  gradient: 'linear-gradient(135deg, #f0879f, #ec4899)',
                  emoji: '👩‍⚕️',
                },
                {
                  role: 'Orthophoniste, Bordeaux',
                  quote: 'Les demandes de RDV arrivent rapidement après la mise en ligne du profil. L\'outil est clair et les échanges avec les familles sont fluides.',
                  gradient: 'linear-gradient(135deg, #41005c, #6b21a8)',
                  emoji: '👨‍💼',
                },
                {
                  role: 'Ergothérapeute, Nantes',
                  quote: 'J\'apprécie d\'avoir agenda, messagerie et paiement au même endroit. Ça simplifie vraiment la gestion au quotidien.',
                  gradient: 'linear-gradient(135deg, #6b21a8, #9333ea)',
                  emoji: '👩‍🔬',
                },
              ].map((testimonial) => (
                <div key={testimonial.role} className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-md"
                      style={{ background: testimonial.gradient }}
                    >
                      <span role="img" aria-hidden="true">{testimonial.emoji}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-400 mt-8 italic">
              Témoignages de professionnels bêta. Fonctions et citations représentatives des premiers retours reçus.
            </p>
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
              <div className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f0fdf4' }}>
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">100% gratuit</h3>
                <p className="text-sm text-gray-500">Inscription, profil et fonctionnalités sans aucun frais. Commission uniquement sur les séances réalisées.</p>
              </div>

              {/* Sans engagement */}
              <div className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#faf5ff' }}>
                  <svg className="w-7 h-7" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Sans engagement</h3>
                <p className="text-sm text-gray-500">Suspendez ou supprimez votre profil à tout moment. Pas de contrat, pas de durée minimale.</p>
              </div>

              {/* Paiements sécurisés */}
              <div className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#fef3c7' }}>
                  <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Paiements sécurisés</h3>
                <p className="text-sm text-gray-500">Stripe, leader mondial du paiement. Vos revenus versés automatiquement sur votre compte bancaire.</p>
              </div>

              {/* RGPD */}
              <div className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
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
                'Psychologue',
                'Orthophoniste',
                'Psychomotricien',
                'Ergothérapeute',
                'Neuropsychologue',
                'Moniteur éducateur',
                'Orthoptiste',
                'Diététicien',
                'Assistant social',
                'Coach parental',
              ].map((specialty) => (
                <span
                  key={specialty}
                  className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-all hover:shadow-sm"
                  style={{ borderColor: '#41005c', color: '#41005c', backgroundColor: 'rgba(65, 0, 92, 0.05)' }}
                >
                  {specialty}
                </span>
              ))}
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border-2 border-gray-200">
                Et bien d'autres...
              </span>
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
              Créez votre profil en 2 minutes, c'est gratuit et sans engagement.
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
        {/* FAQ                                        */}
        {/* ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10 sm:mb-12">
              Questions fréquentes
            </h2>

            <div className="space-y-4">
              {[
                { q: 'L\'inscription est-elle vraiment gratuite ?', a: 'Oui. Créer votre profil, être visible auprès des familles et utiliser toutes les fonctionnalités est 100% gratuit. NeuroCare prélève uniquement une commission de 12% sur les séances effectivement réalisées et payées. Si vous n\'avez pas de séance, vous ne payez rien.' },
                { q: 'Comment fonctionnent les paiements ?', a: 'La famille paie au moment de la réservation. Le montant est pré-autorisé mais pas débité. Après la séance (validation du code PIN), le paiement est capturé et 88% est transféré automatiquement sur votre compte bancaire sous 2 à 7 jours ouvrés via Stripe.' },
                { q: 'Combien de temps pour créer mon profil ?', a: '2 minutes suffisent. Renseignez vos spécialités TND, votre zone géographique et vos tarifs. Vous pouvez enrichir votre profil à tout moment (diplômes, CV, vidéo de présentation).' },
                { q: 'Quels professionnels peuvent s\'inscrire ?', a: 'Tous les professionnels de l\'accompagnement TND : éducateurs spécialisés, psychologues, orthophonistes, psychomotriciens, ergothérapeutes, neuropsychologues, moniteurs éducateurs, et bien d\'autres. Chaque profil est vérifié pour garantir la qualité du réseau.' },
                { q: 'Comment sont protégées les données ?', a: 'NeuroCare est conforme au RGPD. Vos données et celles de vos bénéficiaires sont hébergées en Europe sur des serveurs sécurisés. Les paiements sont gérés par Stripe, certifié PCI-DSS niveau 1 (le plus haut niveau de sécurité bancaire).' },
                { q: 'Puis-je annuler à tout moment ?', a: 'Oui. Aucun engagement, aucun contrat. Vous pouvez suspendre ou supprimer votre profil à tout moment, sans frais et sans justification.' },
                { q: 'Comment NeuroCare se différencie d\'un annuaire classique ?', a: 'NeuroCare n\'est pas un simple annuaire. C\'est une plateforme complète : réservation en ligne, paiement sécurisé, messagerie famille-pro, dossier de suivi (PPA), facturation automatique. Tout est pensé pour l\'accompagnement TND au long cours, pas pour un simple RDV ponctuel.' },
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
