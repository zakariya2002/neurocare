'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface PaymentStats {
  totalRevenue: number;
  totalCommission: number;
  totalEducatorRevenue: number;
  subscriptionRevenue: number;
  totalAppointments: number;
  completedAppointments: number;
  failedPayments: number;
  refundedPayments: number;
  pendingPayments: number;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  price: number;
  status: string;
  payment_status: string;
  payment_intent_id: string;
  platform_commission: number;
  educator_revenue: number;
  created_at: string;
  educator_name: string;
  family_name: string;
}

interface SubscriptionTransaction {
  id: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  educator_id: string;
}

export default function AdminPayments() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'appointments' | 'subscriptions'>('appointments');
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0, totalCommission: 0, totalEducatorRevenue: 0,
    subscriptionRevenue: 0, totalAppointments: 0, completedAppointments: 0,
    failedPayments: 0, refundedPayments: 0, pendingPayments: 0,
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [subscriptionTransactions, setSubscriptionTransactions] = useState<SubscriptionTransaction[]>([]);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!loading) loadData();
  }, [period, statusFilter]);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }
    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/admin/payments?period=${period}&status=${statusFilter}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setStats(data.stats);
      setAppointments(data.appointments);
      setSubscriptionTransactions(data.subscriptionTransactions);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const formatCents = (cents: number) => `${(cents / 100).toFixed(2)} €`;
  const formatEuros = (euros: number) => `${euros.toFixed(2)} €`;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      authorized: 'bg-yellow-100 text-yellow-700',
      captured: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-purple-100 text-purple-700',
      canceled: 'bg-gray-100 text-gray-600',
      succeeded: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    const labels: Record<string, string> = {
      authorized: 'Autorisé',
      captured: 'Capturé',
      failed: 'Échoué',
      refunded: 'Remboursé',
      canceled: 'Annulé',
      succeeded: 'Réussi',
      pending: 'En attente',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-purple-600/10"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <Link href="/admin" className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Image src="/images/logo-neurocare.png" alt="neurocare" width={28} height={28} className="brightness-0 invert w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">neurocare</span>
                <span className="hidden sm:block text-[10px] text-gray-500 font-medium tracking-wide uppercase">Administration</span>
              </div>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-purple-600 p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-purple-50 transition-all duration-200">
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600 p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-red-50 transition-all duration-200">
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8">
        {/* Header */}
        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-green-600 to-emerald-400 rounded-full"></div>
            <span className="text-xs sm:text-sm font-semibold text-green-600 uppercase tracking-wide">Finances</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Paiements</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">Suivi des revenus, commissions et transactions</p>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">3 derniers mois</option>
            <option value="365">12 derniers mois</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="authorized">Autorisés</option>
            <option value="captured">Capturés</option>
            <option value="failed">Échoués</option>
            <option value="refunded">Remboursés</option>
          </select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-4 mb-6 sm:mb-8">
          {/* Revenu total */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-green-400/10 to-emerald-500/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16"></div>
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 mb-2 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Revenu total</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCents(stats.totalRevenue)}</p>
            </div>
          </div>

          {/* Commission NeuroCare */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16"></div>
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-2 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Commission (12%)</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCents(stats.totalCommission)}</p>
            </div>
          </div>

          {/* Abonnements */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-blue-400/10 to-cyan-500/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16"></div>
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-2 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Abonnements</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatEuros(stats.subscriptionRevenue)}</p>
            </div>
          </div>

          {/* Rendez-vous */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-amber-400/10 to-orange-500/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16"></div>
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-2 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Rendez-vous</p>
              <div className="flex items-baseline gap-1">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completedAppointments}</p>
                <span className="text-xs text-gray-400">/ {stats.totalAppointments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateurs secondaires */}
        <div className="flex flex-wrap gap-3 mb-6">
          {stats.pendingPayments > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <span className="text-sm text-yellow-700 font-medium">{stats.pendingPayments} paiement(s) en attente de capture</span>
            </div>
          )}
          {stats.failedPayments > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-sm text-red-700 font-medium">{stats.failedPayments} paiement(s) échoué(s)</span>
            </div>
          )}
          {stats.refundedPayments > 0 && (
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span className="text-sm text-purple-700 font-medium">{stats.refundedPayments} remboursement(s)</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 max-w-md">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'appointments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Rendez-vous ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'subscriptions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Abonnements ({subscriptionTransactions.length})
          </button>
        </div>

        {/* Tableau Rendez-vous */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Famille</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Professionnel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Commission</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        Aucune transaction pour cette période
                      </td>
                    </tr>
                  ) : (
                    appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(apt.appointment_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </div>
                          <div className="text-xs text-gray-400">{apt.start_time?.slice(0, 5)}</div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm text-gray-700">{apt.family_name}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm text-gray-700">{apt.educator_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900">{formatCents(apt.price || 0)}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-green-600 font-medium">{formatCents(apt.platform_commission || 0)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(apt.payment_status || apt.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tableau Abonnements */}
        {activeTab === 'subscriptions' && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subscriptionTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                        Aucune transaction d&apos;abonnement pour cette période
                      </td>
                    </tr>
                  ) : (
                    subscriptionTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{tx.description}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900">{formatEuros(tx.amount)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(tx.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200/50 text-center">
          <p className="text-sm text-gray-400">neurocare Administration &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
