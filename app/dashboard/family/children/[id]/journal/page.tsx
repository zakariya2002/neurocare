'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isHdsInfraConfigured } from '@/lib/supabase-health';
import FamilyNavbar from '@/components/FamilyNavbar';
import NeuroLoader from '@/components/NeuroLoader';
import { FEATURES } from '@/lib/feature-flags';
import {
  addMonths,
  isoDate,
  startOfMonth,
  type ChildDailyLogRow,
  type ChildMedicationRow,
  type ChildPatternAlertRow,
  type DailyLogPayload,
} from '@/lib/family/journal';
import HdsDevBanner from '@/components/family/journal/HdsDevBanner';
import JournalCalendar from '@/components/family/journal/JournalCalendar';
import DailyLogForm from '@/components/family/journal/DailyLogForm';
import MedicationsManager from '@/components/family/journal/MedicationsManager';
import PatternAlertBanner from '@/components/family/journal/PatternAlertBanner';
import JournalAggregateView from '@/components/family/journal/JournalAggregateView';
import CommentsThread from '@/components/family/journal/CommentsThread';

interface ChildLite {
  id: string;
  first_name: string;
  last_name: string | null;
  family_id: string;
}

type Tab = 'today' | 'calendar' | 'aggregate' | 'medications';

const TAB_ICONS: Record<Tab, string> = {
  today:
    'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9h6m-6 4h6',
  calendar:
    'M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
  aggregate:
    'M9 19V13m0 0V5m0 8h6m6 6V9m0 10h-6m-6 0H3',
  medications:
    'M10.5 20.5a7 7 0 0 1-9.9-9.9l9.9-9.9a7 7 0 0 1 9.9 9.9zM8.5 8.5l7 7',
};

const TAB_LABELS: Record<Tab, string> = {
  today: "Aujourd'hui",
  calendar: 'Calendrier',
  aggregate: 'Synthèse',
  medications: 'Médicaments',
};

