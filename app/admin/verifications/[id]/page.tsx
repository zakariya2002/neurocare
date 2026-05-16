'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getProfessionByValue, ProfessionConfig } from '@/lib/professions-config';
import { useToast } from '@/components/Toast';
import { Button, Card, Badge, Input } from '@/components/admin/ui';

interface Document {
  id: string;
  document_type: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  verified_at: string | null;
  rejection_reason: string | null;
}

interface EducatorProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  verification_status: string;
  verification_badge: boolean;
  profile_visible: boolean;
  created_at: string;
  admin_notes: string | null;
  interview_scheduled_date: string | null;
  profession_type: string | null;
  rpps_number: string | null;
  diploma_type: string | null;
  cv_url: string | null;
}

const documentLabels: Record<string, string> = {
  diploma: 'Diplôme',
  criminal_record: 'Casier judiciaire B3',
  id_card: 'Pièce d\'identité',
  insurance: 'Assurance RC Pro',
};

export default function EducatorVerificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const educatorId = params.id as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [educator, setEducator] = useState<EducatorProfile | null>(null);
  const [professionConfig, setProfessionConfig] = useState<ProfessionConfig | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [adminNotes, setAdminNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [analyzingDoc, setAnalyzingDoc] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, { analysis: string; confidenceScore: number | null; recommendation: string; analyzedAt: string }>>({});

  useEffect(() => {
    loadData();
  }, [educatorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/verifications/${educatorId}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();

      const educatorData = data.educator;
      setEducator(educatorData);
      setAdminNotes(educatorData.admin_notes || '');
      setScheduledDate(educatorData.interview_scheduled_date ? new Date(educatorData.interview_scheduled_date).toISOString().slice(0, 16) : '');

      const profConfig = getProfessionByValue(educatorData.profession_type || 'educator');
      setProfessionConfig(profConfig || null);

      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const postAction = async (action: string, extra: Record<string, any> = {}) => {
    const res = await fetch(`/api/admin/verifications/${educatorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur serveur');
    }
    return res.json();
  };

  const handleAnalyzeDocument = async (documentType: string, fileUrl: string) => {
    setAnalyzingDoc(documentType);
    try {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, fileUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setAnalyses(prev => ({ ...prev, [documentType]: result }));
      showToast('Analyse terminée', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'analyse', 'error');
    } finally {
      setAnalyzingDoc(null);
    }
  };

  const handleApproveDocument = async (documentId: string, documentType: string) => {
    if (!confirm('Approuver ce document ?')) return;
    setProcessing(true);
    try {
      await postAction('approve_document', { documentId, documentType });
      await loadData();
      showToast('Document approuvé avec succès !');
    } catch (error) {
      console.error('Erreur approbation:', error);
      showToast('Erreur lors de l\'approbation', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectDocument = async (documentId: string, documentType: string) => {
    const reason = rejectionReason[documentId];
    if (!reason || reason.trim() === '') {
      showToast('Veuillez indiquer une raison de refus', 'info');
      return;
    }
    if (!confirm('Refuser ce document ? L\'éducateur devra en uploader un nouveau.')) return;
    setProcessing(true);
    try {
      await postAction('reject_document', { documentId, documentType, reason });
      await loadData();
      setRejectionReason({ ...rejectionReason, [documentId]: '' });
      showToast('Document refusé');
    } catch (error) {
      console.error('Erreur rejet:', error);
      showToast('Erreur lors du rejet', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await postAction('save_notes', { adminNotes, scheduledDate });
      await loadData();
      showToast('Notes sauvegardées avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde notes:', error);
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleMarkInterviewScheduled = async () => {
    if (!scheduledDate) {
      showToast('Veuillez d\'abord renseigner la date du RDV', 'info');
      return;
    }
    if (!confirm('Confirmer que le RDV a été planifié avec l\'éducateur ?')) return;
    setProcessing(true);
    try {
      await postAction('mark_interview_scheduled', { adminNotes, scheduledDate });
      await loadData();
      showToast('RDV marqué comme planifié !');
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveEducator = async () => {
    if (!confirm('APPROUVER DÉFINITIVEMENT cet éducateur ? Il recevra le badge vérifié et sera visible des familles.')) return;
    setProcessing(true);
    try {
      await postAction('approve_educator');
      await loadData();
      showToast('Éducateur vérifié avec succès ! Badge activé.');
    } catch (error) {
      console.error('Erreur approbation finale:', error);
      showToast('Erreur lors de l\'approbation finale', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectInterview = async () => {
    const reason = prompt('Raison du refus de l\'entretien :');
    if (!reason) return;
    if (!confirm('REFUSER DÉFINITIVEMENT cet éducateur suite à l\'entretien ?')) return;
    setProcessing(true);
    try {
      await postAction('reject_interview', { reason });
      await loadData();
      showToast('Éducateur refusé suite à l\'entretien');
    } catch (error) {
      console.error('Erreur rejet entretien:', error);
      showToast('Erreur lors du rejet', 'error');
    } finally {
      setProcessing(false);
    }
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

  if (!educator) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 dark:text-red-400">Éducateur non trouvé</p>
        <Link href="/admin/verifications" className="text-primary-600 dark:text-primary-400 hover:underline mt-4 inline-block">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const getDocBadge = (status: string) => {
    if (status === 'approved') return <Badge variant="success">Approuvé</Badge>;
    if (status === 'rejected') return <Badge variant="danger">Refusé</Badge>;
    return <Badge variant="warning">En attente</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'verified') return <Badge variant="success">Vérifié</Badge>;
    if (status.startsWith('rejected')) return <Badge variant="danger">Refusé</Badge>;
    if (status === 'interview_scheduled') return <Badge variant="purple">Entretien planifié</Badge>;
    if (status === 'documents_verified') return <Badge variant="info">Documents OK</Badge>;
    if (status === 'documents_submitted') return <Badge variant="info">Documents soumis</Badge>;
    return <Badge variant="neutral">{status.replace(/_/g, ' ')}</Badge>;
  };

  const allDocumentsApproved = documents.length === 4 && documents.every(d => d.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/verifications"
            className="text-sm text-gray-500 dark:text-admin-muted-dark hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la liste
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-admin-text-dark mt-1">
            Vérification professionnelle
          </h1>
        </div>
      </div>

      {/* Educator info */}
      <Card padding="lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-admin-text-dark mb-3">
              {educator.first_name} {educator.last_name}
            </h2>
            <div className="space-y-1.5 text-sm text-gray-600 dark:text-admin-muted-dark">
              <p>
                <span className="font-medium">Email :</span>{' '}
                <a href={`mailto:${educator.email}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                  {educator.email}
                </a>
              </p>
              {educator.phone && (
                <p>
                  <span className="font-medium">Téléphone :</span>{' '}
                  <a href={`tel:${educator.phone}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                    {educator.phone}
                  </a>
                </p>
              )}
              <p>
                <span className="font-medium">Inscrit le :</span>{' '}
                {new Date(educator.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-admin-surface-dark-2 rounded-lg border border-gray-200 dark:border-admin-border-dark">
              <p className="font-semibold text-gray-900 dark:text-admin-text-dark mb-2">
                {professionConfig?.label || 'Profession non définie'}
              </p>
              <div className="text-xs text-gray-600 dark:text-admin-muted-dark space-y-1">
                <p>
                  <span className="font-medium">Méthode de vérification :</span>{' '}
                  {professionConfig?.verificationMethod === 'dreets' ? 'DREETS (automatique)' :
                   professionConfig?.verificationMethod === 'rpps' ? 'RPPS + Manuel' : 'Manuelle'}
                </p>
                {educator.rpps_number && (
                  <p>
                    <span className="font-medium">N° RPPS :</span>{' '}
                    <span className="font-mono bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 px-2 py-0.5 rounded">
                      {educator.rpps_number}
                    </span>
                  </p>
                )}
                {professionConfig && (
                  <p>
                    <span className="font-medium">Diplôme attendu :</span> {professionConfig.diplomaDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            {getStatusBadge(educator.verification_status)}
            {educator.verification_badge && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Badge vérifié
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Documents */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-admin-text-dark mb-4">
          Documents soumis ({documents.length}/4)
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {['diploma', 'criminal_record', 'id_card', 'insurance'].map((type) => {
            const doc = documents.find(d => d.document_type === type);
            const baseLabel = documentLabels[type] || type;
            const label = type === 'diploma' && professionConfig
              ? `${baseLabel} — ${professionConfig.label}`
              : baseLabel;

            return (
              <Card key={type} padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-admin-text-dark">{label}</h4>
                  {doc ? getDocBadge(doc.status) : <Badge variant="neutral">Non uploadé</Badge>}
                </div>

                {doc && (
                  <p className="text-xs text-gray-500 dark:text-admin-muted-dark mb-3">
                    Uploadé le {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                  </p>
                )}

                {!doc ? (
                  <div className="text-center py-4 text-gray-500 dark:text-admin-muted-dark text-sm">
                    Document non uploadé
                  </div>
                ) : (
                  <>
                    {/* Aperçu inline du document */}
                    <DocumentPreview filePath={doc.file_url} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(`/api/verification-documents/${doc.file_url}`, '_blank')}
                      >
                        Ouvrir en plein écran
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={analyzingDoc === type}
                        disabled={analyzingDoc !== null}
                        onClick={() => handleAnalyzeDocument(type, doc.file_url)}
                      >
                        Analyser (Claude Vision)
                      </Button>
                    </div>

                    {analyses[type] && (
                      <div className={`mb-3 p-3 rounded-lg border ${
                        analyses[type].recommendation === 'validate'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                          : analyses[type].recommendation === 'reject'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-900 dark:text-admin-text-dark">
                            Analyse Claude Vision
                          </span>
                          <div className="flex items-center gap-2">
                            {analyses[type].confidenceScore !== null && (
                              <Badge
                                variant={
                                  analyses[type].confidenceScore! >= 7 ? 'success'
                                  : analyses[type].confidenceScore! >= 4 ? 'warning'
                                  : 'danger'
                                }
                              >
                                {analyses[type].confidenceScore}/10
                              </Badge>
                            )}
                            <Badge
                              variant={
                                analyses[type].recommendation === 'validate' ? 'success'
                                : analyses[type].recommendation === 'reject' ? 'danger'
                                : 'warning'
                              }
                            >
                              {analyses[type].recommendation === 'validate' ? 'Valider'
                                : analyses[type].recommendation === 'reject' ? 'Rejeter'
                                : 'Vérifier'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-gray-700 dark:text-admin-muted-dark whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                          {analyses[type].analysis}
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-admin-muted-dark mt-2">
                          Analysé le {new Date(analyses[type].analyzedAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    )}

                    {doc.status === 'pending' && (
                      <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-admin-border-dark">
                        <Button
                          variant="success"
                          size="md"
                          fullWidth
                          loading={processing}
                          onClick={() => handleApproveDocument(doc.id, type)}
                        >
                          Approuver
                        </Button>
                        <div className="space-y-2">
                          <Input
                            type="text"
                            placeholder="Raison du refus..."
                            value={rejectionReason[doc.id] || ''}
                            onChange={(e) => setRejectionReason({ ...rejectionReason, [doc.id]: e.target.value })}
                          />
                          <Button
                            variant="danger"
                            size="md"
                            fullWidth
                            loading={processing}
                            onClick={() => handleRejectDocument(doc.id, type)}
                          >
                            Refuser
                          </Button>
                        </div>
                      </div>
                    )}

                    {doc.status === 'rejected' && doc.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-300">
                          <strong>Raison :</strong> {doc.rejection_reason}
                        </p>
                      </div>
                    )}

                    {doc.status === 'approved' && (
                      <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <p className="text-sm text-emerald-800 dark:text-emerald-300">
                          Approuvé le {doc.verified_at && new Date(doc.verified_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* CV */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-admin-text-dark mb-4">
          CV du professionnel
        </h3>
        {educator.cv_url ? (
          <Card padding="md">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-admin-text-dark">Curriculum Vitae</h4>
                <p className="text-xs text-gray-500 dark:text-admin-muted-dark">Document uploadé par le professionnel</p>
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  window.open(
                    educator.cv_url!.startsWith('http')
                      ? educator.cv_url!
                      : `/api/educator-cvs/${educator.cv_url!.replace('educator-cvs/', '')}`,
                    '_blank'
                  )
                }
              >
                Voir le CV
              </Button>
            </div>
          </Card>
        ) : (
          <Card padding="md">
            <p className="text-sm text-gray-500 dark:text-admin-muted-dark text-center py-2">
              Aucun CV uploadé
            </p>
          </Card>
        )}
      </div>

      {/* Phase: documents_verified — schedule interview */}
      {educator.verification_status === 'documents_verified' && (
        <Card padding="lg" className="border-primary-200 dark:border-primary-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-admin-text-dark mb-2">
            Prochaine étape : entretien
          </h3>
          <p className="text-sm text-gray-600 dark:text-admin-muted-dark mb-4">
            Tous les documents sont approuvés. Contactez l&apos;éducateur pour planifier un entretien vidéo de 30 minutes.
          </p>

          <div className="space-y-3 mb-5">
            <div>
              <span className="text-xs font-medium uppercase text-gray-500 dark:text-admin-muted-dark">Email</span>
              <a href={`mailto:${educator.email}`} className="block text-primary-600 dark:text-primary-400 hover:underline font-medium">
                {educator.email}
              </a>
            </div>
            {educator.phone && (
              <div>
                <span className="text-xs font-medium uppercase text-gray-500 dark:text-admin-muted-dark">Téléphone</span>
                <a href={`tel:${educator.phone}`} className="block text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  {educator.phone}
                </a>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-admin-border-dark">
            <h4 className="font-semibold text-gray-900 dark:text-admin-text-dark">Notes administrateur</h4>
            <Input
              type="datetime-local"
              label="Date & heure du RDV planifié"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-admin-text-dark mb-1">
                Notes (contexte, remarques, etc.)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ex: RDV téléphonique prévu le 15/12 à 14h, a mentionné une expérience de 5 ans..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-admin-surface-dark text-gray-900 dark:text-admin-text-dark border-gray-300 dark:border-admin-border-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="secondary"
                loading={savingNotes}
                onClick={handleSaveNotes}
              >
                Sauvegarder
              </Button>
              <Button
                variant="success"
                disabled={!scheduledDate}
                loading={processing}
                onClick={handleMarkInterviewScheduled}
              >
                RDV planifié
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Phase: interview_scheduled — final decision */}
      {educator.verification_status === 'interview_scheduled' && (
        <Card padding="lg" className="border-primary-200 dark:border-primary-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-admin-text-dark mb-3">
            Entretien en cours
          </h3>

          <div className="space-y-3 mb-4">
            <div>
              <span className="text-xs font-medium uppercase text-gray-500 dark:text-admin-muted-dark">Email</span>
              <a href={`mailto:${educator.email}`} className="block text-primary-600 dark:text-primary-400 hover:underline font-medium">
                {educator.email}
              </a>
            </div>
            {educator.phone && (
              <div>
                <span className="text-xs font-medium uppercase text-gray-500 dark:text-admin-muted-dark">Téléphone</span>
                <a href={`tel:${educator.phone}`} className="block text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  {educator.phone}
                </a>
              </div>
            )}
          </div>

          {(educator.admin_notes || educator.interview_scheduled_date) && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-admin-surface-dark-2 border border-gray-200 dark:border-admin-border-dark rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-admin-text-dark mb-2 text-sm">Notes administrateur</h4>
              {educator.interview_scheduled_date && (
                <p className="text-sm text-gray-700 dark:text-admin-muted-dark mb-1">
                  <strong>RDV prévu :</strong>{' '}
                  {new Date(educator.interview_scheduled_date).toLocaleString('fr-FR', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}
                </p>
              )}
              {educator.admin_notes && (
                <p className="text-sm text-gray-700 dark:text-admin-muted-dark">
                  <strong>Notes :</strong> {educator.admin_notes}
                </p>
              )}
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-admin-muted-dark mb-4">
            Après l&apos;entretien, validez ou refusez définitivement cet éducateur.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="success"
              size="lg"
              loading={processing}
              onClick={handleApproveEducator}
            >
              Approuver (badge vérifié)
            </Button>
            <Button
              variant="danger"
              size="lg"
              loading={processing}
              onClick={handleRejectInterview}
            >
              Refuser (définitif)
            </Button>
          </div>
        </Card>
      )}

      {allDocumentsApproved && educator.verification_status === 'documents_submitted' && (
        <Card padding="lg" className="border-emerald-200 dark:border-emerald-800">
          <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
            Tous les documents sont approuvés
          </h3>
          <p className="text-sm text-gray-600 dark:text-admin-muted-dark mb-4">
            Contactez l&apos;éducateur pour planifier l&apos;entretien vidéo.
          </p>
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium uppercase text-gray-500 dark:text-admin-muted-dark">Email</span>
              <a href={`mailto:${educator.email}`} className="block text-primary-600 dark:text-primary-400 hover:underline font-medium">
                {educator.email}
              </a>
            </div>
            {educator.phone && (
              <div>
                <span className="text-xs font-medium uppercase text-gray-500 dark:text-admin-muted-dark">Téléphone</span>
                <a href={`tel:${educator.phone}`} className="block text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  {educator.phone}
                </a>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Aperçu inline d'un document ─────────────────────────────────────────────

function DocumentPreview({ filePath }: { filePath: string }) {
  const src = `/api/verification-documents/${filePath}`;
  const ext = (filePath.split('.').pop() || '').toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'].includes(ext);
  const isPdf = ext === 'pdf';

  if (isImage) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-admin-border-dark bg-gray-50 dark:bg-admin-surface-dark-2"
        title="Ouvrir en plein écran"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Aperçu du document"
          loading="lazy"
          className="block w-full max-h-[420px] object-contain"
        />
      </a>
    );
  }

  if (isPdf) {
    return (
      <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-admin-border-dark bg-gray-50 dark:bg-admin-surface-dark-2">
        <iframe
          src={`${src}#toolbar=0&navpanes=0&view=FitH`}
          title="Aperçu du document"
          loading="lazy"
          className="block w-full h-[420px]"
        />
      </div>
    );
  }

  return (
    <div className="mb-3 p-3 rounded-lg border border-dashed border-gray-300 dark:border-admin-border-dark text-xs text-gray-500 dark:text-admin-muted-dark text-center">
      Format non prévisualisable ({ext || 'inconnu'}) — utiliser « Ouvrir en plein écran »
    </div>
  );
}
