'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import Logo from '@/components/Logo';
import EducatorNavbar from '@/components/EducatorNavbar';

export default function SAPAccreditationPage() {
  const router = useRouter();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);

        // Déterminer le rôle de l'utilisateur
        const { data: educatorProfile } = await supabase
          .from('educator_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (educatorProfile) {
          setUserRole('educator');
          setProfile(educatorProfile);

          // Vérifier l'abonnement
          const { data: subscriptionData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('educator_id', educatorProfile.id)
            .in('status', ['active', 'trialing'])
            .limit(1)
            .maybeSingle();

          setSubscription(subscriptionData);
        } else {
          setUserRole('family');
        }
      }
    };

    checkAuth();
  }, []);

  const isPremium = subscription && ['active', 'trialing'].includes(subscription.status);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      {isLoggedIn && userRole === 'educator' ? (
        <EducatorNavbar profile={profile} subscription={subscription} />
      ) : (
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Logo />
              <div className="flex items-center space-x-4">
                <Link href="/auth/register-educator" className="hidden md:block text-gray-700 hover:text-primary-600 px-3 py-2 font-medium transition">
                  Inscription éducateur
                </Link>
                <Link href="/auth/login" className="text-gray-700 hover:text-primary-600 px-3 py-2 font-medium text-sm md:text-base transition">
                  Connexion
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          {/* Bouton retour si connecté */}
          {isLoggedIn && userRole === 'educator' && (
            <button
              onClick={() => router.push('/dashboard/educator')}
              className="absolute left-4 sm:left-6 lg:left-8 top-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              aria-label="Retour"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className="text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-semibold">Guide complet pour éducateurs</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Obtenir l'agrément<br />Services à la Personne (SAP)
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Permettez à vos clients de bénéficier du CESU préfinancé et du crédit d'impôt de 50%
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#demarches"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white hover:text-primary-600 transition"
              >
                Voir les démarches
              </a>
              <a
                href="https://www.nova.servicesalapersonne.gouv.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 text-base font-medium rounded-lg hover:bg-blue-50 transition"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Avantages */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Pourquoi obtenir l'agrément SAP ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Attirer plus de clients</h3>
              <p className="text-gray-600">
                Les familles peuvent bénéficier d'une prise en charge de 50% à 80% par leur employeur via le CESU préfinancé.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Badge de confiance</h3>
              <p className="text-gray-600">
                Affichez le badge "Agréé Services à la Personne" sur votre profil NeuroCare pour plus de crédibilité.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Avantage fiscal</h3>
              <p className="text-gray-600">
                Vos clients bénéficient d'un crédit d'impôt de 50% sur les sommes versées, rendant vos services plus accessibles.
              </p>
            </div>
          </div>
        </div>

        {/* Types d'agrément */}
        <div className="mb-16 bg-blue-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Deux options possibles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-blue-100 rounded p-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Déclaration simple</h3>
                  <span className="text-sm text-green-600 font-semibold">Validation en 48-72h</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Crédit d'impôt de 50%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Gratuit et immédiat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Procédure simplifiée</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">⚠</span>
                  <span>CESU parfois limité</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-primary-500">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-primary-100 rounded p-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Agrément qualité</h3>
                  <span className="text-sm text-blue-600 font-semibold">Validation en 1-3 mois</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Crédit d'impôt de 50%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>CESU préfinancé complet</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Maximum de crédibilité</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Accès financements publics</span>
                </li>
              </ul>
              <div className="mt-4 bg-primary-50 rounded-lg p-3">
                <p className="text-xs text-primary-800 font-semibold">
                  ⭐ Recommandé pour accompagnement enfants handicapés
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Démarches */}
        <div id="demarches" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Les étapes pour obtenir l'agrément
          </h2>

          <div className="space-y-6">
            {/* Étape 1 */}
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-primary-500">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-lg">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Vérifier votre éligibilité</h3>
                  <p className="text-gray-600 mb-4">
                    Assurez-vous d'avoir un statut juridique actif (auto-entrepreneur, EI, société) avec un SIRET valide.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
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
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-blue-500">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Créer votre compte NOVA</h3>
                  <p className="text-gray-600 mb-4">
                    NOVA est la plateforme officielle pour déclarer ou demander l'agrément Services à la Personne.
                  </p>
                  <a
                    href="https://www.nova.servicesalapersonne.gouv.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
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
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-green-500">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Préparer vos documents</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Documents obligatoires :</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✓ Copie du SIRET</li>
                        <li>✓ Pièce d'identité</li>
                        <li>✓ Assurance RC professionnelle</li>
                        <li>✓ Justificatif de domicile</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
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
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-purple-500">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Remplir le formulaire sur NOVA</h3>
                  <p className="text-gray-600 mb-4">
                    Sélectionnez les activités SAP que vous proposez et votre zone géographique d'intervention.
                  </p>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-800">
                      <strong>Astuce :</strong> Pour l'accompagnement d'enfants autistes, cochez la catégorie
                      "Accompagnement des enfants handicapés à domicile"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 5 */}
            <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-yellow-500">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-lg">5</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Attendre la validation</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-semibold text-green-800 mb-2">Déclaration simple</p>
                      <p className="text-sm text-green-700">✓ Validation automatique en 48-72h</p>
                      <p className="text-sm text-green-700">✓ Récépissé par email</p>
                      <p className="text-sm text-green-700">✓ Numéro SAP attribué</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="font-semibold text-blue-800 mb-2">Agrément qualité</p>
                      <p className="text-sm text-blue-700">⏱ Instruction par la DREETS</p>
                      <p className="text-sm text-blue-700">⏱ Délai : 1 à 3 mois</p>
                      <p className="text-sm text-blue-700">✓ Arrêté d'agrément (5 ans)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 6 */}
            <div className="bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl shadow-md p-8 text-white border-l-4 border-yellow-400">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">6</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3">Ajouter votre numéro SAP sur NeuroCare</h3>
                  <p className="text-blue-100 mb-4">
                    Une fois votre agrément obtenu, ajoutez votre numéro SAP dans votre profil NeuroCare
                    pour afficher le badge "Agréé Services à la Personne" et apparaître dans les résultats de recherche filtrés.
                  </p>
                  {isLoggedIn && userRole === 'educator' ? (
                    <Link
                      href="/dashboard/educator/profile"
                      className="inline-flex items-center bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
                    >
                      Accéder à mon profil
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <Link
                      href="/auth/register-educator"
                      className="inline-flex items-center bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
                    >
                      S'inscrire comme éducateur
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Questions fréquentes
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
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
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Besoin d'aide ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Hotline SAP</h3>
              <p className="text-gray-300 text-sm">0 820 00 72 72</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Site officiel</h3>
              <a href="https://www.servicesalapersonne.gouv.fr/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 text-sm">
                servicesalapersonne.gouv.fr
              </a>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">DREETS locale</h3>
              <a href="https://dreets.gouv.fr/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 text-sm">
                Trouver votre DREETS
              </a>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-16 text-center bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Prêt à obtenir votre agrément ?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            L'agrément SAP est gratuit, rapide et vous permettra d'attirer plus de familles sur NeuroCare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.nova.servicesalapersonne.gouv.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 transition shadow-lg"
            >
              Commencer sur NOVA
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            {isLoggedIn ? (
              <Link
                href={userRole === 'educator' ? '/dashboard/educator' : '/dashboard/family'}
                className={`inline-flex items-center justify-center px-8 py-4 text-white text-lg font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl ${
                  userRole === 'educator'
                    ? 'bg-gradient-to-r from-primary-500 to-green-500 hover:from-primary-600 hover:to-green-600'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                }`}
              >
                <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Tableau de bord
              </Link>
            ) : (
              <Link
                href="/auth/register-educator"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 text-lg font-semibold rounded-lg hover:bg-gray-50 transition border-2 border-primary-600"
              >
                S'inscrire sur NeuroCare
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
