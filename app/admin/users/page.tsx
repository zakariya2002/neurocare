'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, StatCard, Input } from '@/components/admin/ui';

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

const roleFilters = [
  { value: 'all', label: 'Tous' },
  { value: 'educator', label: 'Pros' },
  { value: 'family', label: 'Familles' },
];

const statusFilters = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'suspended', label: 'Suspendus' },
];

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [stats, setStats] = useState({ totalEducators: 0, totalFamilies: 0, totalUsers: 0 });
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ user: User; action: 'ban' | 'unban' } | null>(null);

  // Compteurs Actifs / Suspendus (calculés côté client à partir des users chargés)
  const activeCount = useMemo(() => users.filter((u) => !u.banned).length, [users]);
  const suspendedCount = useMemo(() => users.filter((u) => u.banned).length, [users]);

  // Liste filtrée selon statusFilter (en plus du role filter déjà appliqué côté API)
  const visibleUsers = useMemo(() => {
    if (statusFilter === 'active') return users.filter((u) => !u.banned);
    if (statusFilter === 'suspended') return users.filter((u) => u.banned);
    return users;
  }, [users, statusFilter]);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark">
          Gestion des utilisateurs
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
          Consulter, rechercher et gérer les comptes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.totalUsers} />
        <StatCard label="Professionnels" value={stats.totalEducators} />
        <StatCard label="Familles" value={stats.totalFamilies} />
        <StatCard label="Actifs" value={activeCount} />
        <StatCard label="Suspendus" value={suspendedCount} />
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 dark:bg-admin-surface-dark-2 rounded-lg p-1">
          {roleFilters.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                roleFilter === opt.value
                  ? 'bg-white dark:bg-admin-surface-dark text-gray-900 dark:text-admin-text-dark shadow-sm'
                  : 'text-gray-500 dark:text-admin-muted-dark hover:text-gray-700 dark:hover:text-admin-text-dark'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-admin-surface-dark-2 rounded-lg p-1">
          {statusFilters.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value as typeof statusFilter)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-white dark:bg-admin-surface-dark text-gray-900 dark:text-admin-text-dark shadow-sm'
                  : 'text-gray-500 dark:text-admin-muted-dark hover:text-gray-700 dark:hover:text-admin-text-dark'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par nom..."
            />
          </div>
          <Button type="submit" variant="primary">Chercher</Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setSearch(''); setSearchInput(''); }}
            >
              Effacer
            </Button>
          )}
        </form>
      </div>

      {/* List */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-admin-border-dark bg-gray-50 dark:bg-admin-surface-dark-2">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase hidden lg:table-cell">Inscription</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-admin-muted-dark uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-admin-border-dark">
              {visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 dark:text-admin-muted-dark">
                    {search ? 'Aucun résultat' : 'Aucun utilisateur'}
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-admin-surface-dark-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-admin-text-dark">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-admin-muted-dark sm:hidden">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-600 dark:text-admin-muted-dark">{user.email}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant={user.role === 'educator' ? 'success' : 'purple'}>
                        {user.role === 'educator' ? 'Pro' : 'Famille'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-500 dark:text-admin-muted-dark">
                        {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.banned ? (
                        <Badge variant="danger">Suspendu</Badge>
                      ) : (
                        <Badge variant="success">Actif</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.banned ? (
                        <Button
                          variant="success"
                          size="sm"
                          loading={processing === user.user_id}
                          onClick={() => setConfirmAction({ user, action: 'unban' })}
                        >
                          Réactiver
                        </Button>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={processing === user.user_id}
                          onClick={() => setConfirmAction({ user, action: 'ban' })}
                        >
                          Suspendre
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de confirmation */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card padding="lg" className="max-w-md w-full">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-admin-text-dark">
                {confirmAction.action === 'ban' ? 'Suspendre ce compte ?' : 'Réactiver ce compte ?'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-admin-muted-dark mt-2">
                <strong className="text-gray-900 dark:text-admin-text-dark">
                  {confirmAction.user.first_name} {confirmAction.user.last_name}
                </strong>
                <br />
                {confirmAction.user.email}
              </p>
              {confirmAction.action === 'ban' && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-3">
                  L&apos;utilisateur ne pourra plus se connecter ni accéder à la plateforme.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setConfirmAction(null)}
              >
                Annuler
              </Button>
              <Button
                variant={confirmAction.action === 'ban' ? 'danger' : 'success'}
                fullWidth
                loading={processing === confirmAction.user.user_id}
                onClick={() => handleAction(confirmAction.user, confirmAction.action)}
              >
                {confirmAction.action === 'ban' ? 'Suspendre' : 'Réactiver'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
