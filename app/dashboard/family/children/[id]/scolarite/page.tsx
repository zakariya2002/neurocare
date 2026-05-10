'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import NeuroLoader from '@/components/NeuroLoader';
import { FEATURES } from '@/lib/feature-flags';
import {
  SCHOOL_TYPE_LABELS,
  SCHOOL_DEVICE_LABELS,
  SCOLARITE_PRIVACY_HINT,
  defaultSchoolYearOptions,
  isValidSchoolYear,
  sortSchoolYearsDesc,
  type SchoolYearRow,
} from '@/lib/family/scolarite';
import SchoolYearForm, {
  type SchoolYearFormValues,
} from '@/components/family/scolarite/SchoolYearForm';
import SchoolYearSummary from '@/components/family/scolarite/SchoolYearSummary';
import SchoolActorsManager from '@/components/family/scolarite/SchoolActorsManager';

interface ChildLite {
  id: string;
  first_name: string;
  last_name: string | null;
  family_id: string;
}

export default function ScolaritePage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [child, setChild] = useState<ChildLite | null>(null);
  const [years, setYears] = useState<SchoolYearRow[]>([]);
  const [activeYearId, setActiveYearId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState<SchoolYearRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Feature flag : 404 client-side si désactivé
  useEffect(() => {
    if (!FEATURES.scolarite) {
      notFound();
    }
  }, []);

  const sortedYears = useMemo(
    () =>
      [...years].sort((a, b) => b.school_year.localeCompare(a.school_year)),
    [years]
  );

  const activeYear = useMemo(
    () => sortedYears.find((y) => y.id === activeYearId) ?? null,
    [sortedYears, activeYearId]
  );

  const fetchYears = useCallback(async (): Promise<SchoolYearRow[]> => {
    const res = await fetch(`/api/family/children/${childId}/scolarite`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? 'Erreur lors du chargement');
    }
    const json = await res.json();
    return (json.years ?? []) as SchoolYearRow[];
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

      const { data: familyProfile, error: famErr } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (famErr || !familyProfile) {
        router.push('/auth/login');
        return;
      }
      setProfile(familyProfile);

      const { data: childRow, error: childErr } = await supabase
        .from('child_profiles')
        .select('id, first_name, last_name, family_id')
        .eq('id', childId)
        .eq('family_id', familyProfile.id)
        .maybeSingle();
      if (childErr) throw childErr;
      if (!childRow) {
        setPageError('Enfant introuvable.');
        setLoading(false);
        return;
      }
      setChild(childRow as ChildLite);

      const fetched = await fetchYears();
      setYears(fetched);
      if (fetched.length > 0) {
        setActiveYearId(fetched[0].id);
      }
    } catch (e: any) {
      setPageError(e.message ?? 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [childId, router, fetchYears]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  const refreshYears = async (selectId?: string) => {
    setRefreshing(true);
    try {
      const fetched = await fetchYears();
      setYears(fetched);
      if (selectId) {
        setActiveYearId(selectId);
      } else if (fetched.length > 0 && !fetched.some((y) => y.id === activeYearId)) {
        setActiveYearId(fetched[0].id);
      }
    } catch (e: any) {
      setPageError(e.message ?? 'Erreur');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddClick = () => {
    setEditingYear(null);
    setFormError(null);
    setShowForm(true);
  };

  const handleEditClick = (year: SchoolYearRow) => {
    setEditingYear(year);
    setFormError(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingYear(null);
    setFormError(null);
  };

  const handleSubmit = async (payload: SchoolYearFormValues) => {
    setSaving(true);
    setFormError(null);
    try {
      const url = editingYear
        ? `/api/family/children/${childId}/scolarite/${editingYear.id}`
        : `/api/family/children/${childId}/scolarite`;
      const method = editingYear ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Erreur lors de l\'enregistrement');
      }
      const json = await res.json();
      const saved = json.year as SchoolYearRow;
      await refreshYears(saved?.id);
      setShowForm(false);
      setEditingYear(null);
    } catch (e: any) {
      setFormError(e.message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteYear = async (year: SchoolYearRow) => {
    if (
      !confirm(
        `Supprimer l'année ${year.school_year} et tous les acteurs associés ? Cette action est irréversible.`
      )
    )
      return;
    try {
      const res = await fetch(
        `/api/family/children/${childId}/scolarite/${year.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Suppression impossible');
      await refreshYears();
    } catch (e: any) {
      setPageError(e.message ?? 'Erreur');
    }
  };

  if (loading) {
    return <NeuroLoader size="fullscreen" message="Chargement de la scolarité…" />;
  }

  if (pageError && !child) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="sticky top-0 z-40">
          <FamilyNavbar profile={profile} />
        </div>
        <div className="flex-1 max-w-3xl mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600">{pageError}</p>
          <Link
            href="/dashboard/family/children"
            className="inline-flex mt-6 px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: '#027e7e' }}
          >
            Retour aux proches
          </Link>
        </div>
      </div>
    );
  }

  if (!child) return null;

  const childDisplayName = child.first_name;

  // Suggestions d'années à proposer (pour CTA empty state)
  const taken = new Set(years.map((y) => y.school_year));
  const proposedYears = defaultSchoolYearOptions().filter(
    (y) => !taken.has(y) && isValidSchoolYear(y)
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} />
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 w-full">
        {/* Header de page enfant */}
        <div className="rounded-xl md:rounded-2xl shadow-sm border border-gray-100 bg-white overflow-hidden mb-3 sm:mb-4">
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
                  style={{ backgroundColor: '#3a9e9e' }}
                  aria-hidden="true"
                >
                  {child.first_name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: '#3a9e9e' }}>
                    Scolarité
                  </p>
                  <h1
                    className="text-base sm:text-xl md:text-2xl font-bold truncate"
                    style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
                  >
                    Suivi scolaire
                  </h1>
                  <p className="text-xs sm:text-sm" style={{ color: '#3a9e9e' }}>
                    {child.first_name}
                    {child.last_name ? ` ${child.last_name}` : ''}
                  </p>
                </div>
              </div>
              {years.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddClick}
                  className="self-stretch sm:self-auto inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
                  style={{ backgroundColor: '#3a9e9e' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter une année
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Carte d'introduction */}
        <div
          className="rounded-xl md:rounded-2xl shadow-sm border overflow-hidden p-4 sm:p-5 mb-4 sm:mb-6 flex items-start gap-3 sm:gap-4"
          style={{ backgroundColor: '#c9eaea', borderColor: '#a5d4d4' }}
        >
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14v6" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold mb-1" style={{ color: '#015c5c', fontFamily: 'Verdana, sans-serif' }}>
              Centralisez la scolarité de {childDisplayName}
            </p>
            <p className="text-xs sm:text-sm" style={{ color: '#015c5c' }}>
              Établissement, dispositifs (PPS, PAP, PAI…), AESH, ESS et acteurs scolaires.
              Les <strong>documents médicaux</strong> (PAI, PPS) seront stockés dans le coffre-fort sécurisé.
            </p>
          </div>
        </div>

        {pageError && child && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r flex items-start justify-between gap-3">
            <span className="text-sm">{pageError}</span>
            <button onClick={() => setPageError(null)} className="font-bold leading-none" aria-label="Fermer">
              ×
            </button>
          </div>
        )}

        {/* Formulaire (modal/inline) */}
        {showForm && (
          <div className="mb-6 bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-base sm:text-lg font-bold text-gray-900"
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                {editingYear ? `Modifier ${editingYear.school_year}` : 'Ajouter une année scolaire'}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SchoolYearForm
              initial={editingYear}
              existingYears={years.map((y) => y.school_year)}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              saving={saving}
              error={formError}
            />
          </div>
        )}

        {/* Empty state */}
        {!showForm && years.length === 0 && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#c9eaea' }}
              aria-hidden="true"
            >
              <svg className="w-8 h-8" style={{ color: '#015c5c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Aucune année scolaire enregistrée
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
              Centralisez les informations scolaires de {childDisplayName} : école,
              dispositifs (PPS, PAP, PAI…), AESH, équipes de suivi.
            </p>
            <button
              onClick={handleAddClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold shadow-sm hover:opacity-90 hover:shadow-md transition-all"
              style={{ backgroundColor: '#3a9e9e' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter une année
            </button>
            {proposedYears.length > 0 && (
              <p className="text-xs text-gray-400 mt-4">
                Suggestions : {proposedYears.slice(0, 3).join(' · ')}
              </p>
            )}
          </div>
        )}

        {/* Liste années + détail */}
        {!showForm && years.length > 0 && (
          <>
            {/* Onglets années (pills) */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 mb-3 sm:mb-4 md:mb-6 overflow-hidden p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs sm:text-sm text-gray-600 font-bold uppercase tracking-wider">
                  Années scolaires
                </p>
                <span className="text-[11px] text-gray-400">
                  {years.length} année{years.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sélectionner une année scolaire">
                {sortedYears.map((y) => {
                  const isActive = activeYearId === y.id;
                  const subtitle = y.school_name
                    ? y.school_name
                    : y.school_type
                      ? SCHOOL_TYPE_LABELS[y.school_type]
                      : 'Non renseigné';
                  return (
                    <button
                      key={y.id}
                      onClick={() => setActiveYearId(y.id)}
                      role="tab"
                      aria-selected={isActive}
                      aria-current={isActive ? 'page' : undefined}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3a9e9e]/40"
                      style={
                        isActive
                          ? { backgroundColor: '#c9eaea', color: '#015c5c', borderColor: '#3a9e9e' }
                          : { backgroundColor: 'white', color: '#4b5563', borderColor: '#e5e7eb' }
                      }
                      title={subtitle}
                    >
                      <span style={{ fontFamily: 'Verdana, sans-serif' }}>{y.school_year}</span>
                      <span
                        className="hidden sm:inline-block max-w-[120px] truncate text-[11px] font-normal opacity-75"
                      >
                        · {subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Détail année active */}
            {activeYear && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
                    <div className="min-w-0">
                      <p
                        className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5"
                        style={{ color: '#3a9e9e' }}
                      >
                        Année active
                      </p>
                      <h2
                        className="text-base sm:text-xl font-bold text-gray-900"
                        style={{ fontFamily: 'Verdana, sans-serif' }}
                      >
                        {activeYear.school_year}
                      </h2>
                      {activeYear.school_name && (
                        <p className="text-sm text-gray-600 truncate">
                          {activeYear.school_name}
                          {activeYear.level ? ` · ${activeYear.level}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEditClick(activeYear)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition border"
                        style={{ color: '#015c5c', borderColor: '#c9eaea', backgroundColor: '#e6f4f4' }}
                        title="Modifier l'année"
                        aria-label="Modifier l'année"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="hidden sm:inline">Modifier</span>
                      </button>
                      <button
                        onClick={() => handleDeleteYear(activeYear)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                        title="Supprimer l'année"
                        aria-label="Supprimer l'année"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <SchoolYearSummary year={activeYear} />
                </div>

                {/* Acteurs scolaires */}
                <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-6">
                  <SchoolActorsManager childId={childId} yearId={activeYear.id} />
                </div>

                {/* Historique des années en pills */}
                {sortedYears.length > 1 && (
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider"
                      >
                        Historique des années
                      </h3>
                      <span className="text-[11px] text-gray-400">
                        Cliquez pour basculer
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sortedYears.map((y) => {
                        const isActive = y.id === activeYearId;
                        const summary = [
                          y.school_name ?? 'Établissement non renseigné',
                          y.level,
                          y.devices.length > 0
                            ? y.devices.map((d) => SCHOOL_DEVICE_LABELS[d]).join(', ')
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ');
                        return (
                          <button
                            key={y.id}
                            onClick={() => setActiveYearId(y.id)}
                            className="group flex items-start gap-2.5 px-3 py-2 rounded-xl border text-left transition-all hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3a9e9e]/40"
                            style={
                              isActive
                                ? { backgroundColor: '#c9eaea', borderColor: '#3a9e9e' }
                                : { backgroundColor: '#fafafa', borderColor: '#e5e7eb' }
                            }
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <span
                              className="inline-block w-2 h-2 rounded-full mt-2 flex-shrink-0"
                              style={{ backgroundColor: isActive ? '#015c5c' : '#9ca3af' }}
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <p
                                className="text-sm font-bold"
                                style={{
                                  color: isActive ? '#015c5c' : '#1f2937',
                                  fontFamily: 'Verdana, sans-serif',
                                }}
                              >
                                {y.school_year}
                              </p>
                              <p
                                className="text-[11px] max-w-[200px] truncate"
                                style={{ color: isActive ? '#015c5c' : '#6b7280' }}
                              >
                                {summary || 'Aucune information'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {refreshing && (
          <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs text-gray-600">
            Mise à jour…
          </div>
        )}
      </div>

      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
