'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
export default function AidesFinancieresPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar />

      {/* ─── HERO ─── */}
      <section className="pt-16 sm:pt-20 pb-8 sm:pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Image (au-dessus en mobile) */}
            <div className="relative order-first lg:order-last">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/images/therapeute-enfant-autiste-salle-de-therapie-860x573.jpg"
                  alt="Professionnelle accompagnant un enfant en séance"
                  className="w-full h-auto max-h-[260px] sm:max-h-[360px] lg:max-h-[440px] object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,126,126,0.15), rgba(240,135,159,0.05))' }} />
              </div>
              {/* Badge flottant "vous n'êtes pas seul·e" */}
              <div className="hidden sm:flex absolute -bottom-5 -left-5 bg-white rounded-xl shadow-xl p-3.5 items-center gap-3 border border-gray-50 max-w-[260px]">
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#fde8ec' }}>
                  <svg className="w-5 h-5" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>Vous n'êtes pas seul·e</p>
                  <p className="text-[11px] text-gray-500" style={{ fontFamily: 'Open Sans, sans-serif' }}>On démêle les aides avec vous</p>
                </div>
              </div>
            </div>

            {/* Texte */}
            <div>
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#027e7e', fontFamily: 'Open Sans, sans-serif' }}>
                Aides financières
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.4rem] font-bold text-gray-900 leading-tight mb-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
                Financez l'accompagnement TND de votre{' '}
                <span style={{ color: '#027e7e' }}>enfant ou adulte</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-5" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Forfait Précoce, AEEH, PCH, CESU, crédit d'impôt... Plusieurs dispositifs existent
                pour réduire, voire supprimer, le coût de l'accompagnement. Nous vous aidons à y voir clair.
              </p>
              <div className="mb-4">
                <Link
                  href="/familles/simulateur-aides"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white rounded-md text-xs sm:text-sm font-semibold transition-all hover:opacity-90 group"
                  style={{ backgroundColor: '#f0879f', fontFamily: 'Open Sans, sans-serif' }}
                >
                  Calculer mes aides en 2 min
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#e6fffa', color: '#027e7e' }}>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Info claire
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#fde8ec', color: '#be2452' }}>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Sans jargon
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Mis à jour 2026
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SIMULATEUR CTA (mise en avant) ─── */}
      <section className="px-4 pb-10 sm:pb-14">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: '#f0879f' }}>
            <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-center p-6 sm:p-8 lg:p-10">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
                  <span className="text-[11px] font-bold text-white tracking-wider uppercase" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Outil gratuit · 2 minutes
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  Quelles aides pour votre situation ?
                </h2>
                <p className="text-sm sm:text-base text-white/90 mb-5 max-w-xl leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Forfait Précoce, AEEH, PCH, CESU, crédit d'impôt… Répondez à <strong className="font-bold">6 questions</strong> et obtenez une estimation personnalisée des aides auxquelles vous pouvez prétendre.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <Link
                    href="/familles/simulateur-aides"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
                    style={{ color: '#be2452', fontFamily: 'Verdana, sans-serif' }}
                  >
                    Démarrer le simulateur
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <div className="flex items-center gap-1.5 text-xs text-white/80" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Sans inscription · 100 % anonyme
                  </div>
                </div>
              </div>

              {/* Visuel illustratif calculator */}
              <div className="hidden md:flex flex-col items-center">
                <div className="relative w-40 h-40 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                  <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="absolute -top-3 -right-3 bg-white rounded-full px-3 py-1 shadow-lg">
                    <span className="text-xs font-bold" style={{ color: '#be2452', fontFamily: 'Verdana, sans-serif' }}>jusqu'à 1 500 €/an</span>
                  </div>
                </div>
                <p className="text-xs text-white/80 text-center mt-3 max-w-[180px]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Plus de 5 dispositifs analysés
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BANDEAU REÇUS ─── */}
      <section className="px-4 pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-3 p-4 rounded-xl border-2" style={{ borderColor: '#027e7e', backgroundColor: '#f0fafa' }}>
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#027e7e' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-0.5" style={{ fontFamily: 'Verdana, sans-serif' }}>
                Vos reçus NeuroCare sont compatibles avec toutes ces aides
              </p>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Nos attestations incluent toutes les mentions légales requises (SIRET, heures, nature du service, agrément SAP le cas échéant).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AIDES PAR PROFIL ─── */}
      <section className="py-10 sm:py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#027e7e', fontFamily: 'Open Sans, sans-serif' }}>
              Selon votre situation
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Les aides disponibles
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* ── ENFANTS ── */}
            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#027e7e' }}>
              <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: '#027e7e' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Verdana, sans-serif' }}>Enfants (0-20 ans)</h3>
              </div>
              <div className="p-5 space-y-4" style={{ backgroundColor: 'rgba(2, 126, 126, 0.03)' }}>
                {/* Forfait Précoce */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#027e7e' }}>0-12 ans</span>
                    <h4 className="text-sm font-bold text-gray-900">Forfait Intervention Précoce</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Prise en charge par l'Assurance Maladie des bilans et séances de psychologue,
                    ergothérapeute et psychomotricien.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Psychologue : 120-300€</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Ergo/Psychomot : 1 500€/an</span>
                  </div>
                </div>

                <div className="border-t border-gray-200" />

                {/* AEEH */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#f0879f' }}>0-20 ans</span>
                    <h4 className="text-sm font-bold text-gray-900">AEEH (CAF/MDPH)</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Allocation mensuelle pour compenser les frais d'éducation et de soins.
                    Finance <strong>tous les professionnels</strong> (psy, ergo, éducateur...).
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Base : 142,70€/mois</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">+ compléments jusqu'à cat. 6</span>
                  </div>
                </div>

                <div className="border-t border-gray-200" />

                {/* PCH enfant */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">PCH (MDPH)</h4>
                  <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Aide humaine, aides techniques, aménagement du logement et du véhicule.
                  </p>
                </div>

                <div className="border-t border-gray-200" />

                {/* CESU enfant */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">CESU + Crédit d'impôt 50%</h4>
                  <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Pour les éducateurs à domicile avec agrément SAP.
                    Récupérez 50% de vos dépenses via le crédit d'impôt.
                  </p>
                </div>
              </div>
            </div>

            {/* ── ADULTES ── */}
            <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#f0879f' }}>
              <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: '#f0879f' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Verdana, sans-serif' }}>Adultes (18+ ans)</h3>
              </div>
              <div className="p-5 space-y-4" style={{ backgroundColor: 'rgba(240, 135, 159, 0.03)' }}>
                {/* AAH */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#f0879f' }}>20+ ans</span>
                    <h4 className="text-sm font-bold text-gray-900">AAH (MDPH)</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Revenu minimum garanti pour les adultes en situation de handicap.
                    Utilisable librement, y compris pour financer un accompagnement.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Jusqu'à 1 016€/mois</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Taux incapacité ≥ 50%</span>
                  </div>
                </div>

                <div className="border-t border-gray-200" />

                {/* PCH adulte */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">PCH (MDPH)</h4>
                  <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Aide humaine et aides techniques. Finance l'accompagnement
                    éducatif au quotidien.
                  </p>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-amber-800" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                      <strong>Attention :</strong> la PCH ne finance pas les professionnels libéraux (psy, ergo...) pour les adultes.
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200" />

                {/* CESU adulte */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">CESU + Crédit d'impôt 50%</h4>
                  <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Pour les éducateurs à domicile avec agrément SAP.
                    Récupérez 50% via le crédit d'impôt (jusqu'à 6 000€/an).
                  </p>
                </div>

                <div className="border-t border-gray-200" />

                {/* Mutuelle */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Mutuelle / Complémentaire</h4>
                  <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Certaines mutuelles proposent des forfaits spécifiques pour les TND.
                    Vérifiez votre contrat ou contactez votre mutuelle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMMENT CA MARCHE ─── */}
      <section className="py-10 sm:py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#027e7e', fontFamily: 'Open Sans, sans-serif' }}>
              En pratique
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Comment utiliser vos aides avec NeuroCare ?
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold" style={{ backgroundColor: '#027e7e' }}>
                1
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Obtenez vos droits</h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Constituez votre dossier MDPH, ou demandez le Forfait Précoce via votre médecin.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold" style={{ backgroundColor: '#3a9e9e' }}>
                2
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Réservez sur NeuroCare</h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Trouvez un professionnel et prenez rendez-vous. La plateforme est 100% gratuite.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold" style={{ backgroundColor: '#6bbebe' }}>
                3
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Demandez le remboursement</h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Téléchargez vos reçus depuis votre espace et transmettez-les à l'organisme concerné.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DÉTAIL DES AIDES (Accordéon) ─── */}
      <section className="py-10 sm:py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#f0879f', fontFamily: 'Open Sans, sans-serif' }}>
              En détail
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Tout savoir sur chaque aide
            </h2>
          </div>

          <div className="space-y-3">
            {/* Forfait Précoce */}
            <AideAccordion
              title="Forfait Intervention Précoce"
              subtitle="Assurance Maladie - Enfants 0-12 ans"
              color="#027e7e"
              isOpen={openFaq === 0}
              onToggle={() => setOpenFaq(openFaq === 0 ? null : 0)}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Depuis 2024, l'Assurance Maladie prend en charge les bilans et séances de
                  <strong> psychologues, ergothérapeutes et psychomotriciens</strong> pour les enfants
                  de moins de 12 ans présentant des signes de TND.
                </p>

                <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(2, 126, 126, 0.05)', borderLeft: '3px solid #027e7e' }}>
                  <p style={{ color: '#027e7e' }} className="font-medium">
                    Ce forfait concerne les professionnels habituellement non remboursés.
                    Les orthophonistes et kinés sont déjà pris en charge normalement.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Montants pris en charge</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span><strong>Psychologue :</strong> 120€ (éval. simple) ou 300€ (avec tests neuropsy)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span><strong>Ergo / Psychomot :</strong> 1 500€ pour évaluation + 35 séances</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span><strong>Durée :</strong> 12 mois, renouvelable 6 mois</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Démarches</h4>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                    <li>Consultez votre médecin traitant ou pédiatre</li>
                    <li>Il vous oriente vers une Plateforme de Coordination (PCO-TND)</li>
                    <li>La PCO prescrit les bilans et séances nécessaires</li>
                  </ol>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-amber-800"><strong>Non cumulable avec l'AEEH.</strong> Quand vous percevez l'AEEH, le forfait s'arrête.</p>
                </div>

                <a
                  href="https://handicap.gouv.fr/les-plateformes-de-coordination-et-dorientation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                  style={{ color: '#027e7e' }}
                >
                  Trouver une PCO-TND près de chez vous
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </AideAccordion>

            {/* AEEH */}
            <AideAccordion
              title="AEEH - Allocation d'Éducation de l'Enfant Handicapé"
              subtitle="CAF / MDPH - Enfants 0-20 ans"
              color="#f0879f"
              isOpen={openFaq === 1}
              onToggle={() => setOpenFaq(openFaq === 1 ? null : 1)}
            >
              <div className="space-y-3">
                <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(240, 135, 159, 0.05)', borderLeft: '3px solid #f0879f' }}>
                  <p style={{ color: '#c4607a' }} className="font-medium">
                    L'aide la plus complète pour les enfants TND. Elle finance <strong>tous les professionnels</strong> : psychologue, ergothérapeute, psychomotricien, éducateur...
                  </p>
                </div>

                <p className="text-sm text-gray-700">
                  Allocation mensuelle versée par la CAF pour compenser les frais d'éducation et de soins
                  d'un enfant en situation de handicap. Peut être complétée par un complément selon le niveau de handicap.
                </p>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Montants (2025)</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f0879f' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span><strong>Base :</strong> 142,70€/mois</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f0879f' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span><strong>Complément 1 :</strong> +105,79€/mois</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f0879f' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span><strong>Complément 2 :</strong> +286,94€/mois</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f0879f' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span><strong>Complément 3 :</strong> +405,16€/mois (jusqu'à cat. 6)</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Conditions</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>- Enfant de moins de 20 ans</li>
                    <li>- Taux d'incapacité ≥ 80% (ou 50-79% avec suivi en établissement)</li>
                    <li>- Pas de condition de ressources pour l'AEEH de base</li>
                  </ul>
                </div>

                <a
                  href="https://www.caf.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                  style={{ color: '#f0879f' }}
                >
                  Site officiel de la CAF
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </AideAccordion>

            {/* PCH */}
            <AideAccordion
              title="PCH - Prestation de Compensation du Handicap"
              subtitle="MDPH - Enfants et adultes"
              color="#6bbebe"
              isOpen={openFaq === 2}
              onToggle={() => setOpenFaq(openFaq === 2 ? null : 2)}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Aide financière versée par le département pour compenser les besoins liés au handicap.
                  Depuis janvier 2023, les personnes avec TND y accèdent plus facilement.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border" style={{ borderColor: '#027e7e', backgroundColor: 'rgba(2, 126, 126, 0.03)' }}>
                    <h4 className="text-xs font-bold mb-1.5" style={{ color: '#027e7e' }}>Pris en charge</h4>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>- Aide humaine (aidant ou professionnel)</li>
                      <li>- Aides techniques (logiciels, équipements)</li>
                      <li>- Aménagement du logement</li>
                      <li>- Surcoûts de transport</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <h4 className="text-xs font-bold text-red-800 mb-1.5">Non pris en charge (adultes)</h4>
                    <ul className="text-xs text-red-700 space-y-1">
                      <li>- Séances de psychologue</li>
                      <li>- Séances d'ergothérapeute</li>
                      <li>- Séances de psychomotricien</li>
                    </ul>
                  </div>
                </div>

                <a
                  href="https://www.mdphenligne.cnsa.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                  style={{ color: '#6bbebe' }}
                >
                  Trouver votre MDPH
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </AideAccordion>

            {/* AAH */}
            <AideAccordion
              title="AAH - Allocation aux Adultes Handicapés"
              subtitle="MDPH - Adultes 20+ ans"
              color="#f4a3b3"
              isOpen={openFaq === 3}
              onToggle={() => setOpenFaq(openFaq === 3 ? null : 3)}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Revenu minimum garanti pour les adultes en situation de handicap.
                  L'AAH est un revenu de remplacement que vous pouvez utiliser librement,
                  y compris pour financer un accompagnement TND.
                </p>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Montant (2025)</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f4a3b3' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span>Jusqu'à <strong>1 016,05€/mois</strong> (taux plein)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f4a3b3' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span>Cumul possible avec revenus d'activité partielle</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f4a3b3' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span>Attribuée pour 1 à 10 ans (renouvelable)</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(2, 126, 126, 0.05)', borderLeft: '3px solid #027e7e' }}>
                  <h4 className="font-semibold mb-1" style={{ color: '#027e7e' }}>Conseil pour les adultes TDAH/TSA</h4>
                  <p className="text-xs" style={{ color: '#027e7e' }}>
                    Le diagnostic seul ne suffit pas. Faites rédiger des attestations décrivant l'impact
                    fonctionnel concret de votre TND sur votre vie quotidienne et professionnelle.
                  </p>
                </div>

                <a
                  href="https://www.mdphenligne.cnsa.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                  style={{ color: '#f4a3b3' }}
                >
                  Faire ma demande MDPH en ligne
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </AideAccordion>

            {/* Crédit d'impôt */}
            <AideAccordion
              title="Crédit d'Impôt 50% (CESU)"
              subtitle="Services à la Personne - Tous âges"
              color="#3a9e9e"
              isOpen={openFaq === 4}
              onToggle={() => setOpenFaq(openFaq === 4 ? null : 4)}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Si l'éducateur dispose d'un agrément Services à la Personne (SAP), vous bénéficiez
                  d'un crédit d'impôt de 50% des sommes versées pour l'accompagnement éducatif.
                </p>

                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-900 mb-1">Exemple concret</h4>
                  <p className="text-xs text-gray-700">
                    Vous payez 240€/mois, soit 2 880€/an.
                  </p>
                  <p className="text-sm font-bold mt-1" style={{ color: '#027e7e' }}>
                    Crédit d'impôt : 1 440€ (remboursé même si non imposable)
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Plafonds annuels</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>- Plafond général : 12 000€ de dépenses (6 000€ de crédit)</li>
                    <li>- Majoré à 15 000€ pour le 1er enfant à charge</li>
                    <li>- +1 500€ par enfant supplémentaire</li>
                  </ul>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-amber-800"><strong>L'éducateur doit avoir un numéro d'agrément SAP valide.</strong> Vérifiez cette information sur son profil NeuroCare.</p>
                </div>

                <a
                  href="https://www.servicesalapersonne.gouv.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                  style={{ color: '#3a9e9e' }}
                >
                  Site officiel Services à la Personne
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </AideAccordion>

            {/* Mutuelles */}
            <AideAccordion
              title="Mutuelles & Complémentaires Santé"
              subtitle="Selon votre contrat"
              color="#9bd4d4"
              isOpen={openFaq === 5}
              onToggle={() => setOpenFaq(openFaq === 5 ? null : 5)}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Certaines mutuelles proposent des forfaits spécifiques pour l'accompagnement des TND.
                  Les prises en charge varient selon votre contrat.
                </p>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Exemples de mutuelles</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>- <strong>Harmonie Mutuelle :</strong> Jusqu'à 500€/an</li>
                    <li>- <strong>MGEN :</strong> Forfait handicap variable</li>
                    <li>- <strong>Malakoff Humanis :</strong> Accompagnement et médecines douces</li>
                    <li>- <strong>AG2R La Mondiale :</strong> Forfait prévention santé</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Comment en bénéficier ?</h4>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                    <li>Vérifiez vos garanties (forfait handicap / médecines douces)</li>
                    <li>Téléchargez vos reçus NeuroCare</li>
                    <li>Envoyez-les avec le formulaire de remboursement</li>
                  </ol>
                </div>
              </div>
            </AideAccordion>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-10 sm:py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl p-6 sm:p-8 text-center text-white" style={{ backgroundColor: '#027e7e' }}>
            <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Besoin d'aide pour vos démarches ?
            </h2>
            <p className="text-teal-100 text-sm mb-5" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Utilisez notre simulateur pour identifier rapidement les aides auxquelles vous avez droit,
              ou contactez-nous pour un accompagnement personnalisé.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/familles/simulateur-aides"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ color: '#027e7e' }}
              >
                Lancer le simulateur
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-5 py-2.5 border-2 border-white rounded-lg text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Nous contacter
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

/* ─── COMPOSANT ACCORDÉON ─── */
function AideAccordion({
  title,
  subtitle,
  color,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
              {title}
            </h3>
            <p className="text-xs text-gray-500" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {subtitle}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          {children}
        </div>
      )}
    </div>
  );
}
