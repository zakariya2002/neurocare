'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications';
import { useToast } from '@/components/Toast';

interface Certification {
  id: string;
  name: string;
  type: string;
  issuing_organization: string;
  issue_date: string;
  diploma_number: string | null;
  issuing_region: string | null;
  document_url: string | null;
  verification_status: string;
  verification_date: string | null;
  verification_notes: string | null;
  created_at: string;
  educator_id: string;
  educator?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface DiplomaDuplicate {
  diploma_number: string;
  diploma_type: string;
  usage_count: number;
  certifications_using_this_number: any[];
}

export default function AdminCertificationsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [duplicates, setDuplicates] = useState<DiplomaDuplicate[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'document_verified' | 'officially_confirmed' | 'rejected'>('pending');
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (loading === false) {
      fetchCertifications();
      fetchDuplicates();
    }
  }, [filter, loading]);

  const fetchDuplicates = async () => {
    try {
      const { data, error } = await supabase
        .from('diploma_duplicates_alert')
        .select('*');

      if (error) {
        console.error('Erreur récupération doublons:', error);
        return;
      }

      setDuplicates(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      // Vérification admin gérée par le middleware
      setLoading(false);
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      router.push('/');
    }
  };

  const fetchCertifications = async () => {
    try {
      let query = supabase
        .from('certifications')
        .select(`
          *,
          educator:educator_profiles!inner(
            id,
            first_name,
            last_name,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('verification_status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur récupération certifications:', error);
        return;
      }

      // Ajouter un email par défaut (pas besoin d'accéder à auth.users pour l'instant)
      const certsWithEmails = data.map((cert: any) => ({
        ...cert,
        educator: {
          ...cert.educator,
          email: 'Non disponible' // On affichera juste "Non disponible" pour l'instant
        }
      }));

      setCertifications(certsWithEmails);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const openModal = (cert: Certification) => {
    setSelectedCert(cert);
    setNotes(cert.verification_notes || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCert(null);
    setNotes('');
  };

  const handleApprove = async (status: 'document_verified' | 'officially_confirmed') => {
    if (!selectedCert) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('certifications')
        .update({
          verification_status: status,
          verification_date: new Date().toISOString(),
          verification_notes: notes || null
        })
        .eq('id', selectedCert.id);

      if (error) throw error;

      // Envoyer une notification à l'éducateur
      const educatorUserId = (selectedCert as any).educator?.user_id;
      if (educatorUserId) {
        const statusLabel = status === 'document_verified' ? 'vérifiée' : 'confirmée officiellement';
        await createNotification({
          user_id: educatorUserId,
          type: 'system',
          title: 'Certification approuvée',
          content: `Votre certification "${selectedCert.name}" a été ${statusLabel}.`,
          link: '/dashboard/educator/profile',
          metadata: { certification_id: selectedCert.id },
        });
      }

      showToast('Certification approuvée ! L\'éducateur a été notifié.');
      closeModal();
      fetchCertifications();
    } catch (error: any) {
      showToast('Erreur: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCert) return;
    if (!notes.trim()) {
      showToast('Veuillez indiquer la raison du rejet dans les notes', 'info');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('certifications')
        .update({
          verification_status: 'rejected',
          verification_date: new Date().toISOString(),
          verification_notes: notes
        })
        .eq('id', selectedCert.id);

      if (error) throw error;

      // Envoyer une notification à l'éducateur
      const educatorUserId = (selectedCert as any).educator?.user_id;
      if (educatorUserId) {
        await createNotification({
          user_id: educatorUserId,
          type: 'system',
          title: 'Certification rejetée',
          content: `Votre certification "${selectedCert.name}" a été rejetée. Raison : ${notes}`,
          link: '/dashboard/educator/profile',
          metadata: { certification_id: selectedCert.id },
        });
      }

      showToast('Certification rejetée. L\'éducateur a été notifié.');
      closeModal();
      fetchCertifications();
    } catch (error: any) {
      showToast('Erreur: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
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
      {/* Navigation moderne */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/admin" className="flex items-center gap-2 sm:gap-3 group">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow">
                  <Image
                    src="/images/logo-neurocare.png"
                    alt="neurocare"
                    width={28}
                    height={28}
                    className="brightness-0 invert w-5 h-5 sm:w-7 sm:h-7"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    neurocare
                  </span>
                  <span className="hidden sm:block text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                    Administration
                  </span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-purple-50 transition-all duration-200"
                title="Retour"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">Retour</span>
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/');
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                title="Déconnexion"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* En-tête avec gradient */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
            <span className="text-xs sm:text-sm font-semibold text-amber-600 uppercase tracking-wide">Modération</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Certifications</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">Vérifiez et validez les diplômes</p>
        </div>

        {/* Alertes de doublons */}
        {duplicates.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="h-6 w-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-orange-900">
                  ⚠️ {duplicates.length} numéro(s) de diplôme en doublon détecté(s)
                </h3>
              </div>
              <button
                onClick={() => setShowDuplicates(!showDuplicates)}
                className="px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
              >
                {showDuplicates ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            {showDuplicates && (
              <div className="mt-4 space-y-3">
                {duplicates.map((dup) => (
                  <div key={dup.diploma_number} className="bg-white border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-mono text-lg font-bold text-orange-900">{dup.diploma_number}</span>
                        <span className="ml-3 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                          {dup.diploma_type}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-700 font-semibold rounded-full">
                        Utilisé {dup.usage_count} fois
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 font-medium mb-2">Certifications utilisant ce numéro :</p>
                      <ul className="space-y-2">
                        {dup.certifications_using_this_number.map((cert: any, idx: number) => (
                          <li key={idx} className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-gray-900">{cert.educator_name}</span>
                                <span className="mx-2 text-gray-400">•</span>
                                <span className="text-gray-600">{new Date(cert.created_at).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded ${
                                cert.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                cert.verification_status === 'document_verified' ? 'bg-green-100 text-green-700' :
                                cert.verification_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {cert.verification_status}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filtres - scrollable sur mobile */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-100 -mx-3 sm:mx-0">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              ⏳ En attente
            </button>
            <button
              onClick={() => setFilter('document_verified')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'document_verified'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              ✅ Vérifiées
            </button>
            <button
              onClick={() => setFilter('officially_confirmed')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'officially_confirmed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              ⭐ Confirmées
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              ❌ Rejetées
            </button>
          </div>
        </div>

        {/* Liste des certifications */}
        <div className="space-y-3 sm:space-y-4">
          {certifications.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-8 sm:p-12 text-center border border-gray-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium text-sm sm:text-base">Aucune certification à afficher</p>
            </div>
          ) : (
            certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">{cert.name}</h3>
                      {cert.verification_status === 'pending' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                          ⏳ En attente
                        </span>
                      )}
                      {cert.verification_status === 'document_verified' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          ✅ Vérifié
                        </span>
                      )}
                      {cert.verification_status === 'officially_confirmed' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          ⭐ Confirmé
                        </span>
                      )}
                      {cert.verification_status === 'rejected' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                          ❌ Rejeté
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-gray-500">Éducateur</p>
                        <p className="font-medium">
                          {cert.educator?.first_name} {cert.educator?.last_name}
                        </p>
                        <p className="text-gray-600 text-xs truncate">{cert.educator?.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Type</p>
                        <p className="font-medium">{cert.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Organisme</p>
                        <p className="font-medium truncate">{cert.issuing_organization}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date d'obtention</p>
                        <p className="font-medium">
                          {new Date(cert.issue_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      {cert.diploma_number && (
                        <div>
                          <p className="text-gray-500">N° diplôme</p>
                          <p className="font-medium font-mono text-xs">{cert.diploma_number}</p>
                        </div>
                      )}
                      {cert.issuing_region && (
                        <div>
                          <p className="text-gray-500">Région</p>
                          <p className="font-medium">{cert.issuing_region}</p>
                        </div>
                      )}
                    </div>

                    {cert.verification_notes && (
                      <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">
                          <strong>Notes :</strong> {cert.verification_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-2 sm:ml-4">
                    {cert.document_url && (
                      <a
                        href={cert.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium text-center whitespace-nowrap"
                      >
                        📄 Voir
                      </a>
                    )}
                    {cert.verification_status === 'pending' && (
                      <button
                        onClick={() => openModal(cert)}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium whitespace-nowrap"
                      >
                        ✅ Modérer
                      </button>
                    )}
                    {cert.verification_status !== 'pending' && (
                      <button
                        onClick={() => openModal(cert)}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs sm:text-sm font-medium whitespace-nowrap"
                      >
                        👁️ Détails
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de modération */}
      {modalOpen && selectedCert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Modération de la certification</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">{selectedCert.name}</p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-gray-500 font-medium">Éducateur</p>
                  <p className="text-gray-900">
                    {selectedCert.educator?.first_name} {selectedCert.educator?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Email</p>
                  <p className="text-gray-900 truncate">{selectedCert.educator?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Type</p>
                  <p className="text-gray-900">{selectedCert.type}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Organisme</p>
                  <p className="text-gray-900 truncate">{selectedCert.issuing_organization}</p>
                </div>
                {selectedCert.diploma_number && (
                  <div>
                    <p className="text-gray-500 font-medium">N° diplôme</p>
                    <p className="text-gray-900 font-mono text-xs">{selectedCert.diploma_number}</p>
                  </div>
                )}
                {selectedCert.issuing_region && (
                  <div>
                    <p className="text-gray-500 font-medium">Région</p>
                    <p className="text-gray-900">{selectedCert.issuing_region}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Notes de vérification
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Ajoutez des notes sur la vérification (obligatoire en cas de rejet)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>

              {selectedCert.document_url && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-medium text-blue-900 mb-2">Document à vérifier</p>
                  <a
                    href={selectedCert.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium"
                  >
                    📄 Ouvrir le document
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
              {selectedCert.verification_status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove('document_verified')}
                    disabled={processing}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 text-xs sm:text-sm"
                  >
                    ✅ Approuver
                  </button>
                  <button
                    onClick={() => handleApprove('officially_confirmed')}
                    disabled={processing}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 text-xs sm:text-sm"
                  >
                    ⭐ Confirmer
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 text-xs sm:text-sm"
                  >
                    ❌ Rejeter
                  </button>
                </>
              )}
              <button
                onClick={closeModal}
                disabled={processing}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50 text-xs sm:text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
