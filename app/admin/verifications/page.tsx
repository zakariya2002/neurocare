'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { getProfessionByValue } from '@/lib/professions-config';

interface Educator {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  verification_status: string;
  created_at: string;
  documents_count: number;
  profession_type: string;
}

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [educators, setEducators] = useState<Educator[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadEducators();
  }, [filter]);

  const loadEducators = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter });
      const res = await fetch(`/api/admin/verifications?${params}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setEducators(data.educators || []);
    } catch (error) {
      console.error('Erreur chargement éducateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
      pending_documents: { label: 'En attente documents', color: 'text-gray-700', bgColor: 'bg-gray-100' },
      documents_submitted: { label: 'Documents soumis', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      documents_verified: { label: 'Documents vérifiés', color: 'text-green-700', bgColor: 'bg-green-100' },
      interview_scheduled: { label: 'Entretien planifié', color: 'text-purple-700', bgColor: 'bg-purple-100' },
      verified: { label: 'Vérifié ✓', color: 'text-green-800', bgColor: 'bg-green-200' },
      rejected_criminal_record: { label: 'Refusé (casier)', color: 'text-red-700', bgColor: 'bg-red-100' },
      rejected_interview: { label: 'Refusé (entretien)', color: 'text-red-700', bgColor: 'bg-red-100' }
    };
    return statuses[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
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
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8">
        {/* En-tête avec gradient */}
        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
            <span className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wide">Modération</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Vérifications</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">Documents, casiers et entretiens</p>
        </div>

        {/* Filtres - scrollable sur mobile */}
        <div className="mb-3 sm:mb-4 md:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex gap-2 min-w-max sm:flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setFilter('documents_submitted')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition whitespace-nowrap ${
                filter === 'documents_submitted'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Documents soumis
            </button>
            <button
              onClick={() => setFilter('documents_verified')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition whitespace-nowrap ${
                filter === 'documents_verified'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Documents OK
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition whitespace-nowrap ${
                filter === 'verified'
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Vérifiés
            </button>
          </div>
        </div>

        {/* Liste des éducateurs */}
        {educators.length === 0 ? (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-6 sm:p-8 md:p-12 text-center border border-gray-100">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Aucune vérification en attente</h3>
            <p className="text-sm sm:text-base text-gray-500">Tous les professionnels ont été traités</p>
          </div>
        ) : (
          <>
            {/* Vue mobile - Cartes */}
            <div className="block lg:hidden space-y-3">
              {educators.map((educator) => {
                const statusInfo = getStatusInfo(educator.verification_status);
                const professionConfig = getProfessionByValue(educator.profession_type);
                return (
                  <div key={educator.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {educator.first_name} {educator.last_name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{educator.email}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color} ${statusInfo.bgColor}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-gray-500">Profession</span>
                        <p className="font-medium text-gray-900 truncate">{professionConfig?.label || 'Non défini'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Documents</span>
                        <p className="font-medium text-gray-900">{educator.documents_count}/4</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Date</span>
                        <p className="font-medium text-gray-900">{new Date(educator.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/verifications/${educator.id}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                    >
                      Examiner
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Vue desktop - Tableau */}
            <div className="hidden lg:block bg-white rounded-xl md:rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Professionnel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profession
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {educators.map((educator) => {
                    const statusInfo = getStatusInfo(educator.verification_status);
                    const professionConfig = getProfessionByValue(educator.profession_type);
                    return (
                      <tr key={educator.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {educator.first_name} {educator.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{educator.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {professionConfig?.label || 'Non défini'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {professionConfig?.verificationMethod === 'dreets' ? '🏛️ DREETS' :
                             professionConfig?.verificationMethod === 'rpps' ? '🔬 RPPS' : '👤 Manuel'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {educator.documents_count}/4
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color} ${statusInfo.bgColor}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(educator.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/verifications/${educator.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                          >
                            Examiner
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
