'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  REMINDER_TYPE_LABELS,
  daysUntil,
  formatDateFr,
  urgencyClasses,
  urgencyOf,
  type FamilyAdminReminderRow,
  type ReminderType,
  type ReminderUrgency,
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

// Couleurs par urgence pour la pastille latérale + accents.
const URGENCY_ACCENT: Record<ReminderUrgency, { bar: string; bg: string; text: string }> = {
  red: { bar: '#dc2626', bg: '#fef2f2', text: '#b91c1c' },
  orange: { bar: '#d97706', bg: '#fef3c7', text: '#92400e' },
  green: { bar: '#10b981', bg: '#d1fae5', text: '#047857' },
  expired: { bar: '#9ca3af', bg: '#f3f4f6', text: '#374151' },
  dismissed: { bar: '#d1d5db', bg: '#f9fafb', text: '#6b7280' },
};

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
    <div className="space-y-4 sm:space-y-5">
      <PushOptIn />

      {/* Barre filtres + CTA */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <FilterButton active={filter === 'active'} onClick={() => setFilter('active')} count={counters.active}>
            Actifs
          </FilterButton>
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} count={counters.total}>
            Tous
          </FilterButton>
          <FilterButton active={filter === 'dismissed'} onClick={() => setFilter('dismissed')} count={counters.dismissed}>
            Traités
          </FilterButton>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition hover:opacity-90 shadow-sm"
          style={{ backgroundColor: '#027e7e' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une échéance
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700" role="alert">
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

function FilterButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
        active ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
      }`}
      style={active ? { backgroundColor: '#027e7e' } : undefined}
      aria-pressed={active}
    >
      {children}
      <span
        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full ${
          active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
        }`}
        aria-hidden="true"
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({ filter, onAdd }: { filter: Filter; onAdd: () => void }) {
  if (filter === 'dismissed') {
    return (
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-gray-50">
          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">Aucun rappel marqué comme traité.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
        <svg className="w-9 h-9 sm:w-10 sm:h-10" style={{ color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
        Aucune échéance enregistrée
      </h3>
      <p className="text-sm text-gray-600 mb-5 max-w-md mx-auto">
        {filter === 'all'
          ? 'Ajoutez vos dates de fin de droits MDPH, AEEH, PCH ou autres pour ne plus oublier de renouveler.'
          : 'Ajoutez vos dates de fin de droits MDPH, AEEH, PCH ou autres pour recevoir des rappels avant l’expiration.'}
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition hover:opacity-90 shadow-sm"
        style={{ backgroundColor: '#027e7e' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
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
  const accent = URGENCY_ACCENT[u];
  const days = daysUntil(reminder.expires_at);

  let timeline: { primary: string; secondary: string };
  if (u === 'expired') timeline = { primary: 'Expiré', secondary: 'date passée' };
  else if (u === 'dismissed') timeline = { primary: 'Traité', secondary: '' };
  else if (days === 0) timeline = { primary: 'Aujourd’hui', secondary: '' };
  else if (days === 1) timeline = { primary: '1 jour', secondary: 'restant' };
  else timeline = { primary: `${days}`, secondary: `jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}` };

  return (
    <li className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden">
      <div className="flex">
        {/* Pastille latérale colorée */}
        <span
          aria-hidden="true"
          className="flex-shrink-0 w-1.5 sm:w-2"
          style={{ backgroundColor: accent.bar }}
        />

        <div className="flex-1 min-w-0 p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              {/* Type + badge + enfant */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                  style={{ backgroundColor: '#e6f4f4', color: '#027e7e', borderColor: 'rgba(2,126,126,0.2)' }}
                >
                  {REMINDER_TYPE_LABELS[reminder.type as ReminderType]}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${cls.badge}`}>
                  {cls.label}
                </span>
                {child && (
                  <span className="text-[11px] font-medium text-gray-500">
                    {child.first_name}{child.last_name ? ' ' + child.last_name : ''}
                  </span>
                )}
              </div>

              {/* Libellé / date */}
              {reminder.label ? (
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  {reminder.label}
                </h3>
              ) : (
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  Expire le {formatDateFr(reminder.expires_at)}
                </h3>
              )}
              {reminder.label && (
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Expire le {formatDateFr(reminder.expires_at)}
                </p>
              )}

              {reminder.notes && (
                <p className="text-xs sm:text-sm text-gray-700 mt-2.5 whitespace-pre-line border-l-2 border-gray-200 pl-3 py-0.5">
                  {reminder.notes}
                </p>
              )}
            </div>

            {/* Compteur jours en grand */}
            <div
              className="flex-shrink-0 flex flex-col items-center justify-center rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 min-w-[72px] sm:min-w-[88px]"
              style={{ backgroundColor: accent.bg }}
              aria-label={`${timeline.primary} ${timeline.secondary}`}
            >
              <span className="text-lg sm:text-2xl font-bold leading-tight" style={{ color: accent.text }}>
                {timeline.primary}
              </span>
              {timeline.secondary && (
                <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wide" style={{ color: accent.text }}>
                  {timeline.secondary}
                </span>
              )}
            </div>

            {/* Menu kebab */}
            <ReminderActionsMenu
              busy={busy}
              dismissed={!!reminder.dismissed_at}
              onEdit={onEdit}
              onDismiss={onDismiss}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

function ReminderActionsMenu({
  busy,
  dismissed,
  onEdit,
  onDismiss,
  onDelete,
}: {
  busy: boolean;
  dismissed: boolean;
  onEdit: () => void;
  onDismiss: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Actions"
        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM10 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM10 14a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => { close(); onEdit(); }}
            disabled={busy}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { close(); onDismiss(); }}
            disabled={busy}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" style={{ color: dismissed ? '#6b7280' : '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dismissed ? 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' : 'M5 13l4 4L19 7'} />
            </svg>
            {dismissed ? 'Réactiver' : 'Marquer comme traité'}
          </button>
          <div className="border-t border-gray-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => { close(); onDelete(); }}
            disabled={busy}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
