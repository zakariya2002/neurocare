'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, StatCard, Input } from '@/components/admin/ui';

interface EngagementRow {
  id: string;
  first_name: string;
  last_name: string;
  location: string | null;
  profession_type: string | null;
  verification_badge: boolean | null;
  profile_visible: boolean | null;
  suspended: boolean;
  created_at: string;
  nb_conversations: number;
  nb_appointments: number;
  total_solicitations: number;
  last_activity: string | null;
}

type Filter = 'all' | 'never' | 'active' | 'inactive_30d';
type Sort = 'solicitations_desc' | 'last_activity_desc' | 'created_asc';

function formatDateFr(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function AdminEducatorsEngagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<EngagementRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('solicitations_desc');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      try {
        const res = await fetch('/api/admin/educators/engagement');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur chargement');
        setRows(data.items || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const filtered = useMemo(() => {
    let r = [...rows];
    const q = search.trim().toLowerCase();
    if (q) {
      r = r.filter((x) =>
        `${x.first_name} ${x.last_name}`.toLowerCase().includes(q) ||
        (x.location || '').toLowerCase().includes(q) ||
        (x.profession_type || '').toLowerCase().includes(q),
      );
    }
    if (filter === 'never') {
      r = r.filter((x) => x.total_solicitations === 0);
    } else if (filter === 'active') {
      r = r.filter((x) => x.total_solicitations > 0);
    } else if (filter === 'inactive_30d') {
      r = r.filter((x) => {
        const d = daysSince(x.last_activity);
        return d === null || d > 30;
      });
    }
    if (sort === 'solicitations_desc') {
      r.sort((a, b) =>
        b.total_solicitations - a.total_solicitations ||
        (new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime()),
      );
    } else if (sort === 'last_activity_desc') {
      r.sort((a, b) =>
        new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime(),
      );
    } else if (sort === 'created_asc') {
      r.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return r;
  }, [rows, search, filter, sort]);

  // Stats globales
  const stats = useMemo(() => {
    const total = rows.length;
    const withSol = rows.filter((r) => r.total_solicitations > 0).length;
    const never = total - withSol;
    const totalMsg = rows.reduce((s, r) => s + r.nb_conversations, 0);
    const totalApt = rows.reduce((s, r) => s + r.nb_appointments, 0);
    return { total, withSol, never, totalMsg, totalApt };
  }, [rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-200 border-t-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-admin-muted-dark">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark">
          Engagement des professionnels
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-admin-muted-dark">
          Volume de sollicitations (messages reçus + demandes de RDV) par pro
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total pros" value={stats.total} />
        <StatCard label="Sollicités" value={stats.withSol} />
        <StatCard label="Jamais sollicités" value={stats.never} />
        <StatCard label="Total messages" value={stats.totalMsg} />
        <StatCard label="Total RDV" value={stats.totalApt} />
      </div>

      {/* Contrôles */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-admin-muted-dark mb-1">
              Recherche
            </label>
            <Input
              placeholder="Nom, ville, profession…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-admin-muted-dark mb-1">
              Filtre
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-admin-border-dark bg-white dark:bg-admin-surface-dark text-sm"
            >
              <option value="all">Tous ({rows.length})</option>
              <option value="never">Jamais sollicités ({stats.never})</option>
              <option value="active">Avec sollicitations ({stats.withSol})</option>
              <option value="inactive_30d">Inactifs depuis 30 jours</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-admin-muted-dark mb-1">
              Tri
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-admin-border-dark bg-white dark:bg-admin-surface-dark text-sm"
            >
              <option value="solicitations_desc">Plus sollicités d&apos;abord</option>
              <option value="last_activity_desc">Dernière activité (récent)</option>
              <option value="created_asc">Inscription (ancien)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Liste */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500 dark:text-admin-muted-dark">
              <tr className="border-b border-gray-200 dark:border-admin-border-dark">
                <th className="text-left py-2 px-3">Pro</th>
                <th className="text-left py-2 px-3">Ville</th>
                <th className="text-center py-2 px-3">Messages</th>
                <th className="text-center py-2 px-3">RDV</th>
                <th className="text-center py-2 px-3">Total</th>
                <th className="text-left py-2 px-3">Dernière activité</th>
                <th className="text-left py-2 px-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const d = daysSince(r.last_activity);
                return (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-admin-border-dark/50 hover:bg-gray-50 dark:hover:bg-admin-surface-dark/50">
                    <td className="py-2 px-3">
                      <a
                        href={`/educator/${r.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 dark:text-admin-text-dark hover:text-primary-600"
                      >
                        {r.first_name} {r.last_name}
                      </a>
                      <div className="text-xs text-gray-500 dark:text-admin-muted-dark">
                        {r.profession_type || '—'}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-admin-text-dark">
                      {r.location || '—'}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-gray-900 dark:text-admin-text-dark">
                      {r.nb_conversations}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-gray-900 dark:text-admin-text-dark">
                      {r.nb_appointments}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-bold ${r.total_solicitations === 0 ? 'text-gray-400' : 'text-primary-600 dark:text-primary-400'}`}>
                        {r.total_solicitations}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-admin-text-dark">
                      {formatDateFr(r.last_activity)}
                      {d !== null && (
                        <div className="text-xs text-gray-500 dark:text-admin-muted-dark">
                          il y a {d} j
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 space-y-1">
                      {r.verification_badge ? (
                        <Badge variant="success">Vérifié</Badge>
                      ) : (
                        <Badge variant="warning">Non vérifié</Badge>
                      )}
                      {r.suspended && <Badge variant="neutral">Suspendu</Badge>}
                      {r.profile_visible === false && <Badge variant="neutral">Masqué</Badge>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-admin-muted-dark">
                    Aucun pro ne correspond à ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
