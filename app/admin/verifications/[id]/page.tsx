'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getProfessionByValue, ProfessionConfig } from '@/lib/professions-config';
import { useToast } from '@/components/Toast';

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
}


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

  const getDocumentInfo = (type: string) => {
    const diplomaLabel = professionConfig
      ? `Diplôme - ${professionConfig.label}`
      : 'Diplôme d\'État';

    const infos: Record<string, { label: string; icon: string }> = {
      diploma: { label: diplomaLabel, icon: '🎓' },
      criminal_record: { label: 'Casier judiciaire B3', icon: '📄' },
      id_card: { label: 'Pièce d\'identité', icon: '🪪' },
      insurance: { label: 'Assurance RC Pro', icon: '🛡️' }
    };
    return infos[type] || { label: type, icon: '📎' };
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!educator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Éducateur non trouvé</p>
          <Link href="/admin/verifications" className="text-primary-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approuvé ✓', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Refusé ✗', color: 'bg-red-100 text-red-800' }
    };
    return badges[status] || badges.pending;
  };

  const allDocumentsApproved = documents.length === 4 && documents.every(d => d.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/admin/verifications" className="text-gray-600 hover:text-primary-600 text-xs sm:text-sm">
                ← Retour
              </Link>
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900">Vérification</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8">
        {/* Informations éducateur */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                {educator.first_name} {educator.last_name}
              </h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p>📧 {educator.email}</p>
                {educator.phone && <p>📞 {educator.phone}</p>}
                <p>📅 Inscrit le {new Date(educator.created_at).toLocaleDateString('fr-FR')}</p>
              </div>

              {/* Informations profession */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">👤</span>
                  <span className="font-semibold text-gray-900">
                    {professionConfig?.label || 'Profession non définie'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Vérification :</span>{' '}
                    {professionConfig?.verificationMethod === 'dreets' ? '🏛️ DREETS (automatique)' :
                     professionConfig?.verificationMethod === 'rpps' ? '🔬 RPPS + Manuel' : '👤 Manuelle'}
                  </p>
                  {educator.rpps_number && (
                    <p>
                      <span className="font-medium">N° RPPS :</span>{' '}
                      <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">{educator.rpps_number}</span>
                    </p>
                  )}
                  {professionConfig && (
                    <p>
                      <span className="font-medium">Diplôme attendu :</span>{' '}
                      {professionConfig.diplomaDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-lg font-bold ${
                educator.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                educator.verification_status.startsWith('rejected') ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {educator.verification_status.replace(/_/g, ' ').toUpperCase()}
              </div>
              {educator.verification_badge && (
                <div className="mt-2 text-green-600 font-semibold">
                  🏅 Badge vérifié
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">📄 Documents soumis ({documents.length}/4)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {['diploma', 'criminal_record', 'id_card', 'insurance'].map((type) => {
              const doc = documents.find(d => d.document_type === type);
              const info = getDocumentInfo(type);
              const statusBadge = doc ? getStatusBadge(doc.status) : null;

              return (
                <div key={type} className={`bg-white rounded-xl md:rounded-2xl shadow-lg border-2 p-3 sm:p-4 md:p-6 ${
                  doc?.status === 'approved' ? 'border-green-300' :
                  doc?.status === 'rejected' ? 'border-red-300' :
                  doc ? 'border-yellow-300' :
                  'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{info.icon}</span>
                      <div>
                        <h4 className="font-bold text-gray-900">{info.label}</h4>
                        {doc && (
                          <p className="text-xs text-gray-500">
                            Uploadé le {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                    {statusBadge && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    )}
                  </div>

                  {!doc ? (
                    <div className="text-center py-4 text-gray-500">
                      ❌ Document non uploadé
                    </div>
                  ) : (
                    <>
                      {/* Bouton voir le document */}
                      <a
                        href={`/api/verification-documents/${doc.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center transition"
                      >
                        👁️ Voir le document
                      </a>

                      {/* Analyse Claude Vision */}
                      <button
                        onClick={() => handleAnalyzeDocument(type, doc.file_url)}
                        disabled={analyzingDoc !== null}
                        className="block w-full mb-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-center transition disabled:opacity-50"
                      >
                        {analyzingDoc === type ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                            Analyse en cours...
                          </span>
                        ) : (
                          '🔍 Analyser avec Claude Vision'
                        )}
                      </button>

                      {/* Résultat de l'analyse */}
                      {analyses[type] && (
                        <div className={`mb-3 p-4 rounded-lg border ${
                          analyses[type].recommendation === 'validate' ? 'bg-green-50 border-green-200' :
                          analyses[type].recommendation === 'reject' ? 'bg-red-50 border-red-200' :
                          'bg-amber-50 border-amber-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-900">
                              🤖 Analyse Claude Vision
                            </span>
                            <div className="flex items-center gap-2">
                              {analyses[type].confidenceScore !== null && (
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  analyses[type].confidenceScore! >= 7 ? 'bg-green-100 text-green-800' :
                                  analyses[type].confidenceScore! >= 4 ? 'bg-amber-100 text-amber-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {analyses[type].confidenceScore}/10
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                analyses[type].recommendation === 'validate' ? 'bg-green-100 text-green-800' :
                                analyses[type].recommendation === 'reject' ? 'bg-red-100 text-red-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {analyses[type].recommendation === 'validate' ? '✓ VALIDER' :
                                 analyses[type].recommendation === 'reject' ? '✗ REJETER' :
                                 '⚠ VÉRIFIER'}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                            {analyses[type].analysis}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2">
                            Analysé le {new Date(analyses[type].analyzedAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      )}

                      {/* Actions si en attente */}
                      {doc.status === 'pending' && (
                        <div className="space-y-3">
                          <button
                            onClick={() => handleApproveDocument(doc.id, type)}
                            disabled={processing}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
                          >
                            ✅ Approuver
                          </button>

                          <div>
                            <input
                              type="text"
                              placeholder="Raison du refus..."
                              value={rejectionReason[doc.id] || ''}
                              onChange={(e) => setRejectionReason({ ...rejectionReason, [doc.id]: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
                            />
                            <button
                              onClick={() => handleRejectDocument(doc.id, type)}
                              disabled={processing}
                              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50"
                            >
                              ❌ Refuser
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Message si refusé */}
                      {doc.status === 'rejected' && doc.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Raison :</strong> {doc.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* Message si approuvé */}
                      {doc.status === 'approved' && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            ✓ Approuvé le {doc.verified_at && new Date(doc.verified_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions globales */}
        {educator.verification_status === 'documents_verified' && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3">
              📞 Prochaine étape : Contacter l'éducateur pour l'entretien
            </h3>
            <p className="text-gray-700 mb-4">
              Tous les documents sont approuvés. Contactez l'éducateur pour planifier manuellement un entretien vidéo de 30 minutes.
            </p>

            <div className="bg-white rounded-lg p-4 shadow space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href={`mailto:${educator.email}`} className="text-lg font-bold text-blue-600 hover:underline">
                    {educator.email}
                  </a>
                </div>
              </div>

              {educator.phone && (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <a href={`tel:${educator.phone}`} className="text-lg font-bold text-blue-600 hover:underline">
                      {educator.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Rappel :</strong> Après l'entretien, revenez ici pour approuver ou refuser définitivement l'éducateur.
              </p>
            </div>

            {/* Section notes admin */}
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-3">📝 Notes administrateur</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📅 Date & heure du RDV planifié
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📄 Notes (contexte, remarques, etc.)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ex: RDV téléphonique prévu le 15/12 à 14h, a mentionné une expérience de 5 ans..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition disabled:opacity-50"
                  >
                    {savingNotes ? 'Sauvegarde...' : '💾 Sauvegarder'}
                  </button>
                  <button
                    onClick={handleMarkInterviewScheduled}
                    disabled={processing || !scheduledDate}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✅ RDV planifié
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  💡 Cliquez sur "RDV planifié" une fois que vous avez confirmé le rendez-vous avec l'éducateur
                </p>
              </div>
            </div>
          </div>
        )}

        {educator.verification_status === 'interview_scheduled' && (
          <div className="bg-purple-50 border-2 border-purple-300 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3">
              📞 Entretien en cours
            </h3>

            <div className="bg-white rounded-lg p-4 shadow space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href={`mailto:${educator.email}`} className="text-lg font-bold text-blue-600 hover:underline">
                    {educator.email}
                  </a>
                </div>
              </div>

              {educator.phone && (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <a href={`tel:${educator.phone}`} className="text-lg font-bold text-blue-600 hover:underline">
                      {educator.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Section notes admin */}
            {educator.admin_notes || educator.interview_scheduled_date ? (
              <div className="mb-4 p-4 bg-white border border-blue-200 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-2">📝 Notes administrateur</h4>
                {educator.interview_scheduled_date && (
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>📅 RDV prévu :</strong>{' '}
                    {new Date(educator.interview_scheduled_date).toLocaleString('fr-FR', {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </p>
                )}
                {educator.admin_notes && (
                  <p className="text-sm text-gray-700">
                    <strong>📄 Notes :</strong> {educator.admin_notes}
                  </p>
                )}
              </div>
            ) : null}

            <p className="text-gray-700 mb-4">
              Après l'entretien, validez ou refusez définitivement cet éducateur.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleApproveEducator}
                disabled={processing}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition disabled:opacity-50"
              >
                ✅ APPROUVER (Badge vérifié)
              </button>
              <button
                onClick={handleRejectInterview}
                disabled={processing}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition disabled:opacity-50"
              >
                ❌ REFUSER (Définitif)
              </button>
            </div>
          </div>
        )}

        {allDocumentsApproved && educator.verification_status === 'documents_submitted' && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
            <h3 className="text-lg font-bold text-green-800 mb-3">
              ✅ Tous les documents sont approuvés !
            </h3>
            <p className="text-gray-700 mb-4">
              Contactez l'éducateur pour planifier l'entretien vidéo.
            </p>

            <div className="bg-white rounded-lg p-4 shadow space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href={`mailto:${educator.email}`} className="text-lg font-bold text-blue-600 hover:underline">
                    {educator.email}
                  </a>
                </div>
              </div>

              {educator.phone && (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <a href={`tel:${educator.phone}`} className="text-lg font-bold text-blue-600 hover:underline">
                      {educator.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
