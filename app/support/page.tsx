'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function SupportPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof createClientComponentClient> | null>(null);

  useEffect(() => {
    setSupabase(createClientComponentClient());
  }, []);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const faqCategories = [
    {
      category: "Compte et Inscription",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      questions: [
        {
          question: "Comment créer un compte sur NeuroCare ?",
          answer: "Cliquez sur 'Inscription' dans la barre de navigation, choisissez votre type de compte (Famille ou Éducateur), puis remplissez le formulaire avec vos informations. Pour les éducateurs, vous devrez fournir vos diplômes pour vérification."
        },
        {
          question: "J'ai oublié mon mot de passe, que faire ?",
          answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié ?' et suivez les instructions. Vous recevrez un email avec un lien pour réinitialiser votre mot de passe."
        },
        {
          question: "Comment modifier mes informations personnelles ?",
          answer: "Connectez-vous à votre tableau de bord, cliquez sur 'Profil' puis sur 'Modifier le profil'. Vous pourrez y modifier toutes vos informations."
        }
      ]
    },
    {
      category: "Pour les Familles",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      questions: [
        {
          question: "Comment rechercher un éducateur spécialisé ?",
          answer: "Utilisez la page 'Trouver un professionnel' accessible depuis le menu. Vous pouvez filtrer par localisation, certifications, et disponibilités pour trouver le professionnel qui correspond à vos besoins."
        },
        {
          question: "Est-ce que l'utilisation de la plateforme est vraiment gratuite ?",
          answer: "Oui ! Pour les familles, l'accès à la plateforme est 100% gratuit. Vous pouvez rechercher, contacter et prendre rendez-vous avec des éducateurs sans aucun frais."
        },
        {
          question: "Comment prendre rendez-vous avec un éducateur ?",
          answer: "Sur le profil de l'éducateur, cliquez sur 'Demander un rendez-vous'. Remplissez le formulaire avec vos disponibilités et préférences. L'éducateur recevra votre demande et vous contactera pour confirmer."
        },
        {
          question: "Comment contacter un éducateur ?",
          answer: "Cliquez sur 'Contacter' sur le profil de l'éducateur. Vous pourrez ensuite échanger via notre système de messagerie intégré et sécurisé."
        }
      ]
    },
    {
      category: "Pour les Éducateurs",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      questions: [
        {
          question: "Comment faire vérifier mes diplômes ?",
          answer: "Lors de votre inscription, téléchargez les copies de vos diplômes dans la section prévue. Notre équipe vérifiera auprès de la DREETS et validera votre profil sous 2-5 jours ouvrés."
        },
        {
          question: "Comment fonctionne la tarification pour les professionnels ?",
          answer: "NeuroCare est 100% gratuit pour les professionnels : inscription, gestion de profil, messagerie et RDV inclus. Une commission de 12% est prélevée uniquement sur les rendez-vous réservés et encaissés via la plateforme."
        },
        {
          question: "Comment gérer mes disponibilités ?",
          answer: "Dans votre tableau de bord, accédez à la section 'Disponibilités'. Vous pouvez y définir vos plages horaires disponibles et bloquer certaines périodes."
        },
        {
          question: "Comment répondre aux demandes de rendez-vous ?",
          answer: "Vous recevrez une notification pour chaque nouvelle demande. Accédez à votre tableau de bord, section 'Rendez-vous', pour accepter, proposer une autre date, ou décliner les demandes."
        }
      ]
    },
    {
      category: "Messagerie et Communication",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      questions: [
        {
          question: "Comment accéder à mes messages ?",
          answer: "Cliquez sur 'Messages' dans la barre de navigation. Vous y trouverez toutes vos conversations avec les éducateurs ou les familles."
        },
        {
          question: "Puis-je partager des fichiers dans la messagerie ?",
          answer: "Pour des raisons de sécurité, le partage de fichiers n'est pas encore disponible dans la messagerie. Vous pouvez échanger des informations textuelles et coordonner vos rendez-vous."
        },
        {
          question: "Les messages sont-ils confidentiels ?",
          answer: "Oui, toutes les conversations sont sécurisées et confidentielles. Seuls vous et votre interlocuteur avez accès aux messages échangés."
        }
      ]
    },
    {
      category: "Sécurité et Confidentialité",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      questions: [
        {
          question: "Comment mes données personnelles sont-elles protégées ?",
          answer: "Nous utilisons un chiffrement de niveau bancaire pour protéger vos données. Vos informations personnelles ne sont jamais partagées avec des tiers sans votre consentement explicite."
        },
        {
          question: "Puis-je supprimer mon compte ?",
          answer: "Oui, vous pouvez demander la suppression de votre compte à tout moment en nous contactant via le formulaire ci-dessous. Toutes vos données seront supprimées conformément au RGPD."
        },
        {
          question: "Comment vérifiez-vous l'identité des éducateurs ?",
          answer: "Tous les éducateurs doivent fournir une copie de leurs diplômes qui est vérifiée auprès de la DREETS. Seuls les professionnels qualifiés peuvent créer un profil d'éducateur."
        }
      ]
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setSubmitMessage({ type: 'error', text: 'Initialisation en cours, veuillez réessayer.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Envoyer le message via l'API
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setSubmitMessage({
        type: 'success',
        text: 'Votre message a été envoyé avec succès ! Notre équipe vous répondra dans les plus brefs délais à votre adresse email.'
      });
      setFormData({ subject: '', message: '' });
    } catch (error) {
      console.error('Erreur:', error);
      setSubmitMessage({
        type: 'error',
        text: 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer ou nous contacter directement à admin@neuro-care.fr'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Centre d'Assistance
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Besoin d'aide ? Consultez notre FAQ ou contactez-nous directement
            </p>
          </div>
        </div>
      </div>

      {/* Navigation rapide */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#faq" className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 transition-colors font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Consulter la FAQ
            </a>
            <a href="#contact" className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Nous contacter
            </a>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Questions Fréquentes
          </h2>
          <p className="text-xl text-gray-600">
            Trouvez rapidement les réponses à vos questions
          </p>
        </div>

        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                    {category.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{category.category}</h3>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {category.questions.map((faq, faqIndex) => {
                  const globalIndex = categoryIndex * 100 + faqIndex;
                  const isOpen = openFaqIndex === globalIndex;

                  return (
                    <div key={faqIndex} className="transition-all duration-200">
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : globalIndex)}
                        className="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                      >
                        <span className="text-lg font-semibold text-gray-900 flex-1">
                          {faq.question}
                        </span>
                        <svg
                          className={`w-6 h-6 text-primary-600 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form Section */}
      <div id="contact" className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Vous n'avez pas trouvé votre réponse ?
            </h2>
            <p className="text-xl text-gray-600">
              Contactez-nous et nous vous répondrons dans les plus brefs délais
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2">
                  Sujet
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Ex: Problème de connexion, Question sur les tarifs..."
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                  placeholder="Décrivez votre problème ou posez votre question en détail..."
                />
              </div>

              {submitMessage && (
                <div className={`p-4 rounded-xl ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <div className="flex items-center gap-2">
                    {submitMessage.type === 'success' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span className="font-medium">{submitMessage.text}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Vous pouvez également retourner à votre{' '}
              <Link href="/dashboard/family" className="text-primary-600 hover:text-primary-700 font-semibold">
                tableau de bord
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
