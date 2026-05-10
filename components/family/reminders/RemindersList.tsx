'use client';

import { useMemo, useState } from 'react';
import {
  REMINDER_TYPE_LABELS,
  daysUntil,
  formatDateFr,
  urgencyClasses,
  urgencyOf,
  type FamilyAdminReminderRow,
  type ReminderType,
} from '@/lib/family/reminders-mdph';
import ReminderModal from './ReminderModal';
import PushOptIn from './PushOptIn';

interface Child {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface Props {
  children: Child[];
  initialReminders: FamilyAdminReminderRow[];
}

type Filter = 'active' | 'all' | 'dismissed';

export default function RemindersList({ children, initialReminders }: Props) {
  const [reminders, setReminders] = useState<FamilyAdminReminderRow[]>(initialReminders);
  const [filter, setFilter] = useState<Filter>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FamilyAdminReminderRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const childById = useMemo(() => {
    const m = new Map<string, Child>();
    for (const c of children) m.set(c.id, c);
    return m;
  }, [children]);

  const visible = useMemo(() => {
    if (filter === 'all') return reminders;
    if (filter === 'dismissed') return reminders.filter((r) => r.dismissed_at);
    return reminders.filter((r) => !r.dismissed_at);
  }, [reminders, filter]);

  const counters = useMemo(() => {
    const total = reminders.length;
    const active = reminders.filter((r) => !r.dismissed_at).length;
    const dismissed = total - active;
    return { total, active, dismissed };
  }, [reminders]);

  const handleOpenCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (r: FamilyAdminReminderRow) => {
    setEditing(r);
    setModalOpen(true);
  };

  const handleSaved = (saved: FamilyAdminReminderRow) => {
    setReminders((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx === -1) return [...prev, saved].sort(byExpiresAsc);
      const copy = [...prev];
      copy[idx] = saved;
      return copy.sort(byExpiresAsc);
    });
    setModalOpen(false);
    setEditing(null);
  };

  const handleDismiss = async (r: FamilyAdminReminderRow) => {
    setBusyId(r.id);
    setError(null);
    try {
      const res = await fetch('/api/family/reminders', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: r.id, action: r.dismissed_at ? 'undismiss' : 'dismiss' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erreur serveur');
      setReminders((prev) => prev.map((p) => (p.id === r.id ? json.reminder : p)));
    } catch (e: any) {
      setError(e?.message || 'Erreur inattendue');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (r: FamilyAdminReminderRow) => {
    if (!confirm('Supprimer définitivement ce rappel ?')) return;
    setBusyId(r.id);
    setError(null);
    try {
      const res = await fetch(`/api/family/reminders?id=${encodeURIComponent(r.id)}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erreur serveur');
      setReminders((prev) => prev.filter((p) => p.id !== r.id));
    } catch (e: any) {
      setError(e?.message || 'Erreur inattendue');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <PushOptIn />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>
            Actifs ({counters.active})
          </FilterButton>
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            Tous ({counters.total})
          </FilterButton>
          <FilterButton active={filter === 'dismissed'} onClick={() => setFilter('dismissed')}>
            Traités ({counters.dismissed})
          </FilterButton>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
          style={{ backgroundColor: '#027e7e' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une échéance
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState filter={filter} onAdd={handleOpenCreate} />
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              child={childById.get(r.child_id)}
              busy={busyId === r.id}
              onEdit={() => handleEdit(r)}
              onDismiss={() => handleDismiss(r)}
              onDelete={() => handleDelete(r)}
            />
          ))}
        </ul>
      )}

      {modalOpen && (
        <ReminderModal
          children={children}
          editing={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function byExpiresAsc(a: FamilyAdminReminderRow, b: FamilyAdminReminderRow): number {
  return a.expires_at.localeCompare(b.expires_at);
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
        active ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
      }`}
      style={active ? { backgroundColor: '#027e7e' } : undefined}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function EmptyState({ filter, onAdd }: { filter: Filter; onAdd: () => void }) {
  if (filter === 'dismissed') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-sm text-gray-600">Aucun rappel marqué comme traité.</p>
      </div>
    );
  }
  if (filter === 'all') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-sm text-gray-600 mb-3">Aucun rappel pour l’instant.</p>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
          style={{ backgroundColor: '#027e7e' }}
        >
          Ajouter une échéance
        </button>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
      <p className="text-sm text-gray-600 mb-3">
        Aucune échéance active. Ajoutez vos dates de fin de droits MDPH, AEEH, PCH ou autres pour
        recevoir des rappels.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
        style={{ backgroundColor: '#027e7e' }}
      >
        Ajouter ma première échéance
      </button>
    </div>
  );
}

function ReminderCard({
  reminder,
  child,
  busy,
  onEdit,
  onDismiss,
  onDelete,
}: {
  reminder: FamilyAdminReminderRow;
  child: Child | undefined;
  busy: boolean;
  onEdit: () => void;
  onDismiss: () => void;
  onDelete: () => void;
}) {
  const u = urgencyOf(reminder);
  const cls = urgencyClasses(u);
  const days = daysUntil(reminder.expires_at);

  let timeline = '';
  if (u === 'expired') timeline = 'Date passée';
  else if (u === 'dismissed') timeline = 'Marqué comme traité';
  else if (days === 0) timeline = 'Aujourd’hui';
  else if (days === 1) timeline = 'Dans 1 jour';
  else timeline = `Dans ${days} jours`;

  return (
    <li className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-2 ${cls.dot}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              {REMINDER_TYPE_LABELS[reminder.type as ReminderType]}
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${cls.badge}`}>
              {cls.label}
            </span>
          </div>

          {reminder.label && (
            <p className="text-sm text-gray-700 mt-0.5">{reminder.label}</p>
          )}

          <p className="text-xs text-gray-500 mt-1">
            {child ? `${child.first_name}${child.last_name ? ' ' + child.last_name : ''} · ` : ''}
            Expire le {formatDateFr(reminder.expires_at)} · {timeline}
          </p>

          {reminder.notes && (
            <p className="text-xs text-gray-600 mt-2 whitespace-pre-line border-l-2 border-gray-200 pl-2">
              {reminder.notes}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={onEdit}
              disabled={busy}
              className="text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Modifier
            </button>
            <button
              onClick={onDismiss}
              disabled={busy}
              className="text-xs font-semibold px-3 py-1.5 rounded-md text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: reminder.dismissed_at ? '#6b7280' : '#027e7e' }}
            >
              {reminder.dismissed_at ? 'Réactiver' : 'Marquer comme traité'}
            </button>
            <button
              onClick={onDelete}
              disabled={busy}
              className="text-xs font-semibold px-3 py-1.5 rounded-md text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
