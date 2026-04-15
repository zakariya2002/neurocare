'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import EducatorNavbar from '@/components/EducatorNavbar';

export default function SubscriptionPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    // Récupérer le profil éducateur
    const { data: educatorData } = await supabase
      .from('educator_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!educatorData) {
      router.push('/dashboard/educator');
      return;
    }

    setProfile(educatorData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#41005c' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <div className="sticky top-0 z-40">
        <EducatorNavbar profile={profile} subscription={null} />
      </div>

      <div className="flex-1 max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 w-full">
        {/* En-tête avec flèche retour */}
        <div className="mb-3 sm:mb-5 md:mb-8 lg:mb-10">
          {/* Flèche retour - desktop uniquement */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors"
            aria-label="Retour à la page précédente"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs md:text-sm font-medium">Retour</span>
          </button>

          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full flex items-center justify-center p-1" style={{ backgroundColor: '#41005c' }}>
              <img src="/images/icons/subscription.svg" alt="" className="w-full h-full" />
            </div>
            <h1 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold text-gray-900">Votre accès complet</h1>
            <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm lg:text-base mt-1 lg:mt-2">Profitez de toutes les fonctionnalités sans abonnement</p>
          </div>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 sm:mb-4 md:mb-6">
          <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4" style={{ background: 'linear-gradient(135deg, #41005c 0%, #5a1a75 100%)' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-white">Accès complet actif</h2>
                <p className="text-white/80 text-[11px] md:text-sm">100% gratuit, sans engagement</p>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 md:p-6">
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                Bonne nouvelle ! <strong>Toutes les fonctionnalités</strong> sont incluses gratuitement et sans limite.
              </p>
              <p className="text-[11px] md:text-sm text-gray-500">
                Notre modèle repose uniquement sur une commission de 12% prélevée sur les rendez-vous réservés via NeuroCare.
              </p>
            </div>

            {/* Liste des avantages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl" style={{ backgroundColor: '#f3e8ff' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#41005c' }}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Rendez-vous illimités</p>
                  <p className="text-xs text-gray-500">Aucune restriction</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl" style={{ backgroundColor: '#f3e8ff' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#41005c' }}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Conversations illimitées</p>
                  <p className="text-xs text-gray-500">Contactez toutes les familles</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl" style={{ backgroundColor: '#f3e8ff' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#41005c' }}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Profil mis en avant</p>
                  <p className="text-xs text-gray-500">Visibilité maximale</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl" style={{ backgroundColor: '#f3e8ff' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#41005c' }}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Badge vérifié</p>
                  <p className="text-xs text-gray-500">Inspirez confiance</p>
                </div>
              </div>
            </div>

            <Link
              href="/pro/pricing"
              className="block w-full text-center px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-medium transition hover:opacity-90 text-xs sm:text-sm md:text-base"
              style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}
            >
              En savoir plus sur notre modèle
            </Link>
          </div>
        </div>

        {/* Information sur les commissions */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#e6f4f4' }}>
              <svg className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1 text-xs md:text-sm">Comment ça marche ?</h3>
              <p className="text-[11px] md:text-sm text-gray-600">
                Vous ne payez que lorsque vous gagnez de l'argent. Une commission de <strong>12%</strong> est prélevée uniquement sur les rendez-vous réservés et payés via NeuroCare.
                Vos clients directs = 0% de commission.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
