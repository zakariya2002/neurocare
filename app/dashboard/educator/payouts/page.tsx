'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import EducatorNavbar from '@/components/EducatorNavbar';
import { useToast } from '@/components/Toast';

type ConnectStatus = 'loading' | 'not_started' | 'onboarding_incomplete' | 'pending_verification' | 'active';

interface TransferRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  appointment_id: string;
}

export default function PayoutsPage() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [status, setStatus] = useState<ConnectStatus>('loading');
  const [loading, setLoading] = useState(false);
  const [educatorId, setEducatorId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (searchParams.get('onboarding') === 'complete') {
      setShowSuccess(true);
      fetchStatus();
      setTimeout(() => setShowSuccess(false), 5000);
    }
    if (searchParams.get('refresh') === 'true') {
      handleStartOnboarding();
    }
  }, [searchParams]);

  const fetchStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setUserId(session.user.id);

      const { data: educator } = await supabase
        .from('educator_profiles')
        .select('id, stripe_account_id, stripe_onboarding_complete, stripe_payouts_enabled')
        .eq('user_id', session.user.id)
        .single();

      if (!educator) return;
      setEducatorId(educator.id);

      if (!educator.stripe_account_id) {
        setStatus('not_started');
        return;
      }

      // Vérifier le statut via l'API
      const res = await fetch('/api/educators/stripe-connect/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ educatorId: educator.id }),
      });

      const data = await res.json();
      setStatus(data.status as ConnectStatus);

      // Charger les transferts si actif
      if (data.status === 'active') {
        const { data: transferData } = await supabase
          .from('stripe_transfers')
          .select('*')
          .eq('educator_id', educator.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (transferData) {
          setTransfers(transferData);
          setTotalEarnings(transferData.reduce((sum: number, t: TransferRecord) => sum + t.amount, 0));
        }
      }
    } catch (error) {
      console.error('Erreur chargement statut:', error);
    }
  };

  const handleStartOnboarding = async () => {
    if (!educatorId || !userId) {
      console.error('IDs manquants - educatorId:', educatorId, 'userId:', userId);
      showToast('Erreur: profil non chargé. Rechargez la page.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/educators/stripe-connect/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ educatorId, userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur lors de la configuration', 'error');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('Erreur: pas de lien de configuration reçu', 'error');
      }
    } catch (error: any) {
      console.error('Erreur onboarding:', error);
      showToast(error.message || 'Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/educators/stripe-connect/dashboard-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ educatorId, userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur lors de l\'ouverture du dashboard', 'error');
        return;
      }
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Erreur dashboard:', error);
      showToast(error.message || 'Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EducatorNavbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiements</h1>
        <p className="text-gray-600 mb-8">Configurez vos paiements pour recevoir vos revenus directement sur votre compte bancaire.</p>

        {/* Toast de succès */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 font-medium">Configuration terminée ! Votre compte est en cours de vérification.</p>
          </div>
        )}

        {/* État : Chargement */}
        {status === 'loading' && (
          <div className="bg-white rounded-xl border p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#41005c]"></div>
          </div>
        )}

        {/* État : Pas commencé */}
        {status === 'not_started' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#41005c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Configurez vos paiements</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Pour recevoir vos revenus directement sur votre compte bancaire, configurez votre compte de paiement sécurisé via Stripe.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-lg mx-auto text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">100% sécurisé</p>
                    <p className="text-xs text-gray-500">Chiffrement bancaire</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Rapide</p>
                    <p className="text-xs text-gray-500">2 minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Automatique</p>
                    <p className="text-xs text-gray-500">Virements directs</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartOnboarding}
                disabled={loading}
                className="px-8 py-3 rounded-xl text-white font-semibold text-lg transition-all disabled:opacity-50"
                style={{ backgroundColor: '#41005c' }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Chargement...
                  </span>
                ) : (
                  'Configurer mes paiements'
                )}
              </button>

              <p className="text-xs text-gray-400 mt-4">
                Powered by Stripe - Conforme RGPD et PSD2
              </p>
            </div>
          </div>
        )}

        {/* État : Onboarding incomplet */}
        {status === 'onboarding_incomplete' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Configuration incomplète</h2>
              <p className="text-gray-600 mb-8">
                Vous avez commencé la configuration de vos paiements mais ne l'avez pas terminée. Reprenez où vous en étiez.
              </p>
              <button
                onClick={handleStartOnboarding}
                disabled={loading}
                className="px-8 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
                style={{ backgroundColor: '#41005c' }}
              >
                {loading ? 'Chargement...' : 'Reprendre la configuration'}
              </button>
            </div>
          </div>
        )}

        {/* État : En cours de vérification */}
        {status === 'pending_verification' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Vérification en cours</h2>
              <p className="text-gray-600 mb-4">
                Votre compte est en cours de vérification par Stripe. Cela prend généralement quelques minutes à 24 heures.
              </p>
              <p className="text-sm text-gray-500">
                Vous recevrez un email dès que votre compte sera activé.
              </p>
            </div>
          </div>
        )}

        {/* État : Actif */}
        {status === 'active' && (
          <>
            {/* Statut actif */}
            <div className="bg-white rounded-xl border overflow-hidden mb-6">
              <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Paiements actifs</h3>
                    <p className="text-sm text-gray-500">Vos revenus sont versés automatiquement sur votre compte bancaire</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenDashboard}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Chargement...' : 'Tableau de bord Stripe'}
                </button>
              </div>
            </div>

            {/* Résumé des revenus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl border p-6">
                <p className="text-sm text-gray-500 mb-1">Total des revenus</p>
                <p className="text-3xl font-bold text-gray-900">{(totalEarnings / 100).toFixed(2)} €</p>
              </div>
              <div className="bg-white rounded-xl border p-6">
                <p className="text-sm text-gray-500 mb-1">Transferts effectués</p>
                <p className="text-3xl font-bold text-gray-900">{transfers.length}</p>
              </div>
            </div>

            {/* Historique des transferts */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900">Historique des transferts</h3>
              </div>
              {transfers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Aucun transfert pour le moment.</p>
                  <p className="text-sm mt-1">Vos transferts apparaîtront ici après vos premières séances.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {transfers.map((transfer) => (
                    <div key={transfer.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          +{(transfer.amount / 100).toFixed(2)} €
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transfer.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        transfer.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transfer.status === 'completed' ? 'Effectué' : 'En cours'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Info commission */}
        {status !== 'loading' && (
          <div className="mt-8 bg-gray-50 border rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Comment ça fonctionne ?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#41005c] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                <p>La famille paie lors de la réservation. Le montant est <strong>pré-autorisé</strong> mais pas débité.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#41005c] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                <p>Après la séance (validation du code PIN), le paiement est <strong>capturé</strong>.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#41005c] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                <p><strong>88% du montant</strong> est transféré automatiquement sur votre compte bancaire. NeuroCare retient 12% (incluant les frais bancaires).</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#41005c] text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                <p>Les virements sont effectués par Stripe sous <strong>2 à 7 jours ouvrés</strong> selon votre banque.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
