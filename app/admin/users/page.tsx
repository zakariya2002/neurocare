'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'educator' | 'family';
  location: string;
  created_at: string;
  banned: boolean;
  banned_until: string | null;
  last_sign_in: string | null;
  verification_status?: string;
  subscription_status?: string;
}

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [stats, setStats] = useState({ totalEducators: 0, totalFamilies: 0, totalUsers: 0 });
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ user: User; action: 'ban' | 'unban' } | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!loading) loadData();
  }, [roleFilter, search]);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push('/auth/login'); return; }
    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    try {
      const params = new URLSearchParams({ role: roleFilter });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setUsers(data.users);
      setStats(data.stats);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleAction = async (user: User, action: 'ban' | 'unban') => {
    setProcessing(user.user_id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, action }),
      });
      if (res.ok) await loadData();
    } catch (error) {
      console.error('Erreur action:', error);
    }
    setProcessing(null);
    setConfirmAction(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
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
            <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-indigo-600 to-blue-400 rounded-full"></div>
            <span className="text-xs sm:text-sm font-semibold text-indigo-600 uppercase tracking-wide">Utilisateurs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">Consulter, rechercher et gérer les comptes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
            <p className="text-xs sm:text-sm text-gray-500">Total</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
            <p className="text-xs sm:text-sm text-gray-500">Professionnels</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{stats.totalEducators}</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
            <p className="text-xs sm:text-sm text-gray-500">Familles</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.totalFamilies}</p>
          </div>
        </div>

        {/* Filtres + Recherche */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'all', label: 'Tous' },
              { value: 'educator', label: 'Pros' },
              { value: 'family', label: 'Familles' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRoleFilter(opt.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${roleFilter === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par nom..."
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Chercher
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">
                Effacer
              </button>
            )}
          </form>
        </div>

        {/* Liste */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Inscription</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      {search ? 'Aucun résultat' : 'Aucun utilisateur'}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.role === 'educator' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-purple-400 to-pink-500'}`}>
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-gray-400 sm:hidden">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === 'educator' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                          {user.role === 'educator' ? 'Pro' : 'Famille'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.banned ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Suspendu</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Actif</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user.banned ? (
                          <button
                            onClick={() => setConfirmAction({ user, action: 'unban' })}
                            disabled={processing === user.user_id}
                            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Réactiver
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({ user, action: 'ban' })}
                            disabled={processing === user.user_id}
                            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Suspendre
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200/50 text-center">
          <p className="text-sm text-gray-400">neurocare Administration &copy; {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Modal de confirmation */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${confirmAction.action === 'ban' ? 'bg-red-100' : 'bg-green-100'}`}>
                {confirmAction.action === 'ban' ? (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {confirmAction.action === 'ban' ? 'Suspendre ce compte ?' : 'Réactiver ce compte ?'}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                <strong>{confirmAction.user.first_name} {confirmAction.user.last_name}</strong>
                <br />
                {confirmAction.user.email}
              </p>
              {confirmAction.action === 'ban' && (
                <p className="text-xs text-red-500 mt-3">
                  L&apos;utilisateur ne pourra plus se connecter ni accéder à la plateforme.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleAction(confirmAction.user, confirmAction.action)}
                disabled={processing === confirmAction.user.user_id}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${confirmAction.action === 'ban' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {processing ? 'En cours...' : confirmAction.action === 'ban' ? 'Suspendre' : 'Réactiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
