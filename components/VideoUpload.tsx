'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VideoUploadProps {
  educatorId: string;
  currentVideoUrl: string | null;
  currentDuration: number | null;
  onVideoChange: (url: string | null, duration: number | null) => void;
}

const MAX_DURATION_SECONDS = 600; // 10 minutes
const MAX_FILE_SIZE_MB = 500; // 500 MB
const ALLOWED_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

export default function VideoUpload({
  educatorId,
  currentVideoUrl,
  currentDuration,
  onVideoChange
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(currentDuration);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoDuration(currentDuration);
  }, [currentDuration]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateVideo = (file: File): Promise<{ valid: boolean; duration?: number; error?: string }> => {
    return new Promise((resolve) => {
      // Vérifier le format
      if (!ALLOWED_FORMATS.includes(file.type)) {
        resolve({
          valid: false,
          error: 'Format non supporté. Utilisez MP4, WebM, MOV ou AVI.'
        });
        return;
      }

      // Vérifier la taille
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        resolve({
          valid: false,
          error: `Fichier trop volumineux. Maximum ${MAX_FILE_SIZE_MB} MB.`
        });
        return;
      }

      // Vérifier la durée
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;

        if (duration > MAX_DURATION_SECONDS) {
          resolve({
            valid: false,
            error: `Vidéo trop longue (${formatDuration(duration)}). Maximum 10 minutes.`
          });
        } else {
          resolve({ valid: true, duration });
        }
      };

      video.onerror = () => {
        resolve({ valid: false, error: 'Impossible de lire la vidéo. Vérifiez le format.' });
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadProgress(0);

    // Valider la vidéo
    const validation = await validateVideo(file);
    if (!validation.valid) {
      setError(validation.error || 'Erreur de validation');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    try {
      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Upload directement vers Supabase Storage
      // Utilise le user_id comme dossier (correspond aux storage policies RLS)
      const userId = session.user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/presentation-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('educator-videos')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw new Error(uploadError.message || 'Erreur lors de l\'upload');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('educator-videos')
        .getPublicUrl(fileName);

      setUploadProgress(95);
      setVideoDuration(validation.duration || null);

      // Mettre à jour le profil éducateur via l'API
      const updateResponse = await fetch('/api/educator/update-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          educatorId,
          videoUrl: publicUrl,
          videoDuration: validation.duration || 0
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du profil');
      }

      setUploadProgress(100);
      onVideoChange(publicUrl, validation.duration || null);

      // Reset après succès
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);

    } catch (err: any) {
      console.error('Erreur upload vidéo:', err);
      setError(err.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!currentVideoUrl) return;

    setUploading(true);
    setError(null);

    try {
      // Extraire le chemin du fichier
      const urlParts = currentVideoUrl.split('/educator-videos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('educator-videos').remove([filePath]);
      }

      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      // Mettre à jour le profil via l'API
      const updateResponse = await fetch('/api/educator/update-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          educatorId,
          videoUrl: null,
          videoDuration: null
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      setVideoDuration(null);
      onVideoChange(null, null);
      setShowDeleteConfirm(false);

    } catch (err: any) {
      console.error('Erreur suppression vidéo:', err);
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Vidéo actuelle */}
      {currentVideoUrl ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoPreviewRef}
              src={currentVideoUrl}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Vidéo publiée</span>
              {videoDuration && (
                <span className="text-gray-400">• {formatDuration(videoDuration)}</span>
              )}
            </div>

            <div className="flex gap-2">
              <label className="cursor-pointer px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Remplacer
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={uploading}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Zone d'upload */
        <label className={`relative block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          uploading
            ? 'border-teal-300 bg-teal-50'
            : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
        }`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-teal-700 font-medium">Upload en cours...</p>
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{uploadProgress}%</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-medium">
                  Cliquez pour ajouter votre vidéo de présentation
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ou glissez-déposez votre fichier ici
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                <span className="px-2 py-1 bg-gray-100 rounded">MP4</span>
                <span className="px-2 py-1 bg-gray-100 rounded">WebM</span>
                <span className="px-2 py-1 bg-gray-100 rounded">MOV</span>
                <span className="px-2 py-1 bg-gray-100 rounded">Max 10 min</span>
                <span className="px-2 py-1 bg-gray-100 rounded">Max 500 MB</span>
              </div>
            </div>
          )}
        </label>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Conseils */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Conseils pour une bonne vidéo
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Présentez-vous et parlez de votre parcours professionnel</li>
          <li>• Expliquez votre approche et vos méthodes d'accompagnement</li>
          <li>• Filmez dans un endroit calme avec un bon éclairage</li>
          <li>• Parlez clairement et regardez la caméra</li>
          <li>• Durée idéale : 2 à 5 minutes</li>
        </ul>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer la vidéo ?</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
