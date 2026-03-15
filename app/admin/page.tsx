'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
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

    // Charger les statistiques
    await loadStats();
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      // Compter les certifications en attente
      const { count: certCount } = await supabase
        .from('certifications')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      // Compter les avatars en attente
      const { count: avatarCount } = await supabase
        .from('educator_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('avatar_moderation_status', 'pending')
        .not('avatar_url', 'is', null);

      // Compter les éducateurs
      const { count: educatorCount } = await supabase
        .from('educator_profiles')
        .select('*', { count: 'exact', head: true });

      // Compter les familles
      const { count: familyCount } = await supabase
        .from('family_profiles')
        .select('*', { count: 'exact', head: true });

      // Compter les vérifications en attente (documents_submitted)
      const { count: verificationCount } = await supabase
        .from('educator_profiles')
        .select('*', { count: 'exact', head: true })
        .in('verification_status', ['documents_submitted', 'documents_verified', 'interview_scheduled']);

      // Compter les articles de blog en attente
      const { count: blogCount } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        pendingCertifications: certCount || 0,
        pendingAvatars: avatarCount || 0,
        pendingVerifications: verificationCount || 0,
        pendingBlogPosts: blogCount || 0,
        totalEducators: educatorCount || 0,
        totalFamilies: familyCount || 0,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
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
      {/* Navbar moderne */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
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
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-purple-50 transition-all duration-200"
                title="Voir le site"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">Voir le site</span>
              </Link>
              <button
                onClick={handleLogout}
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

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8">
        {/* Header avec gradient */}
        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"></div>
            <span className="text-xs sm:text-sm font-semibold text-purple-600 uppercase tracking-wide">Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
            Gérez les modérations et consultez les statistiques
          </p>
        </div>

        {/* Statistiques avec design moderne */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-4 mb-3 sm:mb-4 md:mb-6 lg:mb-10">
          {/* Certifications en attente */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-amber-400/10 to-orange-500/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                {stats.pendingCertifications > 0 && (
                  <span className="hidden sm:inline-flex px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                    En attente
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Certifications</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.pendingCertifications}</p>
            </div>
          </div>

          {/* Avatars en attente */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-blue-400/10 to-cyan-500/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                {stats.pendingAvatars > 0 && (
                  <span className="hidden sm:inline-flex px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    En attente
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Avatars</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.pendingAvatars}</p>
            </div>
          </div>

          {/* Éducateurs */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="hidden sm:inline-flex px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  Total
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Professionnels</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalEducators}</p>
            </div>
          </div>

          {/* Familles */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="hidden sm:inline-flex px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  Total
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Familles</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalFamilies}</p>
            </div>
          </div>
        </div>

        {/* Section Modération */}
        <div className="mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
            <div className="h-1 w-6 sm:w-8 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"></div>
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900">Modération</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-4">
            {/* Vérifications */}
            <Link
              href="/admin/verifications"
              className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-teal-500 group-hover:from-white/20 group-hover:to-white/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-white/20 transition-all duration-300">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 group-hover:text-white transition-colors duration-300 mb-0.5 sm:mb-1">
                  Vérifications
                </h3>
                <p className="hidden sm:block text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300 mb-3">
                  Documents, casiers, entretiens
                </p>
                {stats.pendingVerifications > 0 && (
                  <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-100 text-emerald-700 group-hover:bg-white/20 group-hover:text-white transition-colors duration-300 mt-1 sm:mt-0">
                    {stats.pendingVerifications} en attente
                  </span>
                )}
              </div>
            </Link>

            {/* Certifications */}
            <Link
              href="/admin/certifications"
              className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 group-hover:from-white/20 group-hover:to-white/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-white/20 transition-all duration-300">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 group-hover:text-white transition-colors duration-300 mb-0.5 sm:mb-1">
                  Certifications
                </h3>
                <p className="hidden sm:block text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300 mb-3">
                  Vérifier et approuver
                </p>
                {stats.pendingCertifications > 0 && (
                  <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-amber-100 text-amber-700 group-hover:bg-white/20 group-hover:text-white transition-colors duration-300 mt-1 sm:mt-0">
                    {stats.pendingCertifications} en attente
                  </span>
                )}
              </div>
            </Link>

            {/* Avatars */}
            <Link
              href="/admin/avatars"
              className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-cyan-500 group-hover:from-white/20 group-hover:to-white/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-white/20 transition-all duration-300">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 group-hover:text-white transition-colors duration-300 mb-0.5 sm:mb-1">
                  Avatars
                </h3>
                <p className="hidden sm:block text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300 mb-3">
                  Modérer les photos de profil
                </p>
                {stats.pendingAvatars > 0 && (
                  <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-100 text-blue-700 group-hover:bg-white/20 group-hover:text-white transition-colors duration-300 mt-1 sm:mt-0">
                    {stats.pendingAvatars} en attente
                  </span>
                )}
              </div>
            </Link>

            {/* Articles de blog */}
            <Link
              href="/admin/blog"
              className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 group-hover:from-white/20 group-hover:to-white/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-white/20 transition-all duration-300">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 group-hover:text-white transition-colors duration-300 mb-0.5 sm:mb-1">
                  Blog
                </h3>
                <p className="hidden sm:block text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300 mb-3">
                  Modérer les articles
                </p>
                {stats.pendingBlogPosts > 0 && (
                  <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-purple-100 text-purple-700 group-hover:bg-white/20 group-hover:text-white transition-colors duration-300 mt-1 sm:mt-0">
                    {stats.pendingBlogPosts} en attente
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* Section Gestion */}
        <div className="mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
            <div className="h-1 w-6 sm:w-8 bg-gradient-to-r from-green-600 to-emerald-400 rounded-full"></div>
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900">Gestion</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-4">
            {/* Paiements */}
            <Link
              href="/admin/payments"
              className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 group-hover:from-white/20 group-hover:to-white/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-white/20 transition-all duration-300">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 group-hover:text-white transition-colors duration-300 mb-0.5 sm:mb-1">
                  Paiements
                </h3>
                <p className="hidden sm:block text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300 mb-3">
                  Revenus, commissions, transactions
                </p>
              </div>
            </Link>

            {/* Utilisateurs */}
            <Link
              href="/admin/users"
              className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-400 to-blue-500 group-hover:from-white/20 group-hover:to-white/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-white/20 transition-all duration-300">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 group-hover:text-white transition-colors duration-300 mb-0.5 sm:mb-1">
                  Utilisateurs
                </h3>
                <p className="hidden sm:block text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300 mb-3">
                  Gérer les comptes
                </p>
              </div>
            </Link>

            {/* Feedback */}
            <Link
              href="/admin/feedback"
              className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-400 to-cyan-500 group-hover:from-white/20 group-hover:to-white/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-white/20 transition-all duration-300">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 group-hover:text-white transition-colors duration-300 mb-0.5 sm:mb-1">
                  Feedback
                </h3>
                <p className="hidden sm:block text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300 mb-3">
                  Avis et satisfaction
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200/50 text-center">
          <p className="text-sm text-gray-400">
            neurocare Administration &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
