'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import EducatorNavbar from '@/components/EducatorNavbar';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  type: 'educator_invoice' | 'family_receipt';
  amount_total: number;
  amount_commission: number;
  amount_net: number;
  status: string;
  pdf_url: string | null;
  client_name: string;
  appointment_id: string | null;
}

export default function EducatorInvoices() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
    const { data: profileData } = await supabase
      .from('educator_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);

      // Récupérer les factures
      const invoicesResult = await supabase
        .from('invoices')
        .select('*')
        .eq('educator_id', profileData.id)
        .eq('type', 'educator_invoice')
        .order('invoice_date', { ascending: false });

      if (invoicesResult.error) {
        console.error('Erreur lors de la récupération des factures:', invoicesResult.error);
      } else {
        setInvoices(invoicesResult.data || []);
      }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2) + ' €';
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
        <EducatorNavbar profile={profile} />
      </div>

      <div className="flex-1 max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 w-full">
        {/* En-tête avec flèche retour */}
        <div className="mb-3 sm:mb-5 md:mb-8">
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
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full flex items-center justify-center p-1" style={{ backgroundColor: '#41005c' }}>
              <img src="/images/icons/7.svg" alt="" className="w-full h-full" />
            </div>
            <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">Mes factures</h1>
            <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm mt-1">Toutes vos factures pour vos déclarations URSSAF</p>
          </div>
        </div>

        {/* Information URSSAF */}
        <div className="rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 md:mb-6" style={{ backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe' }}>
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#41005c' }}>
              <svg className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xs md:text-sm font-semibold" style={{ color: '#41005c' }}>
                Information importante
              </h3>
              <p className="mt-1 text-[11px] md:text-sm" style={{ color: '#5a1a75' }}>
                Ces factures sont générées automatiquement après chaque prestation terminée et sont prêtes pour vos déclarations URSSAF.
              </p>
            </div>
          </div>
        </div>

        {/* Liste des factures */}
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{ backgroundColor: '#f3e8ff' }}>
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#41005c' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm md:text-base font-semibold text-gray-900">
              Aucune facture disponible
            </h3>
            <p className="mt-1 sm:mt-2 text-xs md:text-sm text-gray-500">
              Les factures seront générées automatiquement après vos premières prestations terminées.
            </p>
            <div className="mt-3 sm:mt-5">
              <Link
                href="/dashboard/educator/appointments"
                className="inline-flex items-center px-5 py-2.5 md:px-6 md:py-3 text-xs sm:text-sm font-medium rounded-xl text-white hover:opacity-90 transition"
                style={{ backgroundColor: '#41005c' }}
              >
                Voir mes rendez-vous
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Vue mobile - Cartes */}
            <div className="md:hidden space-y-2 sm:space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="bg-white shadow-sm rounded-xl p-3 sm:p-4 border border-gray-100">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm md:text-base font-semibold" style={{ color: '#41005c' }}>{invoice.invoice_number}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(invoice.invoice_date)}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'generated' ? 'text-white' :
                      invoice.status === 'sent' ? 'bg-amber-100 text-amber-700' :
                      invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`} style={invoice.status === 'generated' ? { backgroundColor: '#41005c' } : {}}>
                      {invoice.status === 'generated' ? 'Générée' :
                       invoice.status === 'sent' ? 'Envoyée' :
                       invoice.status === 'paid' ? 'Payée' :
                       invoice.status}
                    </span>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Client</span>
                      <span className="font-medium text-gray-900">{invoice.client_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Montant TTC</span>
                      <span className="font-medium text-gray-900">{formatAmount(invoice.amount_total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commission</span>
                      <span className="font-medium" style={{ color: '#f0879f' }}>-{formatAmount(invoice.amount_commission)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <span className="text-gray-700 font-medium">Net perçu</span>
                      <span className="font-bold text-green-600">{formatAmount(invoice.amount_net)}</span>
                    </div>
                  </div>

                  <a
                    href={invoice.pdf_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-white rounded-xl hover:opacity-90 font-medium transition text-xs sm:text-sm"
                    style={{ backgroundColor: '#41005c' }}
                    aria-label={`Télécharger la facture ${invoice.invoice_number}`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger
                  </a>
                </div>
              ))}
            </div>

            {/* Vue desktop - Tableau */}
            <div className="hidden md:block bg-white shadow-sm rounded-xl md:rounded-2xl border border-gray-100 overflow-x-auto">
              <table className="w-full divide-y divide-gray-100">
                <thead style={{ backgroundColor: '#faf5ff' }}>
                  <tr>
                    <th scope="col" className="px-3 lg:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#41005c' }}>
                      Numéro
                    </th>
                    <th scope="col" className="px-3 lg:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#41005c' }}>
                      Date
                    </th>
                    <th scope="col" className="px-3 lg:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#41005c' }}>
                      Client
                    </th>
                    <th scope="col" className="px-3 lg:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#41005c' }}>
                      Net perçu
                    </th>
                    <th scope="col" className="px-3 lg:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#41005c' }}>
                      Statut
                    </th>
                    <th scope="col" className="px-3 lg:px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: '#41005c' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm font-semibold" style={{ color: '#41005c' }}>
                        {invoice.invoice_number}
                      </td>
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {invoice.client_name}
                      </td>
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm font-bold text-green-600">
                        {formatAmount(invoice.amount_net)}
                      </td>
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'generated' ? 'text-white' :
                          invoice.status === 'sent' ? 'bg-amber-100 text-amber-700' :
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`} style={invoice.status === 'generated' ? { backgroundColor: '#41005c' } : {}}>
                          {invoice.status === 'generated' ? 'Générée' :
                           invoice.status === 'sent' ? 'Envoyée' :
                           invoice.status === 'paid' ? 'Payée' :
                           invoice.status}
                        </span>
                      </td>
                      <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                        <a
                          href={invoice.pdf_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition"
                          style={{ backgroundColor: '#41005c' }}
                          aria-label={`Télécharger la facture ${invoice.invoice_number}`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Statistiques des factures */}
        {invoices.length > 0 && (
          <div className="mt-3 sm:mt-4 md:mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white rounded-xl p-2.5 sm:p-4 text-center border border-gray-100 shadow-sm">
              <p className="text-lg sm:text-2xl font-bold" style={{ color: '#41005c' }}>{invoices.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Factures</p>
            </div>
            <div className="bg-white rounded-xl p-2.5 sm:p-4 text-center border border-gray-100 shadow-sm">
              <p className="text-sm sm:text-2xl font-bold text-green-600">{formatAmount(invoices.reduce((sum, inv) => sum + inv.amount_net, 0))}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Revenu net</p>
            </div>
            <div className="bg-white rounded-xl p-2.5 sm:p-4 text-center border border-gray-100 shadow-sm">
              <p className="text-sm sm:text-2xl font-bold" style={{ color: '#f0879f' }}>{formatAmount(invoices.reduce((sum, inv) => sum + inv.amount_commission, 0))}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Commissions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
