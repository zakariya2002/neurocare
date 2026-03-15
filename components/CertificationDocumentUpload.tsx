'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CertificationDocumentUploadProps {
  certificationId: string;
  onUploadComplete?: (fileUrl: string) => void;
  currentDocumentUrl?: string | null;
}

export default function CertificationDocumentUpload({
  certificationId,
  onUploadComplete,
  currentDocumentUrl
}: CertificationDocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentDocumentUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError('');

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      // Vérifier le type de fichier
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Seuls les fichiers PDF, JPG et PNG sont acceptés');
        return;
      }

      // Vérifier la taille (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('Le fichier ne doit pas dépasser 10MB');
        return;
      }

      // Créer une prévisualisation locale pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLocalPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setLocalPreview(null);
      }

      setSelectedFile(file);
      setSuccess('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sélection du fichier');
    }
  };

  const handleCancelSelection = () => {
    setSelectedFile(null);
    setLocalPreview(null);
    setError('');
    // Reset le input file
    const input = document.getElementById(`file-upload-${certificationId}`) as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Vous devez être connecté');
      }

      // Créer un nom de fichier unique
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${session.user.id}/${certificationId}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('certification-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Erreur upload storage:', uploadError);
        throw uploadError;
      }

      // Obtenir l'URL publique (signée pour 1 an)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('certification-documents')
        .createSignedUrl(filePath, 31536000); // 1 an

      if (signedUrlError) {
        console.error('❌ Erreur création URL signée:', signedUrlError);
        throw new Error(`Erreur URL signée: ${signedUrlError.message}`);
      }

      if (!signedUrlData?.signedUrl) {
        console.error('❌ signedUrl est null ou undefined, data reçue:', signedUrlData);
        throw new Error('Impossible de générer l\'URL du document');
      }

      const signedUrl = signedUrlData.signedUrl;

      // Enregistrer dans la table certification_documents
      const { error: dbError } = await supabase
        .from('certification_documents')
        .insert({
          certification_id: certificationId,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          document_type: 'diploma'
        });

      if (dbError) {
        console.error('❌ Erreur insertion DB:', dbError);
        throw dbError;
      }

      // Mettre à jour la certification avec l'URL du document
      const { error: updateError } = await supabase
        .from('certifications')
        .update({
          document_url: signedUrl
        })
        .eq('id', certificationId);

      if (updateError) {
        console.error('❌ Erreur mise à jour certification:', updateError);
        throw updateError;
      }

      setPreviewUrl(signedUrl);
      setSuccess('✅ Document uploadé avec succès !');

      // Nettoyer la sélection
      setSelectedFile(null);
      setLocalPreview(null);

      if (onUploadComplete) {
        onUploadComplete(signedUrl);
      }

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('❌ Erreur générale upload:', err);
      setError(err.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Récupérer le chemin du fichier depuis la base de données
      const { data: docs } = await supabase
        .from('certification_documents')
        .select('file_path')
        .eq('certification_id', certificationId)
        .single();

      if (docs?.file_path) {
        // Supprimer du storage
        await supabase.storage
          .from('certification-documents')
          .remove([docs.file_path]);
      }

      // Supprimer de la table certification_documents
      await supabase
        .from('certification_documents')
        .delete()
        .eq('certification_id', certificationId);

      // Mettre à jour la certification
      await supabase
        .from('certifications')
        .update({
          document_url: null,
          verification_status: 'pending'
        })
        .eq('id', certificationId);

      setPreviewUrl(null);
      setSuccess('✅ Document supprimé');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded text-sm">
          {success}
        </div>
      )}

      {previewUrl ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Document uploadé</p>
                <p className="text-xs text-gray-500">Le document est en attente de vérification</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                Voir
              </a>
              <button
                onClick={handleDelete}
                disabled={uploading}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : selectedFile ? (
        // Prévisualisation du fichier sélectionné avant upload
        <div className="border-2 border-primary-500 rounded-lg p-6 bg-primary-50">
          <div className="text-center">
            {localPreview ? (
              <div className="mb-4">
                <img src={localPreview} alt="Prévisualisation" className="max-h-64 mx-auto rounded border border-gray-300" />
              </div>
            ) : (
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}

            <p className="text-sm font-medium text-gray-900 mb-1">{selectedFile.name}</p>
            <p className="text-xs text-gray-500 mb-4">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCancelSelection}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Changer
              </button>

              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Valider l&apos;upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Zone de sélection de fichier
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 transition-colors">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div className="mt-4">
              <label htmlFor={`file-upload-${certificationId}`} className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Uploader le diplôme ou l&apos;attestation
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  PDF, JPG ou PNG jusqu&apos;à 10MB
                </span>
                <input
                  id={`file-upload-${certificationId}`}
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
              <button
                onClick={() => document.getElementById(`file-upload-${certificationId}`)?.click()}
                disabled={uploading}
                className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Choisir un fichier
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Important :</strong> Uploadez un scan ou une photo claire de votre diplôme.
              Assurez-vous que toutes les informations (nom, date, organisme émetteur, numéro) sont bien visibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
