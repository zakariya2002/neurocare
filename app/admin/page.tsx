'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { StatCard, Card } from '@/components/admin/ui';

interface Stats {
  pendingCertifications: number;
  pendingAvatars: number;
  pendingVerifications: number;
  pendingBlogPosts: number;
  totalEducators: number;
  totalFamilies: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    pendingCertifications: 0,
    pendingAvatars: 0,
    pendingVerifications: 0,
    pendingBlogPosts: 0,
    totalEducators: 0,
    totalFamilies: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }
    await loadStats();
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Erreur chargement stats');
      const data = await res.json();
      setStats({
        pendingCertifications: data.pendingCertifications || 0,
        pendingAvatars: data.pendingAvatars || 0,
        pendingVerifications: data.pendingVerifications || 0,
        pendingBlogPosts: data.pendingBlogPosts || 0,
        totalEducators: data.totalEducators || 0,
        totalFamilies: data.totalFamilies || 0,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
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

  const totalPending =
    stats.pendingCertifications +
    stats.pendingAvatars +
    stats.pendingVerifications +
    stats.pendingBlogPosts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
          Vue d&apos;ensemble de l&apos;activité et des modérations en attente
        </p>
      </div>

      {/* Pending moderation stats */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-admin-muted-dark mb-3">
          À modérer ({totalPending})
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Vérifications"
            value={stats.pendingVerifications}
            href="/admin/verifications"
            hint="documents & casiers"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
          <StatCard
            label="Certifications"
            value={stats.pendingCertifications}
            href="/admin/certifications"
            hint="à approuver"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
          />
          <StatCard
            label="Avatars"
            value={stats.pendingAvatars}
            href="/admin/avatars"
            hint="à valider"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <StatCard
            label="Articles blog"
            value={stats.pendingBlogPosts}
            href="/admin/blog"
            hint="à publier"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Community totals */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-admin-muted-dark mb-3">
          Communauté
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Professionnels"
            value={stats.totalEducators}
            href="/admin/users"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Familles"
            value={stats.totalFamilies}
            href="/admin/users"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Empty state if nothing pending */}
      {totalPending === 0 && (
        <Card padding="lg">
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark mb-1">
              Tout est à jour
            </h3>
            <p className="text-sm text-gray-500 dark:text-admin-muted-dark">
              Aucune modération en attente
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
