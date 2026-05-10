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
        {/* Retour + header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
            aria-label="Retour"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Retour</span>
          </button>

          <div
            className="rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-primary-100"
            style={{ backgroundColor: '#e6f4f4' }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium uppercase tracking-wide" style={{ color: '#3a9e9e' }}>
                    Scolarité
                  </p>
                  <h1
                    className="text-lg sm:text-xl md:text-2xl font-bold truncate"
                    style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
                  >
                    {childDisplayName}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                    {SCOLARITE_PRIVACY_HINT}
                  </p>
                </div>
              </div>
              <Link
                href={`/dashboard/family/children/${childId}/dossier`}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-semibold hover:bg-primary-50 transition shadow-sm whitespace-nowrap"
                style={{ color: '#027e7e' }}
              >
                Voir le dossier
              </Link>
            </div>
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
          <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 p-6 sm:p-10 text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}
            >
              <svg className="w-8 h-8" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Aucune année scolaire enregistrée
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
              Centralisez les informations de scolarité de {childDisplayName} : école,
              dispositifs (PPS, PAP, PAI…), AESH, équipes de suivi.
            </p>
            <button
              onClick={handleAddClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition"
              style={{ backgroundColor: '#027e7e' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
            {/* Onglets années */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 mb-3 sm:mb-4 md:mb-6 overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100">
                <p className="text-xs sm:text-sm text-gray-600 font-semibold uppercase tracking-wide pl-1">
                  Années scolaires
                </p>
                <button
                  onClick={handleAddClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white hover:opacity-90 transition shadow-sm"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter une année
                </button>
              </div>
              <div className="flex overflow-x-auto scrollbar-hide">
                {sortedYears.map((y) => (
                  <button
                    key={y.id}
                    onClick={() => setActiveYearId(y.id)}
                    className={`flex flex-col items-start px-4 py-3 border-b-2 transition flex-shrink-0 min-w-[140px] text-left ${
                      activeYearId === y.id ? '' : 'border-transparent'
                    }`}
                    style={
                      activeYearId === y.id
                        ? { borderColor: '#027e7e', backgroundColor: 'rgba(2, 126, 126, 0.04)' }
                        : {}
                    }
                  >
                    <span
                      className="text-sm font-bold"
                      style={{
                        color: activeYearId === y.id ? '#027e7e' : '#374151',
                        fontFamily: 'Verdana, sans-serif',
                      }}
                    >
                      {y.school_year}
                    </span>
                    <span className="text-[11px] text-gray-500 truncate w-full">
                      {y.school_name
                        ? y.school_name
                        : y.school_type
                          ? SCHOOL_TYPE_LABELS[y.school_type]
                          : 'Non renseigné'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Détail année active */}
            {activeYear && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h2
                        className="text-base sm:text-xl font-bold text-gray-900"
                        style={{ fontFamily: 'Verdana, sans-serif' }}
                      >
                        Année {activeYear.school_year}
                      </h2>
                      {activeYear.school_name && (
                        <p className="text-sm text-gray-600">{activeYear.school_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(activeYear)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                        style={{ color: '#027e7e' }}
                        title="Modifier l'année"
                        aria-label="Modifier l'année"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteYear(activeYear)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                        title="Supprimer l'année"
                        aria-label="Supprimer l'année"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <SchoolYearSummary year={activeYear} />
                </div>

                {/* Acteurs scolaires */}
                <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6">
                  <SchoolActorsManager childId={childId} yearId={activeYear.id} />
                </div>

                {/* Timeline / historique */}
                {sortedYears.length > 1 && (
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6">
                    <h3
                      className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4"
                    >
                      Historique des années
                    </h3>
                    <ol className="relative border-l-2 border-gray-200 ml-2 space-y-4">
                      {sortedYears.map((y) => {
                        const isActive = y.id === activeYearId;
                        return (
                          <li key={y.id} className="ml-4 sm:ml-6">
                            <span
                              className="absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full border-2 border-white"
                              style={{
                                backgroundColor: isActive ? '#027e7e' : '#cbd5e1',
                              }}
                              aria-hidden="true"
                            />
                            <button
                              onClick={() => setActiveYearId(y.id)}
                              className="text-left w-full group"
                            >
                              <p
                                className="text-sm font-bold"
                                style={{
                                  color: isActive ? '#027e7e' : '#1f2937',
                                  fontFamily: 'Verdana, sans-serif',
                                }}
                              >
                                {y.school_year}
                              </p>
                              <p className="text-xs text-gray-500">
                                {y.school_name ?? 'Établissement non renseigné'}
                                {y.level ? ` · ${y.level}` : ''}
                                {y.devices.length > 0
                                  ? ` · ${y.devices.map((d) => SCHOOL_DEVICE_LABELS[d]).join(', ')}`
                                  : ''}
                              </p>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
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
