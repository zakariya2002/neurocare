'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProNavbar from '@/components/ProNavbar';
import EducatorNavbar from '@/components/EducatorNavbar';

export default function ProSAPAccreditationPage() {
  const router = useRouter();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [educatorProfile, setEducatorProfile] = useState<any>(null);
  const [isEducator, setIsEducator] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('pro-theme');
    checkAuth();
    return () => {
      document.documentElement.classList.remove('pro-theme');
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.user_metadata?.role === 'educator') {
      const { data: profile } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profile) {
        setEducatorProfile(profile);
        setIsEducator(true);
      }
    }
    setAuthChecked(true);
  };

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
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      {isEducator ? (
        <div className="sticky top-0 z-40">
          <EducatorNavbar profile={educatorProfile} />
        </div>
      ) : (
        <ProNavbar />
      )}

      <div className={`flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-8 ${isEducator ? 'py-3 sm:py-5 md:py-8' : 'pt-20 sm:pt-22 md:pt-24'}`}>
        {/* Bouton retour */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-gray-800 mb-3 sm:mb-4 md:mb-5 transition-colors"
          aria-label="Retour"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs md:text-sm font-medium">Retour</span>
        </button>

        {/* Header avec icône SAP */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full flex items-center justify-center p-1" style={{ backgroundColor: '#41005c' }}>
            <img src="/images/icons/sap-badge.svg" alt="" className="w-full h-full" />
          </div>
          <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">Agrément Services à la Personne</h1>
          <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm mt-1 px-2">Permettez à vos clients de bénéficier du CESU et du crédit d'impôt de 50%</p>
        </div>

        {/* Boutons d'action rapide */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
          <a
            href="#demarches"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-xl font-medium text-xs sm:text-sm transition hover:opacity-90"
            style={{ borderColor: '#41005c', color: '#41005c' }}
          >
            Voir les démarches
          </a>
          <a
            href="https://www.nova.servicesalapersonne.gouv.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-white rounded-xl font-medium text-xs sm:text-sm transition hover:opacity-90"
            style={{ backgroundColor: '#41005c' }}
          >
            Accéder à NOVA
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Avantages */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-4 md:mb-6">
          <div className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 border-b border-gray-100" style={{ backgroundColor: '#faf5ff' }}>
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Pourquoi obtenir l'agrément SAP ?</h2>
          </div>
          <div className="p-3 sm:p-4 md:p-5 grid gap-2.5 sm:gap-3">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
                color: '#41005c', bg: 'rgba(65, 0, 92, 0.1)',
                title: 'Attirer plus de clients',
                desc: 'Prise en charge de 50% à 80% par l\'employeur via le CESU préfinancé.',
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
                color: '#f0879f', bg: 'rgba(240, 135, 159, 0.15)',
                title: 'Badge de confiance',
                desc: 'Affichez "Agréé SAP" sur votre profil NeuroCare pour plus de crédibilité.',
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
                color: '#41005c', bg: 'rgba(65, 0, 92, 0.1)',
                title: 'Avantage fiscal',
                desc: 'Crédit d\'impôt de 50% pour vos clients, rendant vos services plus accessibles.',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-gray-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: item.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.icon}
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">{item.title}</h3>
                  <p className="text-gray-600 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Types d'agrément */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-4 md:mb-6">
          <div className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 border-b border-gray-100" style={{ backgroundColor: '#faf5ff' }}>
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Deux options possibles</h2>
          </div>
          <div className="p-3 sm:p-4 md:p-5 grid sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Déclaration simple */}
            <div className="rounded-xl p-3 sm:p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                <div className="bg-gray-100 rounded-lg p-1.5">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">Déclaration simple</h3>
                  <span className="text-xs font-semibold" style={{ color: '#f0879f' }}>48-72h</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-700">
                <li className="flex items-start gap-1.5"><span style={{ color: '#41005c' }}>✓</span>Crédit d'impôt de 50%</li>
                <li className="flex items-start gap-1.5"><span style={{ color: '#41005c' }}>✓</span>Gratuit et immédiat</li>
                <li className="flex items-start gap-1.5"><span style={{ color: '#41005c' }}>✓</span>Procédure simplifiée</li>
                <li className="flex items-start gap-1.5"><span className="text-orange-500">⚠</span>CESU parfois limité</li>
              </ul>
            </div>

            {/* Agrément qualité */}
            <div className="rounded-xl p-3 sm:p-4 border-2" style={{ borderColor: '#41005c' }}>
              <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                <div className="rounded-lg p-1.5" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                  <svg className="w-4 h-4" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">Agrément qualité</h3>
                  <span className="text-xs font-semibold" style={{ color: '#41005c' }}>1-3 mois</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-700">
                <li className="flex items-start gap-1.5"><span style={{ color: '#41005c' }}>✓</span>Crédit d'impôt de 50%</li>
                <li className="flex items-start gap-1.5"><span style={{ color: '#41005c' }}>✓</span><strong>CESU préfinancé complet</strong></li>
                <li className="flex items-start gap-1.5"><span style={{ color: '#41005c' }}>✓</span>Maximum de crédibilité</li>
                <li className="flex items-start gap-1.5"><span style={{ color: '#41005c' }}>✓</span>Accès financements publics</li>
              </ul>
              <div className="mt-2.5 rounded-lg p-2 sm:p-2.5" style={{ backgroundColor: 'rgba(65, 0, 92, 0.08)' }}>
                <p className="text-xs font-semibold" style={{ color: '#41005c' }}>
                  Recommandé pour accompagnement enfants handicapés
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Démarches */}
        <div id="demarches" className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-4 md:mb-6">
          <div className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 border-b border-gray-100" style={{ backgroundColor: '#faf5ff' }}>
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Les étapes pour obtenir l'agrément</h2>
          </div>
          <div className="p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3">
            {/* Étape 1 */}
            <div className="p-2.5 sm:p-3 md:p-4 rounded-xl border-l-3 sm:border-l-4" style={{ borderLeftColor: '#41005c', backgroundColor: '#fdf9f4' }}>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                  <span className="font-bold text-xs sm:text-sm" style={{ color: '#41005c' }}>1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2">Vérifier votre éligibilité</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Assurez-vous d'avoir un statut juridique actif (auto-entrepreneur, EI, société) avec un SIRET valide.
                  </p>
                  <div className="bg-white rounded-lg p-2 sm:p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Services éligibles :</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      <li>• Accompagnement d'enfants handicapés</li>
                      <li>• Assistance aux personnes à domicile</li>
                      <li>• Garde d'enfants à domicile</li>
                      <li>• Soutien scolaire adapté</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="p-2.5 sm:p-3 md:p-4 rounded-xl border-l-3 sm:border-l-4" style={{ borderLeftColor: '#f0879f', backgroundColor: '#fdf9f4' }}>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(240, 135, 159, 0.15)' }}>
                  <span className="font-bold text-xs sm:text-sm" style={{ color: '#f0879f' }}>2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2">Créer votre compte NOVA</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    NOVA est la plateforme officielle pour déclarer ou demander l'agrément SAP.
                  </p>
                  <a
                    href="https://www.nova.servicesalapersonne.gouv.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center font-semibold text-xs hover:opacity-80"
                    style={{ color: '#41005c' }}
                  >
                    Accéder à NOVA
                    <svg className="ml-1 w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="p-2.5 sm:p-3 md:p-4 rounded-xl border-l-3 sm:border-l-4" style={{ borderLeftColor: '#41005c', backgroundColor: '#fdf9f4' }}>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                  <span className="font-bold text-xs sm:text-sm" style={{ color: '#41005c' }}>3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2">Préparer vos documents</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-2 sm:p-2.5">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Obligatoires :</p>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        <li>✓ Copie du SIRET</li>
                        <li>✓ Pièce d'identité</li>
                        <li>✓ Assurance RC pro</li>
                        <li>✓ Justif. domicile</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-2 sm:p-2.5">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Agrément qualité :</p>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        <li>+ Diplômes</li>
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
            <div className="p-2.5 sm:p-3 md:p-4 rounded-xl border-l-3 sm:border-l-4" style={{ borderLeftColor: '#f0879f', backgroundColor: '#fdf9f4' }}>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(240, 135, 159, 0.15)' }}>
                  <span className="font-bold text-xs sm:text-sm" style={{ color: '#f0879f' }}>4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2">Remplir le formulaire NOVA</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Sélectionnez vos activités SAP et votre zone d'intervention.
                  </p>
                  <div className="rounded-lg p-2 sm:p-2.5" style={{ backgroundColor: 'rgba(65, 0, 92, 0.06)', border: '1px solid rgba(65, 0, 92, 0.15)' }}>
                    <p className="text-xs" style={{ color: '#41005c' }}>
                      <strong>Astuce :</strong> Cochez "Accompagnement des enfants handicapés à domicile"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 5 */}
            <div className="p-2.5 sm:p-3 md:p-4 rounded-xl border-l-3 sm:border-l-4" style={{ borderLeftColor: '#41005c', backgroundColor: '#fdf9f4' }}>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                  <span className="font-bold text-xs sm:text-sm" style={{ color: '#41005c' }}>5</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2">Attendre la validation</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-2 sm:p-2.5" style={{ backgroundColor: 'rgba(240, 135, 159, 0.08)', border: '1px solid rgba(240, 135, 159, 0.2)' }}>
                      <p className="font-semibold text-xs mb-1" style={{ color: '#f0879f' }}>Déclaration</p>
                      <p className="text-xs text-gray-700">✓ Auto en 48-72h</p>
                      <p className="text-xs text-gray-700">✓ Récépissé email</p>
                    </div>
                    <div className="rounded-lg p-2 sm:p-2.5" style={{ backgroundColor: 'rgba(65, 0, 92, 0.05)', border: '1px solid rgba(65, 0, 92, 0.15)' }}>
                      <p className="font-semibold text-xs mb-1" style={{ color: '#41005c' }}>Agrément</p>
                      <p className="text-xs text-gray-700">⏱ DREETS 1-3 mois</p>
                      <p className="text-xs text-gray-700">✓ Valide 5 ans</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 6 */}
            <div className="p-2.5 sm:p-3 md:p-4 rounded-xl text-white" style={{ backgroundColor: '#41005c' }}>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs sm:text-sm">6</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2">Ajoutez votre numéro SAP sur NeuroCare</h3>
                  <p className="text-xs mb-2 sm:mb-3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Affichez le badge "Agréé SAP" et apparaissez dans les résultats filtrés.
                  </p>
                  <Link
                    href="/auth/register-educator"
                    className="inline-flex items-center bg-white px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-xs hover:bg-gray-100 transition"
                    style={{ color: '#41005c' }}
                  >
                    S'inscrire comme professionnel
                    <svg className="ml-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-4 md:mb-6">
          <div className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 border-b border-gray-100" style={{ backgroundColor: '#faf5ff' }}>
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Questions fréquentes</h2>
          </div>
          <div className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-2.5">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm pr-2">{faq.question}</span>
                  <svg
                    className={`w-4 h-4 flex-shrink-0 transform transition-transform ${openFAQ === index ? 'rotate-180' : ''}`}
                    style={{ color: '#41005c' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFAQ === index && (
                  <div className="px-3 sm:px-4 pb-2.5 sm:pb-3 text-gray-600 text-xs border-t border-gray-100 pt-2.5 sm:pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Besoin d'aide */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-4 md:mb-6">
          <div className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 border-b border-gray-100" style={{ backgroundColor: '#f3e8ff' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#41005c' }}>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: '#41005c' }}>Besoin d'aide ?</h2>
            </div>
          </div>
          <div className="p-3 sm:p-4 md:p-5 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="text-center p-2 sm:p-3 rounded-xl border border-gray-100">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-xs mb-0.5">Hotline SAP</h3>
              <p className="text-xs font-semibold" style={{ color: '#41005c' }}>0 820 00 72 72</p>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-xl border border-gray-100">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2" style={{ backgroundColor: 'rgba(240, 135, 159, 0.15)' }}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-xs mb-0.5">Site officiel</h3>
              <a href="https://www.servicesalapersonne.gouv.fr/" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold hover:underline break-all" style={{ color: '#41005c' }}>
                gouv.fr/sap
              </a>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-xl border border-gray-100">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-xs mb-0.5">DREETS</h3>
              <a href="https://dreets.gouv.fr/" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold hover:underline" style={{ color: '#41005c' }}>
                Trouver la vôtre
              </a>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 text-center" style={{ backgroundColor: 'rgba(65, 0, 92, 0.06)' }}>
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
            Prêt à obtenir votre agrément ?
          </h2>
          <p className="text-xs md:text-sm text-gray-600 mb-3 sm:mb-4">
            Gratuit, rapide et vous permettra d'attirer plus de familles.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <a
              href="https://www.nova.servicesalapersonne.gouv.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 text-white rounded-xl font-semibold text-xs sm:text-sm transition hover:opacity-90"
              style={{ backgroundColor: '#41005c' }}
            >
              Commencer sur NOVA
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <Link
              href="/auth/register-educator"
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 bg-white rounded-xl font-semibold text-xs sm:text-sm hover:bg-gray-50 transition border-2"
              style={{ color: '#41005c', borderColor: '#41005c' }}
            >
              S'inscrire sur NeuroCare
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-white py-6 sm:py-8 md:py-10 px-3 sm:px-4 md:px-6 mt-6 sm:mt-10" style={{ backgroundColor: '#41005c' }} role="contentinfo">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-6 sm:mb-8">
            <div className="col-span-2 lg:col-span-1">
              <Link href="/pro" className="inline-block mb-3">
                <div className="flex items-center gap-2">
                  <img src="/images/logo-neurocare.svg" alt="Logo NeuroCare Pro" className="h-10 sm:h-12 brightness-0 invert" />
                  <span className="px-1.5 sm:px-2 py-0.5 text-xs font-bold rounded-full" style={{ backgroundColor: '#f0879f' }}>PRO</span>
                </div>
              </Link>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                La plateforme de référence pour les professionnels de l'accompagnement des TND.
              </p>
            </div>
            <nav aria-labelledby="footer-pros">
              <h3 id="footer-pros" className="font-bold text-white mb-2 sm:mb-3 text-xs sm:text-sm">Pour les pros</h3>
              <ul className="space-y-1.5 text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/pro/pricing" className="hover:text-white transition-colors">Notre modèle</Link></li>
                <li><Link href="/pro/how-it-works" className="hover:text-white transition-colors">Comment ça marche</Link></li>
                <li><Link href="/pro/sap-accreditation" className="hover:text-white transition-colors">Guide SAP</Link></li>
              </ul>
            </nav>
            <nav aria-labelledby="footer-ressources">
              <h3 id="footer-ressources" className="font-bold text-white mb-2 sm:mb-3 text-xs sm:text-sm">Ressources</h3>
              <ul className="space-y-1.5 text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </nav>
            <nav aria-labelledby="footer-familles">
              <h3 id="footer-familles" className="font-bold text-white mb-2 sm:mb-3 text-xs sm:text-sm">Familles</h3>
              <ul className="space-y-1.5 text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/" className="hover:text-white transition-colors">Accueil familles</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Trouver un pro</Link></li>
              </ul>
            </nav>
          </div>
          <div className="border-t pt-4 sm:pt-6" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <nav aria-label="Informations légales">
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
                  <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
                  <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
                </div>
              </nav>
              <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>© 2025 NeuroCare. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