export default function JournalPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [child, setChild] = useState<ChildLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => isoDate(new Date()));
  const [monthStart, setMonthStart] = useState<Date>(() => startOfMonth(new Date()));

  const [logs, setLogs] = useState<ChildDailyLogRow[]>([]);
  const [medications, setMedications] = useState<ChildMedicationRow[]>([]);
  const [alerts, setAlerts] = useState<ChildPatternAlertRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Feature flag : 404 si OFF
  useEffect(() => {
    if (!FEATURES.journalBord) notFound();
  }, []);

  const fetchLogs = useCallback(async () => {
    const from = new Date(monthStart);
    from.setDate(1);
    from.setMonth(from.getMonth() - 1);
    const to = new Date(monthStart);
    to.setMonth(to.getMonth() + 2, 0);

    const res = await fetch(
      `/api/family/children/${childId}/journal/logs?from=${isoDate(from)}&to=${isoDate(to)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error('Erreur de chargement du journal.');
    const json = await res.json();
    setLogs((json.logs ?? []) as ChildDailyLogRow[]);
  }, [childId, monthStart]);

  const fetchMedications = useCallback(async () => {
    const res = await fetch(`/api/family/children/${childId}/medications`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Erreur de chargement des médicaments.');
    const json = await res.json();
    setMedications((json.medications ?? []) as ChildMedicationRow[]);
  }, [childId]);

  const fetchAlerts = useCallback(async () => {
    const res = await fetch(`/api/family/children/${childId}/journal/alerts`, {
      cache: 'no-store',
    });
    if (!res.ok) return;
    const json = await res.json();
    setAlerts((json.alerts ?? []) as ChildPatternAlertRow[]);
  }, [childId]);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      setUserId(session.user.id);

      const { data: familyProfile } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (!familyProfile) {
        router.push('/auth/login');
        return;
      }
      setProfile(familyProfile);
      setFamilyId(familyProfile.id);

      const { data: childRow } = await supabase
        .from('child_profiles')
        .select('id, first_name, last_name, family_id')
        .eq('id', childId)
        .eq('family_id', familyProfile.id)
        .maybeSingle();
      if (!childRow) {
        setPageError('Enfant introuvable.');
        setLoading(false);
        return;
      }
      setChild(childRow as ChildLite);

      await Promise.all([fetchLogs(), fetchMedications(), fetchAlerts()]);
    } catch (e: any) {
      setPageError(e?.message ?? 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [childId, router, fetchLogs, fetchMedications, fetchAlerts]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  // Recharger les logs quand le mois change
  useEffect(() => {
    if (!child) return;
    fetchLogs().catch(() => undefined);
  }, [child, fetchLogs]);

  const logsByDate = useMemo(() => {
    const map = new Map<string, ChildDailyLogRow>();
    for (const l of logs) map.set(l.log_date, l);
    return map;
  }, [logs]);

  const selectedLog = logsByDate.get(selectedDate) ?? null;

  const handleSubmitLog = async (payload: DailyLogPayload) => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/family/children/${childId}/journal/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Erreur enregistrement');
      }
      await Promise.all([fetchLogs(), fetchAlerts()]);
    } catch (e: any) {
      setSaveError(e?.message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDismissAlert = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/family/children/${childId}/journal/alerts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      // best-effort
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/family/children/${childId}/journal/pdf`);
      if (!res.ok) throw new Error('Échec génération PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-${child?.first_name ?? 'enfant'}-${isoDate(new Date())}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message ?? 'Erreur PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return <NeuroLoader size="fullscreen" message="Chargement du journal de bord…" />;
  }

  if (pageError && !child) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
        <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-8 w-full flex-1 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600">{pageError}</p>
          <Link
            href="/dashboard/family/children"
            className="inline-flex mt-6 px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: '#027e7e' }}
          >
            Retour aux proches
          </Link>
        </main>
        <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
      </div>
    );
  }

  if (!child || !userId) return null;

  const tabOrder: Tab[] = ['today', 'calendar', 'aggregate', 'medications'];

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />

      <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full flex-1">
        {/* Bandeau HDS pending */}
        <HdsDevBanner visible={!isHdsInfraConfigured} />

        {/* Header de page enfant */}
        <div
          className="rounded-xl md:rounded-2xl shadow-sm border border-gray-100 bg-white overflow-hidden mb-3 sm:mb-4"
        >
          <div className="px-4 sm:px-5 py-3 sm:py-4">
            <Link
              href={`/dashboard/family/children/${childId}/dossier`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-800 transition mb-2"
              aria-label="Retour au profil de l'enfant"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Retour au profil
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0"
                  style={{ backgroundColor: '#027e7e' }}
                  aria-hidden="true"
                >
                  {child.first_name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1
                    className="text-base sm:text-xl md:text-2xl font-bold truncate"
                    style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
                  >
                    Journal de bord
                  </h1>
                  <p className="text-xs sm:text-sm" style={{ color: '#3a9e9e' }}>
                    {child.first_name}
                    {child.last_name ? ` ${child.last_name}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading || logs.length === 0}
                className="self-stretch sm:self-auto inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition hover:opacity-90 shadow-sm"
                style={{ backgroundColor: '#d97706', color: 'white' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
                <span className="hidden xs:inline">{pdfLoading ? 'Génération…' : 'Synthèse 30 jours (PDF)'}</span>
                <span className="xs:hidden">{pdfLoading ? '…' : 'PDF 30j'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pattern alerts juste sous le bandeau HDS */}
        {alerts.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <PatternAlertBanner alerts={alerts} onDismiss={handleDismissAlert} />
          </div>
        )}

        {/* Onglets pills */}
        <div className="mb-3 sm:mb-4">
          <div
            className="flex gap-1.5 overflow-x-auto p-1.5 rounded-xl bg-white shadow-sm border border-gray-100"
            role="tablist"
          >
            {tabOrder.map((t) => {
              const active = activeTab === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-300`}
                  style={
                    active
                      ? {
                          backgroundColor: 'rgba(2, 126, 126, 0.12)',
                          color: '#015c5c',
                        }
                      : {
                          color: '#6b7280',
                          backgroundColor: 'transparent',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        'rgba(217, 119, 6, 0.08)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#92400e';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                    }
                  }}
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={TAB_ICONS[t]} />
                  </svg>
                  <span>{TAB_LABELS[t]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {saveError && (
          <div
            role="alert"
            className="mb-3 sm:mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {saveError}
          </div>
        )}

        {activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <DailyLogForm
                childId={childId}
                userId={userId}
                date={selectedDate}
                initialLog={selectedLog}
                medications={medications.filter((m) => m.active)}
                saving={saving}
                canEdit
                onSubmit={handleSubmitLog}
              />
              <CommentsThread
                childId={childId}
                logId={selectedLog?.id ?? null}
                currentUserId={userId}
              />
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date sélectionnée
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  max={isoDate(new Date())}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    const d = new Date(`${e.target.value}T00:00:00`);
                    if (!Number.isNaN(d.getTime())) setMonthStart(startOfMonth(d));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <JournalCalendar
                monthStart={monthStart}
                logs={logs}
                onPrevMonth={() => setMonthStart((m) => addMonths(m, -1))}
                onNextMonth={() => setMonthStart((m) => addMonths(m, 1))}
                onSelectDate={(d) => setSelectedDate(d)}
                selectedDate={selectedDate}
              />
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <JournalCalendar
              monthStart={monthStart}
              logs={logs}
              onPrevMonth={() => setMonthStart((m) => addMonths(m, -1))}
              onNextMonth={() => setMonthStart((m) => addMonths(m, 1))}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setActiveTab('today');
              }}
              selectedDate={selectedDate}
            />
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <h3
                className="text-sm sm:text-base font-bold mb-2"
                style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
              >
                Comment ça marche ?
              </h3>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-1.5 list-disc pl-5">
                <li>
                  Cliquez sur un jour pour le saisir ou le modifier dans l&apos;onglet
                  <span className="font-semibold"> Aujourd&apos;hui</span>.
                </li>
                <li>
                  La couleur reflète le score global de bien-être que la plateforme estime à partir
                  des éléments que vous saisissez.
                </li>
                <li>
                  Vos données sont privées. Un pro ne peut les voir que si vous l&apos;avez invité au
                  dossier de l&apos;enfant.
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'aggregate' && (
          <JournalAggregateView
            logs={logs}
            rangeLabel="Sur les jours visibles autour du mois courant"
          />
        )}

        {activeTab === 'medications' && (
          <MedicationsManager
            childId={childId}
            medications={medications}
            onChange={() => {
              fetchMedications().catch(() => undefined);
            }}
          />
        )}
      </main>

      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
