'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import { FEATURES } from '@/lib/feature-flags';

interface Receipt {
  id: string;
  invoice_number: string;
  invoice_date: string;
  amount_total: number;
  pdf_url: string;
  status: string;
  appointment: {
    appointment_date: string;
    start_time: string;
    end_time: string;
    educator: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function FamilyReceiptsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);

      const { data: familyProfile } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      setProfile(familyProfile);
      if (!familyProfile) return;

      setFamilyId(familyProfile.id);

      // Fetch receipts in parallel (independent of profile data beyond family_id)
      const { data: receiptsData, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          invoice_date,
          amount_total,
          pdf_url,
          status,
          appointment:appointments(
            appointment_date,
            start_time,
            end_time,
            educator:educator_profiles(
              first_name,
              last_name
            )
          )
        `)
        .eq('family_id', familyProfile.id)
        .eq('type', 'family_receipt')
        .order('invoice_date', { ascending: false });

      if (error) {
        console.error('Error fetching receipts:', error);
      } else {
        const mappedData = (receiptsData || []).map((receipt: any) => ({
          ...receipt,
          appointment: Array.isArray(receipt.appointment) && receipt.appointment.length > 0
            ? {
                ...receipt.appointment[0],
                educator: Array.isArray(receipt.appointment[0].educator) && receipt.appointment[0].educator.length > 0
                  ? receipt.appointment[0].educator[0]
                  : receipt.appointment[0].educator
              }
            : receipt.appointment
        }));
        setReceipts(mappedData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amountInCents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amountInCents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navbar */}
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      <div className="flex-1 max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 w-full">
        {/* Flèche retour */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          aria-label="Retour à la page précédente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Retour</span>
        </button>

        {/* Header avec icône */}
        <div className="mb-3 sm:mb-4 md:mb-6 text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full flex items-center justify-center p-1" style={{ backgroundColor: '#027e7e' }}>
            <img src="/images/icons/7.svg" alt="" className="w-full h-full" />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Mes reçus</h1>
          <p className="text-[11px] md:text-sm text-gray-500 mt-1">Téléchargez vos reçus de paiement</p>
        </div>

        {/* Liste des reçus */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
          <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-gray-100">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
              Historique ({receipts.length})
            </h2>
          </div>

          <div className="p-3 sm:p-4 md:p-6">
            {loading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2" style={{ borderColor: '#027e7e' }}></div>
                <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base">Chargement des reçus...</p>
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#e6f4f4' }}>
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#027e7e' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mt-3 text-base font-medium text-gray-900">Aucun reçu</h3>
                <p className="mt-1 text-sm text-gray-500 px-4">
                  Vos reçus apparaîtront ici après chaque séance complétée.
                </p>
                <div className="mt-5">
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl font-medium hover:opacity-90 transition text-sm"
                    style={{ backgroundColor: '#f0879f' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Chercher un professionnel
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 hover:shadow-md transition-all"
                  >
                    {/* En-tête du reçu */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            Reçu {receipt.invoice_number}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {formatDateShort(receipt.invoice_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-base sm:text-lg font-bold text-green-600">
                          {formatAmount(receipt.amount_total)}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Payé
                        </span>
                      </div>
                    </div>

                    {/* Détails du reçu */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Professionnel</p>
                          <p className="font-medium text-gray-900 truncate">
                            {receipt.appointment?.educator?.first_name} {receipt.appointment?.educator?.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Séance du</p>
                          <p className="font-medium text-gray-900">
                            {receipt.appointment?.appointment_date && formatDateShort(receipt.appointment.appointment_date)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bouton télécharger - pleine largeur sur mobile */}
                    <a
                      href={receipt.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Télécharger le reçu ${receipt.invoice_number} du ${formatDateShort(receipt.invoice_date)}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-medium hover:opacity-90 transition text-sm"
                      style={{ backgroundColor: '#027e7e' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Télécharger le reçu PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Justificatif annuel CAF / impôts / CESU (A4) */}
        {FEATURES.justificatifsAnnuels && receipts.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <Link
              href="/dashboard/family/receipts/annuel"
              className="block rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-5 sm:py-5 hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    Justificatif annuel CAF / impôts / CESU
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Synthèse PDF de tous vos paiements par année civile.
                  </p>
                </div>
                <span
                  className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  Voir
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Info box */}
        {receipts.length > 0 && (
          <div className="mt-4 sm:mt-6 rounded-xl p-4 sm:p-5" style={{ backgroundColor: '#e6f4f4', border: '1px solid #c9eaea' }}>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" style={{ color: '#027e7e' }}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: '#027e7e' }}>À propos de vos reçus</h3>
                <ul className="mt-2 text-xs sm:text-sm text-gray-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#3a9e9e' }} className="mt-0.5">•</span>
                    <span>Générés automatiquement après chaque séance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#3a9e9e' }} className="mt-0.5">•</span>
                    <span>Téléchargeables au format PDF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#3a9e9e' }} className="mt-0.5">•</span>
                    <span>Conservez-les pour votre comptabilité</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Espace pour le footer */}
        <div className="h-8"></div>
      </div>

      {/* Footer teal */}
      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
