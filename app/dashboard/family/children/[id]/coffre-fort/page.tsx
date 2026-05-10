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
  PRIVACY_REASSURANCE,
  aggregateDocuments,
  type ChildDocumentRow,
  type DocType,
} from '@/lib/family/coffre-fort';
import HdsDevBanner from '@/components/family/coffre-fort/HdsDevBanner';
import VaultSummary from '@/components/family/coffre-fort/VaultSummary';
import DocumentList from '@/components/family/coffre-fort/DocumentList';
import UploadDialog from '@/components/family/coffre-fort/UploadDialog';
import EditDialog from '@/components/family/coffre-fort/EditDialog';
import ShareDialog from '@/components/family/coffre-fort/ShareDialog';
import ActivityDialog from '@/components/family/coffre-fort/ActivityDialog';

interface ChildLite {
  id: string;
  first_name: string;
  last_name: string | null;
  family_id: string;
}

export default function CoffreFortPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [child, setChild] = useState<ChildLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<ChildDocumentRow[]>([]);
  const [filter, setFilter] = useState<DocType | 'all'>('all');
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ChildDocumentRow | null>(null);
  const [shareTarget, setShareTarget] = useState<ChildDocumentRow | null>(null);
  const [activityTarget, setActivityTarget] = useState<ChildDocumentRow | null>(null);

  // Feature flag : 404 si OFF
  useEffect(() => {
    if (!FEATURES.coffreFortSante) notFound();
  }, []);

  const fetchDocuments = useCallback(async () => {
    const res = await fetch(`/api/family/children/${childId}/documents`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? 'Erreur de chargement');
    }
    const json = await res.json();
    setDocuments((json.documents ?? []) as ChildDocumentRow[]);
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

      await fetchDocuments();
    } catch (e: any) {
      setPageError(e?.message ?? 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [childId, router, fetchDocuments]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  const aggregate = useMemo(() => aggregateDocuments(documents), [documents]);

  const filteredDocuments = useMemo(() => {
    if (filter === 'all') return documents;
    return documents.filter((d) => d.doc_type === filter);
  }, [documents, filter]);

  const openSignedUrl = async (doc: ChildDocumentRow, mode: 'view' | 'download') => {
    setBusyDocId(doc.id);
    setActionError(null);
    try {
      const qs = mode === 'download' ? '?download=1' : '';
      const res = await fetch(
        `/api/family/children/${childId}/documents/${doc.id}/url${qs}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Erreur signed URL');
      }
      const json = await res.json();
      const url = json.signedUrl as string;
      if (mode === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.rel = 'noopener noreferrer';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setActionError(err?.message ?? 'Erreur');
    } finally {
      setBusyDocId(null);
    }
  };

  const handleUpload = async (formData: FormData) => {
    const res = await fetch(`/api/family/children/${childId}/documents`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? 'Erreur lors de l\'envoi');
    }
    setUploadOpen(false);
    await fetchDocuments();
  };

  const handleSaveEdit = async (
    docId: string,
    payload: {
      doc_type: DocType;
      doc_subtype: string | null;
      title: string;
      description: string | null;
      issued_at: string | null;
      expires_at: string | null;
      issuer_name: string | null;
      tags: string[];
    }
  ) => {
    const res = await fetch(`/api/family/children/${childId}/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? 'Erreur enregistrement');
    }
    setEditTarget(null);
    await fetchDocuments();
  };

  const handleDelete = async (doc: ChildDocumentRow) => {
    if (!confirm(`Supprimer définitivement « ${doc.title} » ?\nLe fichier et ses partages seront retirés du coffre-fort.`)) {
      return;
    }
    setBusyDocId(doc.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/family/children/${childId}/documents/${doc.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Erreur suppression');
      }
      await fetchDocuments();
    } catch (err: any) {
      setActionError(err?.message ?? 'Erreur');
    } finally {
      setBusyDocId(null);
    }
  };

  if (loading) {
    return <NeuroLoader size="fullscreen" message="Chargement du coffre-fort…" />;
  }

  if (pageError && !child) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="sticky top-0 z-40">
          <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
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

  if (!child || !userId) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      <div className="flex-1 max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 w-full">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          aria-label="Retour"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Retour</span>
        </button>

        <div
          className="rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border mb-4"
          style={{ backgroundColor: '#e6f4f4', borderColor: '#c9eaea' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: '#027e7e' }}
                aria-hidden="true"
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  Coffre-fort — {child.first_name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  {PRIVACY_REASSURANCE}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold inline-flex items-center gap-2"
              style={{ backgroundColor: '#027e7e' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un document
            </button>
          </div>
        </div>

        <HdsDevBanner visible={!isHdsInfraConfigured} />

        {actionError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        <VaultSummary
          aggregate={aggregate}
          activeFilter={filter}
          onFilterChange={setFilter}
        />

        <DocumentList
          documents={filteredDocuments}
          onView={(d) => openSignedUrl(d, 'view')}
          onDownload={(d) => openSignedUrl(d, 'download')}
          onShare={(d) => setShareTarget(d)}
          onEdit={(d) => setEditTarget(d)}
          onDelete={(d) => handleDelete(d)}
          onShowActivity={(d) => setActivityTarget(d)}
          busyDocId={busyDocId}
        />
      </div>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />

      <EditDialog
        open={editTarget !== null}
        document={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
      />

      <ShareDialog
        open={shareTarget !== null}
        document={shareTarget}
        childId={childId}
        onClose={() => setShareTarget(null)}
      />

      <ActivityDialog
        open={activityTarget !== null}
        document={activityTarget}
        childId={childId}
        currentUserId={userId}
        onClose={() => setActivityTarget(null)}
      />

      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
