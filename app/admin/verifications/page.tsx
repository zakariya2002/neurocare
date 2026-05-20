'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfessionByValue } from '@/lib/professions-config';
import { Card, Badge, Button } from '@/components/admin/ui';

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

const filters = [
  { value: 'all', label: 'Tous en attente' },
  { value: 'pending_documents', label: 'Nouveaux inscrits' },
  { value: 'documents_submitted', label: 'Documents soumis' },
  { value: 'documents_verified', label: 'Documents OK' },
  { value: 'verified', label: 'Vérifiés' },
];

export default function AdminVerificationsPage() {
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

  const getStatusBadge = (status: string) => {
    if (status === 'verified') return <Badge variant="success">Vérifié</Badge>;
    if (status.startsWith('rejected')) return <Badge variant="danger">Refusé</Badge>;
    if (status === 'interview_scheduled') return <Badge variant="purple">Entretien planifié</Badge>;
    if (status === 'documents_verified') return <Badge variant="info">Documents OK</Badge>;
    if (status === 'documents_submitted') return <Badge variant="info">Documents soumis</Badge>;
    if (status === 'pending_documents') return <Badge variant="neutral">En attente docs</Badge>;
    return <Badge variant="neutral">{status.replace(/_/g, ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-admin-muted-dark">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark">
            Vérifications
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
            Documents, casiers judiciaires et entretiens
          </p>
        </div>
        <Link
          href="/admin/verifications/announcements"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-admin-surface-dark text-gray-700 dark:text-admin-muted-dark border border-gray-200 dark:border-admin-border-dark hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          Annonces familles
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-admin-surface-dark text-gray-700 dark:text-admin-muted-dark border border-gray-200 dark:border-admin-border-dark hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {educators.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark mb-1">
              Aucune vérification en attente
            </h3>
            <p className="text-sm text-gray-500 dark:text-admin-muted-dark">
              Tous les professionnels ont été traités
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {educators.map((educator) => {
              const professionConfig = getProfessionByValue(educator.profession_type);
              return (
                <Card key={educator.id} padding="md">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark truncate">
                        {educator.first_name} {educator.last_name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-admin-muted-dark truncate">
                        {educator.email}
                      </p>
                    </div>
                    {getStatusBadge(educator.verification_status)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-gray-500 dark:text-admin-muted-dark block">Profession</span>
                      <p className="font-medium text-gray-900 dark:text-admin-text-dark truncate">
                        {professionConfig?.label || 'Non défini'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-admin-muted-dark block">Documents</span>
                      <p className="font-medium text-gray-900 dark:text-admin-text-dark">
                        {educator.documents_count}/4
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-admin-muted-dark block">Date</span>
                      <p className="font-medium text-gray-900 dark:text-admin-text-dark">
                        {new Date(educator.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Link href={`/admin/verifications/${educator.id}`}>
                    <Button variant="primary" size="md" fullWidth>
                      Examiner
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>

          {/* Desktop table */}
          <Card padding="none" className="hidden lg:block overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-admin-border-dark">
              <thead className="bg-gray-50 dark:bg-admin-surface-dark-2">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-admin-muted-dark uppercase tracking-wider">Professionnel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-admin-muted-dark uppercase tracking-wider">Profession</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-admin-muted-dark uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-admin-muted-dark uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-admin-muted-dark uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-admin-muted-dark uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-admin-border-dark">
                {educators.map((educator) => {
                  const professionConfig = getProfessionByValue(educator.profession_type);
                  return (
                    <tr key={educator.id} className="hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-admin-text-dark">
                          {educator.first_name} {educator.last_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-admin-muted-dark">{educator.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-admin-text-dark">
                          {professionConfig?.label || 'Non défini'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-admin-muted-dark">
                          {professionConfig?.verificationMethod === 'dreets' ? 'DREETS' :
                           professionConfig?.verificationMethod === 'rpps' ? 'RPPS' : 'Manuel'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-admin-text-dark">
                        {educator.documents_count}/4
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(educator.verification_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-admin-muted-dark">
                        {new Date(educator.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link href={`/admin/verifications/${educator.id}`}>
                          <Button variant="primary" size="sm">
                            Examiner
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
