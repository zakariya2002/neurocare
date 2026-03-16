'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import EducatorNavbar from '@/components/EducatorNavbar';
import { ocrService, OCRResult } from '@/lib/ocr-service';
import { getProfessionByValue, ProfessionConfig } from '@/lib/professions-config';

type DiplomaStatus = 'pending' | 'verified' | 'rejected';
type DocumentType = 'criminal_record' | 'id_card' | 'insurance';

interface VerificationDocument {
  id: string;
  document_type: DocumentType;
  file_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  verified_at: string | null;
  rejection_reason: string | null;
}

// Liste des régions françaises
const FRENCH_REGIONS = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Provence-Alpes-Côte d\'Azur',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Hauts-de-France',
  'Grand Est',
  'Bretagne',
  'Pays de la Loire',
  'Normandie',
  'Bourgogne-Franche-Comté',
  'Centre-Val de Loire',
];

export default function DiplomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<DocumentType | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [sendingToDREETS, setSendingToDREETS] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [professionConfig, setProfessionConfig] = useState<ProfessionConfig | null>(null);
  const [diplomaFile, setDiplomaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);

  // Données OCR et DREETS
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [diplomaNumber, setDiplomaNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [region, setRegion] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      const { data: educatorProfile } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!educatorProfile) {
        router.push('/dashboard/family');
        return;
      }

      setProfile(educatorProfile);

      // Charger la configuration de la profession
      const profConfig = getProfessionByValue(educatorProfile.profession_type || 'educator');
      setProfessionConfig(profConfig || null);

      // Pré-remplir les champs si déjà saisis
      if (educatorProfile.diploma_number) setDiplomaNumber(educatorProfile.diploma_number);
      if (educatorProfile.diploma_delivery_date) setDeliveryDate(educatorProfile.diploma_delivery_date);
      if (educatorProfile.region) setRegion(educatorProfile.region);

      // Récupérer l'abonnement, signed URL et documents en parallèle
      const parallelPromises: PromiseLike<any>[] = [
        supabase
          .from('subscriptions')
          .select('*')
          .eq('educator_id', educatorProfile.id)
          .in('status', ['active', 'trialing'])
          .limit(1)
          .maybeSingle(),
        supabase
          .from('verification_documents')
          .select('*')
          .eq('educator_id', educatorProfile.id)
          .order('uploaded_at', { ascending: false }),
      ];

      // Si le diplôme existe déjà, générer une signed URL en parallèle
      if (educatorProfile.diploma_url) {
        parallelPromises.push(
          supabase.storage
            .from('diplomas')
            .createSignedUrl(educatorProfile.diploma_url, 3600)
        );
      }

      const [subscriptionResult, docsResult, signedUrlResult] = await Promise.all(parallelPromises);

      setSubscription(subscriptionResult.data);
      setDocuments(docsResult.data || []);

      if (signedUrlResult?.data?.signedUrl) {
        setPreviewUrl(signedUrlResult.data.signedUrl);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Format non supporté. Utilisez JPG, PNG ou PDF.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Le fichier est trop volumineux. Maximum 5MB.' });
      return;
    }

    setDiplomaFile(file);
    setMessage(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
      await runOCRAnalysis(file);
    } else {
      setPreviewUrl(null);
      setMessage({ type: 'info', text: 'PDF sélectionné. L\'analyse OCR sera effectuée après l\'upload.' });
    }
  };

  const runOCRAnalysis = async (file: File) => {
    setAnalyzing(true);
    setMessage({ type: 'info', text: 'Analyse OCR en cours...' });

    try {
      const result = await ocrService.analyzeDiploma(file);
      setOcrResult(result);

      if (result.success) {
        const extractedNumber = ocrService.extractDiplomaNumber(result.text);
        const extractedDate = ocrService.extractDeliveryDate(result.text);

        if (extractedNumber && !diplomaNumber) setDiplomaNumber(extractedNumber);
        if (extractedDate && !deliveryDate) setDeliveryDate(extractedDate);

        if (result.validation.isValid) {
          setMessage({ type: 'success', text: `Document analysé (confiance: ${result.confidence.toFixed(0)}%)` });
        } else {
          setMessage({ type: 'info', text: `Document analysé. Vérification manuelle recommandée.` });
        }
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de l\'analyse OCR.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'analyse.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const uploadDiploma = async () => {
    if (!diplomaFile || !profile) return;

    if (professionConfig?.verificationMethod === 'dreets' && !region) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner la région de délivrance.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Non authentifié');

      const fileExt = diplomaFile.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      if (profile.diploma_url) {
        await supabase.storage.from('diplomas').remove([profile.diploma_url]);
      }

      const { error: uploadError } = await supabase.storage
        .from('diplomas')
        .upload(fileName, diplomaFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const updateData: any = {
        diploma_url: fileName,
        diploma_verification_status: 'pending',
        diploma_submitted_at: new Date().toISOString(),
        diploma_rejected_reason: null,
        diploma_number: diplomaNumber || null,
        diploma_delivery_date: deliveryDate || null,
        region: region,
      };

      if (ocrResult && ocrResult.success) {
        updateData.diploma_ocr_text = ocrResult.text;
        updateData.diploma_ocr_confidence = ocrResult.confidence;
        updateData.diploma_ocr_analysis = ocrService.generateAnalysisReport(ocrResult);
      }

      const { error: updateError } = await supabase
        .from('educator_profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Diplôme envoyé ! Vérification en cours...' });

      if (professionConfig?.verificationMethod === 'dreets') {
        const { data: signedUrlData } = await supabase.storage
          .from('diplomas')
          .createSignedUrl(fileName, 604800);
        if (signedUrlData?.signedUrl) {
          await sendToDREETS(signedUrlData.signedUrl);
        }
      }

      await checkAuth();
      setDiplomaFile(null);
      setOcrResult(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de l\'upload.' });
    } finally {
      setUploading(false);
    }
  };

  const sendToDREETS = async (diplomaUrl: string) => {
    setSendingToDREETS(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const response = await fetch('/api/send-dreets-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          educatorId: profile.id,
          educatorFirstName: profile.first_name,
          educatorLastName: profile.last_name,
          educatorEmail: session.user.email || profile.email || '',
          educatorPhone: profile.phone || '',
          diplomaUrl,
          diplomaNumber,
          deliveryDate,
          region,
          ocrAnalysis: ocrResult ? ocrService.generateAnalysisReport(ocrResult) : undefined
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Diplôme uploadé et demande envoyée à la DREETS !' });
      }
    } catch (error) {
      console.error('Erreur DREETS:', error);
    } finally {
      setSendingToDREETS(false);
    }
  };

  // Gestion des documents de vérification (casier, ID, assurance)
  const handleDocumentUpload = async (documentType: DocumentType, file: File) => {
    if (!profile) return;

    setUploadingDoc(documentType);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${documentType}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const existingDoc = documents.find(d => d.document_type === documentType);

      if (existingDoc) {
        await supabase
          .from('verification_documents')
          .update({
            file_url: fileName,
            status: 'pending',
            uploaded_at: new Date().toISOString(),
            verified_at: null,
            rejection_reason: null
          })
          .eq('id', existingDoc.id);
      } else {
        await supabase
          .from('verification_documents')
          .insert({
            educator_id: profile.id,
            document_type: documentType,
            file_url: fileName,
            status: 'pending'
          });
      }

      await checkAuth();
      const docInfo = getDocumentInfo(documentType);
      setMessage({ type: 'success', text: `${docInfo.label} uploadé avec succès !` });
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'upload' });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDeleteDocument = async (documentId: string, documentType: DocumentType) => {
    const docInfo = getDocumentInfo(documentType);
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${docInfo.label}" ?`)) return;

    try {
      await supabase.from('verification_documents').delete().eq('id', documentId);
      await checkAuth();
      setMessage({ type: 'success', text: `${docInfo.label} supprimé` });
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleViewDocument = async (filePath: string) => {
    const url = `/api/verification-documents/${encodeURIComponent(filePath)}`;
    window.open(url, '_blank');
  };

  const getDocumentInfo = (type: DocumentType) => {
    const infos = {
      criminal_record: {
        label: 'Casier judiciaire B3',
        description: 'Datant de moins de 3 mois',
        icon: '📄',
        help: 'Demandez-le sur www.cjn.justice.gouv.fr (gratuit)'
      },
      id_card: {
        label: 'Pièce d\'identité',
        description: 'CNI ou passeport en cours de validité',
        icon: '🪪',
        help: 'Carte Nationale d\'Identité ou Passeport'
      },
      insurance: {
        label: 'Assurance RC Pro',
        description: 'Attestation en cours de validité',
        icon: '🛡️',
        help: 'Obligatoire pour exercer en libéral'
      }
    };
    return infos[type];
  };

  const getDocumentByType = (type: DocumentType) => documents.find(doc => doc.document_type === type);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
      approved: { label: 'Validé', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Refusé', color: 'bg-red-100 text-red-800' }
    };
    return badges[status] || badges.pending;
  };

  const renderDocumentCard = (type: DocumentType) => {
    const info = getDocumentInfo(type);
    const doc = getDocumentByType(type);
    const status = doc ? getStatusBadge(doc.status) : null;

    return (
      <div key={type} className={`bg-white rounded-xl lg:rounded-2xl border p-3 sm:p-4 lg:p-5 transition-all hover:shadow-md ${
        doc?.status === 'approved' ? 'border-green-300' :
        doc?.status === 'rejected' ? 'border-red-300' :
        doc ? 'border-amber-300' : 'border-gray-200'
      }`}>
        <div className="flex items-start justify-between gap-2 mb-3 lg:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center text-lg sm:text-xl lg:text-2xl flex-shrink-0 ${
              doc?.status === 'approved' ? 'bg-green-100' :
              doc?.status === 'rejected' ? 'bg-red-100' :
              doc ? 'bg-amber-100' : 'bg-gray-100'
            }`}>
              {info.icon}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base truncate">{info.label}</h4>
              <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 truncate">{info.description}</p>
            </div>
          </div>
          {status && (
            <span className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[10px] sm:text-xs lg:text-sm font-medium whitespace-nowrap flex-shrink-0 ${status.color}`}>
              {status.label}
            </span>
          )}
        </div>

        {doc?.rejection_reason && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-800"><strong>Raison :</strong> {doc.rejection_reason}</p>
          </div>
        )}

        {!doc ? (
          <div>
            <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 mb-2 lg:mb-3">{info.help}</p>
            <label className="block">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocumentUpload(type, file);
                }}
                disabled={uploadingDoc !== null}
                className="hidden"
              />
              <div className={`w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                uploadingDoc === type ? 'border-[#41005c] bg-purple-50' : 'border-gray-300 hover:border-[#41005c] hover:bg-purple-50/50'
              }`}>
                {uploadingDoc === type ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-[#41005c]"></div>
                    <span className="text-xs sm:text-sm lg:text-base text-[#41005c]">Upload...</span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm lg:text-base text-gray-600">Télécharger</span>
                )}
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-2 lg:space-y-3">
            <div className="flex items-center justify-between text-[10px] sm:text-xs lg:text-sm text-gray-500">
              <span>Uploadé le {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}</span>
              {doc.file_url && (
                <button
                  onClick={() => doc.file_url && handleViewDocument(doc.file_url)}
                  className="text-[#41005c] font-medium hover:underline"
                >
                  Voir →
                </button>
              )}
            </div>

            {(doc.status === 'pending' || doc.status === 'rejected') && (
              <div className="flex gap-2 lg:gap-3">
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDocumentUpload(type, file);
                    }}
                    disabled={uploadingDoc !== null}
                    className="hidden"
                  />
                  <div className="w-full px-2 sm:px-3 lg:px-4 py-2 lg:py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-center cursor-pointer hover:bg-blue-100 text-[10px] sm:text-xs lg:text-sm text-blue-700 font-medium transition-colors">
                    Remplacer
                  </div>
                </label>
                <button
                  onClick={() => handleDeleteDocument(doc.id, type)}
                  className="px-2 sm:px-3 lg:px-4 py-2 lg:py-2.5 bg-red-50 border border-red-200 rounded-lg text-[10px] sm:text-xs lg:text-sm text-red-700 font-medium hover:bg-red-100 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getDiplomaStatusBadge = (status: DiplomaStatus) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">⏳ Vérification en cours</span>;
      case 'verified':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Diplôme vérifié</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">✗ Non reconnu</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#41005c' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <EducatorNavbar profile={profile} subscription={subscription} />

      <div className="flex-1 max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-3 sm:py-5 md:py-8 lg:py-10 pb-20 sm:pb-8 w-full">
        {/* En-tête avec flèche retour */}
        <div className="mb-3 sm:mb-5 md:mb-8 lg:mb-10">
          {/* Flèche retour - desktop uniquement */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors"
            aria-label="Retour à la page précédente"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs md:text-sm font-medium">Retour</span>
          </button>

          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full flex items-center justify-center p-1" style={{ backgroundColor: '#41005c' }}>
              <img src="/images/icons/diploma.svg" alt="" className="w-full h-full" />
            </div>
            <h1 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold text-gray-900">Vérification</h1>
            <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm lg:text-base mt-1 lg:mt-2">Diplôme et documents obligatoires</p>
          </div>
        </div>

        {/* Message global */}
        {message && (
          <div className={`mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-xl text-xs md:text-sm ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-purple-50 border border-purple-200 text-purple-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Section Diplôme */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm lg:shadow-md border border-gray-100 p-3 sm:p-4 md:p-5 lg:p-8 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4 lg:mb-6">
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold" style={{ color: '#41005c' }}>
              🎓 Mon Diplôme {professionConfig ? `- ${professionConfig.label}` : ''}
            </h2>
            {profile.diploma_verification_status && getDiplomaStatusBadge(profile.diploma_verification_status)}
          </div>

          {profile.diploma_verification_status === 'rejected' && profile.diploma_rejected_reason && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-800"><strong>Raison :</strong> {profile.diploma_rejected_reason}</p>
            </div>
          )}

          {/* Aperçu diplôme existant */}
          {profile.diploma_url && !diplomaFile && previewUrl && (
            <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Diplôme actuel</span>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline" style={{ color: '#41005c' }}>
                  Voir →
                </a>
              </div>
            </div>
          )}

          {/* Upload diplôme */}
          <div className="space-y-4 lg:space-y-5">
            <div>
              <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
                {profile.diploma_url ? 'Remplacer mon diplôme' : 'Uploader mon diplôme'}
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                disabled={analyzing || uploading}
                className="block w-full text-sm lg:text-base text-gray-500 file:mr-4 file:py-2 lg:file:py-2.5 file:px-4 lg:file:px-6 file:rounded-xl file:border-0 file:text-sm lg:file:text-base file:font-semibold file:text-white file:bg-[#41005c] hover:file:opacity-90 file:cursor-pointer"
                style={{ fontSize: '16px' }}
              />
            </div>

            {analyzing && (
              <div className="p-3 lg:p-4 rounded-xl bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-[#41005c]"></div>
                  <span className="text-sm lg:text-base text-[#41005c]">Analyse OCR...</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">N° de diplôme</label>
                <input
                  type="text"
                  value={diplomaNumber}
                  onChange={(e) => setDiplomaNumber(e.target.value)}
                  placeholder="Ex: 123456"
                  className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl text-sm lg:text-base focus:ring-2 focus:ring-[#41005c] focus:border-[#41005c]"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">Date de délivrance</label>
                <input
                  type="text"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  placeholder="Ex: 15/06/2020"
                  className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl text-sm lg:text-base focus:ring-2 focus:ring-[#41005c] focus:border-[#41005c]"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            {professionConfig?.verificationMethod === 'dreets' && (
              <div className="lg:max-w-md">
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                  Région de délivrance <span className="text-red-500">*</span>
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl text-sm lg:text-base focus:ring-2 focus:ring-[#41005c] focus:border-[#41005c]"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Sélectionnez</option>
                  {FRENCH_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <button
              onClick={uploadDiploma}
              disabled={!diplomaFile || uploading || analyzing || (professionConfig?.verificationMethod === 'dreets' && !region)}
              className={`w-full lg:w-auto lg:min-w-[300px] py-3 lg:py-3.5 px-4 lg:px-8 rounded-xl font-medium text-base lg:text-lg transition ${
                !diplomaFile || uploading || analyzing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-white hover:opacity-90 hover:shadow-lg'
              }`}
              style={!diplomaFile || uploading || analyzing ? {} : { backgroundColor: '#41005c' }}
            >
              {uploading || sendingToDREETS ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-white"></div>
                  {sendingToDREETS ? 'Envoi DREETS...' : 'Upload...'}
                </span>
              ) : (
                '📤 Envoyer le diplôme'
              )}
            </button>
          </div>
        </div>

        {/* Section Documents de vérification */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm lg:shadow-md border border-gray-100 p-3 sm:p-4 md:p-5 lg:p-8">
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold mb-2 sm:mb-3 md:mb-4 lg:mb-6" style={{ color: '#41005c' }}>
            📋 Documents complémentaires
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-gray-500 mb-4 lg:mb-6">
            Ces documents sont requis pour compléter votre vérification et être visible sur la plateforme.
          </p>

          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4 lg:gap-6">
            {renderDocumentCard('criminal_record')}
            {renderDocumentCard('id_card')}
            {renderDocumentCard('insurance')}
          </div>
        </div>

        {/* Info box */}
        <div className="mt-3 sm:mt-4 md:mt-6 lg:mt-8 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6" style={{ backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe' }}>
          <h3 className="text-xs sm:text-sm md:text-base font-semibold mb-2 md:mb-3" style={{ color: '#41005c' }}>Pourquoi ces documents ?</h3>
          <ul className="text-[11px] sm:text-xs md:text-sm space-y-1 md:space-y-2" style={{ color: '#5a1a75' }}>
            <li>✓ Sécurité et protection des enfants</li>
            <li>✓ Confiance des familles</li>
            <li>✓ Obligatoire pour être visible sur la plateforme</li>
            <li>✓ Accès aux demandes de rendez-vous</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
