'use client';

import Link from 'next/link';
import { useState } from 'react';
import ProNavbar from '@/components/ProNavbar';

export default function ProSAPAccreditationPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "Combien coûte l'agrément SAP ?",
      answer: "L'agrément SAP est totalement gratuit. La déclaration et l'agrément ne coûtent rien. Seule une assurance RC professionnelle est obligatoire (environ 200-400€/an)."
    },
    {
      question: "Combien de temps pour l'obtenir ?",
      answer: "La déclaration simple est validée en 48-72h. L'agrément qualité prend 1 à 3 mois maximum pour instruction par la DREETS."
    },
    {
      question: "Puis-je perdre mon agrément ?",
      answer: "L'agrément est valable 5 ans et renouvelable. Vous pouvez le perdre en cas de non-respect des obligations (déclaration annuelle, critères qualité) ou de plaintes graves."
    },
    {
      question: "Est-ce obligatoire pour exercer ?",
      answer: "Non, l'agrément SAP n'est pas obligatoire pour exercer comme éducateur. Mais il permet d'accéder aux financements CESU et au crédit d'impôt de 50% pour vos clients."
    },
    {
      question: "Dois-je avoir un diplôme spécifique ?",
      answer: "Pour l'accompagnement d'enfants handicapés, le diplôme d'État d'éducateur spécialisé (DEES) est suffisant. Une expérience significative peut aussi être acceptée selon les cas."
    },
    {
      question: "Puis-je intervenir en cabinet ou seulement à domicile ?",
      answer: "Le CESU préfinancé ne fonctionne que pour les interventions au domicile de la famille. Pour les interventions en cabinet, seul le crédit d'impôt de 50% est possible (sans CESU)."
    },
    {
      question: "Que se passe-t-il si je déménage ?",
      answer: "Vous devez mettre à jour votre zone d'intervention sur NOVA. L'agrément reste valide tant que vous exercez en France métropolitaine."
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <ProNavbar />

      {/* Hero Section */}
      <div className="text-white" style={{ backgroundColor: '#5a1a75' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6">
              <span className="text-xs sm:text-sm font-semibold">Guide complet pour professionnels</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Obtenir l'agrément<br />Services à la Personne (SAP)
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto mb-6 sm:mb-8 px-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Permettez à vos clients de bénéficier du CESU préfinancé et du crédit d'impôt de 50%
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#demarches"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-xl text-white transition hover:bg-white"
                style={{ '--tw-text-opacity': 1 } as any}
                onMouseOver={(e) => (e.currentTarget.style.color = '#41005c')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'white')}
              >
                Voir les démarches
              </a>
              <a
                href="https://www.nova.servicesalapersonne.gouv.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-base font-medium rounded-xl hover:bg-gray-100 transition"
                style={{ color: '#41005c' }}
              >
                Accéder à NOVA
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-10 md:py-16">
        {/* Avantages */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8 md:mb-12">
            Pourquoi obtenir l'agrément SAP ?
          </h2>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 hover:shadow-xl transition hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                <svg className="w-7 h-7" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Attirer plus de clients</h3>
              <p className="text-gray-600">
                Les familles peuvent bénéficier d'une prise en charge de 50% à 80% par leur employeur via le CESU préfinancé.
              </p>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 hover:shadow-xl transition hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 sm:mb-5" style={{ backgroundColor: 'rgba(240, 135, 159, 0.2)' }}>
                <svg className="w-7 h-7" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Badge de confiance</h3>
              <p className="text-gray-600">
                Affichez le badge "Agréé Services à la Personne" sur votre profil neurocare pour plus de crédibilité.
              </p>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 hover:shadow-xl transition hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 sm:mb-5" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                <svg className="w-7 h-7" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Avantage fiscal</h3>
              <p className="text-gray-600">
                Vos clients bénéficient d'un crédit d'impôt de 50% sur les sommes versées, rendant vos services plus accessibles.
              </p>
            </div>
          </div>
        </div>

        {/* Types d'agrément */}
        <div className="mb-8 sm:mb-12 md:mb-16 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8" style={{ backgroundColor: 'rgba(65, 0, 92, 0.05)' }}>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Deux options possibles</h2>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-gray-100 rounded-xl p-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Déclaration simple</h3>
                  <span className="text-sm font-semibold" style={{ color: '#f0879f' }}>Validation en 48-72h</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span style={{ color: '#41005c' }} className="mt-0.5">✓</span>
                  <span>Crédit d'impôt de 50%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#41005c' }} className="mt-0.5">✓</span>
                  <span>Gratuit et immédiat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#41005c' }} className="mt-0.5">✓</span>
                  <span>Procédure simplifiée</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">⚠</span>
                  <span>CESU parfois limité</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 border-2" style={{ borderColor: '#41005c' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="rounded-xl p-2" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                  <svg className="w-5 h-5" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Agrément qualité</h3>
                  <span className="text-sm font-semibold" style={{ color: '#41005c' }}>Validation en 1-3 mois</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span style={{ color: '#41005c' }} className="mt-0.5">✓</span>
                  <span>Crédit d'impôt de 50%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#41005c' }} className="mt-0.5">✓</span>
                  <span><strong>CESU préfinancé complet</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#41005c' }} className="mt-0.5">✓</span>
                  <span>Maximum de crédibilité</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#41005c' }} className="mt-0.5">✓</span>
                  <span>Accès financements publics</span>
                </li>
              </ul>
              <div className="mt-4 rounded-lg p-3" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                <p className="text-xs font-semibold" style={{ color: '#41005c' }}>
                  Recommandé pour accompagnement enfants handicapés
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Démarches */}
        <div id="demarches" className="mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8 md:mb-12">
            Les étapes pour obtenir l'agrément
          </h2>

          <div className="space-y-4 sm:space-y-6">
            {/* Étape 1 */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 border-l-4" style={{ borderLeftColor: '#41005c' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                  <span className="font-bold text-lg" style={{ color: '#41005c' }}>1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Vérifier votre éligibilité</h3>
                  <p className="text-gray-600 mb-4">
                    Assurez-vous d'avoir un statut juridique actif (auto-entrepreneur, EI, société) avec un SIRET valide.
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Services éligibles pour l'autisme :</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Accompagnement d'enfants handicapés</li>
                      <li>• Assistance aux personnes ayant besoin d'aide à domicile</li>
                      <li>• Garde d'enfants à domicile</li>
                      <li>• Soutien scolaire adapté</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 border-l-4" style={{ borderLeftColor: '#f0879f' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(240, 135, 159, 0.2)' }}>
                  <span className="font-bold text-lg" style={{ color: '#f0879f' }}>2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Créer votre compte NOVA</h3>
                  <p className="text-gray-600 mb-4">
                    NOVA est la plateforme officielle pour déclarer ou demander l'agrément Services à la Personne.
                  </p>
                  <a
                    href="https://www.nova.servicesalapersonne.gouv.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center font-semibold hover:opacity-80"
                    style={{ color: '#41005c' }}
                  >
                    Accéder à NOVA
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 border-l-4" style={{ borderLeftColor: '#41005c' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                  <span className="font-bold text-lg" style={{ color: '#41005c' }}>3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Préparer vos documents</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Documents obligatoires :</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✓ Copie du SIRET</li>
                        <li>✓ Pièce d'identité</li>
                        <li>✓ Assurance RC professionnelle</li>
                        <li>✓ Justificatif de domicile</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Pour l'agrément qualité :</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>+ Diplômes et formations</li>
                        <li>+ CV détaillé</li>
                        <li>+ Projet de service</li>
                        <li>+ Procédures qualité</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 4 */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 border-l-4" style={{ borderLeftColor: '#f0879f' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(240, 135, 159, 0.2)' }}>
                  <span className="font-bold text-lg" style={{ color: '#f0879f' }}>4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Remplir le formulaire sur NOVA</h3>
                  <p className="text-gray-600 mb-4">
                    Sélectionnez les activités SAP que vous proposez et votre zone géographique d'intervention.
                  </p>
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(65, 0, 92, 0.05)', border: '1px solid rgba(65, 0, 92, 0.2)' }}>
                    <p className="text-sm" style={{ color: '#41005c' }}>
                      <strong>Astuce :</strong> Pour l'accompagnement d'enfants autistes, cochez la catégorie
                      "Accompagnement des enfants handicapés à domicile"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 5 */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 border-l-4" style={{ borderLeftColor: '#41005c' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                  <span className="font-bold text-lg" style={{ color: '#41005c' }}>5</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Attendre la validation</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)', border: '1px solid rgba(240, 135, 159, 0.3)' }}>
                      <p className="font-semibold mb-2" style={{ color: '#f0879f' }}>Déclaration simple</p>
                      <p className="text-sm text-gray-700">✓ Validation automatique en 48-72h</p>
                      <p className="text-sm text-gray-700">✓ Récépissé par email</p>
                      <p className="text-sm text-gray-700">✓ Numéro SAP attribué</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(65, 0, 92, 0.05)', border: '1px solid rgba(65, 0, 92, 0.2)' }}>
                      <p className="font-semibold mb-2" style={{ color: '#41005c' }}>Agrément qualité</p>
                      <p className="text-sm text-gray-700">⏱ Instruction par la DREETS</p>
                      <p className="text-sm text-gray-700">⏱ Délai : 1 à 3 mois</p>
                      <p className="text-sm text-gray-700">✓ Arrêté d'agrément (5 ans)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 6 */}
            <div className="rounded-xl md:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 text-white border-l-4" style={{ backgroundColor: '#41005c', borderLeftColor: '#f0879f' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">6</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Ajouter votre numéro SAP sur neurocare</h3>
                  <p className="mb-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Une fois votre agrément obtenu, ajoutez votre numéro SAP dans votre profil neurocare
                    pour afficher le badge "Agréé Services à la Personne" et apparaître dans les résultats de recherche filtrés.
                  </p>
                  <Link
                    href="/auth/register-educator"
                    className="inline-flex items-center bg-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition"
                    style={{ color: '#41005c' }}
                  >
                    S'inscrire comme professionnel
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8 md:mb-12">
            Questions fréquentes
          </h2>
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                    style={{ color: '#41005c' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact et aide */}
        <div className="rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 md:mb-16" style={{ backgroundColor: '#f3e8ff', border: '2px solid #d8b4fe' }}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#41005c' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: '#41005c' }}>Besoin d'aide ?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                <svg className="w-6 h-6" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Hotline SAP</h3>
              <p className="text-sm font-semibold" style={{ color: '#41005c' }}>0 820 00 72 72</p>
            </div>
            <div className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(240, 135, 159, 0.2)' }}>
                <svg className="w-6 h-6" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Site officiel</h3>
              <a href="https://www.servicesalapersonne.gouv.fr/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline" style={{ color: '#41005c' }}>
                servicesalapersonne.gouv.fr
              </a>
            </div>
            <div className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                <svg className="w-6 h-6" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">DREETS locale</h3>
              <a href="https://dreets.gouv.fr/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline" style={{ color: '#41005c' }}>
                Trouver votre DREETS
              </a>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center rounded-xl md:rounded-2xl p-6 sm:p-8 md:p-12" style={{ backgroundColor: 'rgba(65, 0, 92, 0.05)' }}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            Prêt à obtenir votre agrément ?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            L'agrément SAP est gratuit, rapide et vous permettra d'attirer plus de familles sur neurocare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.nova.servicesalapersonne.gouv.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 text-white text-lg font-semibold rounded-xl transition shadow-lg hover:opacity-90"
              style={{ backgroundColor: '#41005c' }}
            >
              Commencer sur NOVA
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <Link
              href="/auth/register-educator"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-lg font-semibold rounded-xl hover:bg-gray-50 transition border-2"
              style={{ color: '#41005c', borderColor: '#41005c' }}
            >
              S'inscrire sur neurocare
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-white py-8 sm:py-12 px-4 sm:px-6" style={{ backgroundColor: '#41005c' }} role="contentinfo">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Logo et description */}
            <div>
              <Link href="/pro" className="inline-block mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src="/images/logo-neurocare.svg"
                    alt="Logo NeuroCare Pro"
                    className="h-16 brightness-0 invert"
                  />
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ backgroundColor: '#f0879f' }}>
                    PRO
                  </span>
                </div>
              </Link>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                La plateforme de référence pour les professionnels de l'accompagnement des troubles neurodéveloppementaux.
              </p>
            </div>

            {/* Pour les pros */}
            <nav aria-labelledby="footer-nav-pros">
              <h3 id="footer-nav-pros" className="font-bold text-white mb-4">Pour les pros</h3>
              <ul className="space-y-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/pro/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/pro/how-it-works" className="hover:text-white transition-colors">Comment ça marche</Link></li>
                <li><Link href="/pro/sap-accreditation" className="hover:text-white transition-colors">Guide SAP</Link></li>
                <li><Link href="/auth/register-educator" className="hover:text-white transition-colors">S'inscrire</Link></li>
              </ul>
            </nav>

            {/* Ressources */}
            <nav aria-labelledby="footer-nav-ressources">
              <h3 id="footer-nav-ressources" className="font-bold text-white mb-4">Ressources</h3>
              <ul className="space-y-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </nav>

            {/* Familles */}
            <nav aria-labelledby="footer-nav-familles">
              <h3 id="footer-nav-familles" className="font-bold text-white mb-4">Familles</h3>
              <ul className="space-y-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/" className="hover:text-white transition-colors">Accueil familles</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Trouver un professionnel</Link></li>
                <li><Link href="/familles/aides-financieres" className="hover:text-white transition-colors">Aides financières</Link></li>
              </ul>
            </nav>
          </div>

          {/* Séparateur */}
          <div className="border-t pt-8" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Liens légaux */}
              <nav aria-label="Informations légales">
                <div className="flex flex-wrap justify-center gap-4 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
                  <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
                  <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
                </div>
              </nav>

              {/* Copyright */}
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                © 2025 neurocare. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
