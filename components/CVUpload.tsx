'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

interface CVUploadProps {
  currentCVUrl: string | null;
  userId: string;
  educatorId: string;
  onCVChange: (newUrl: string | null) => void;
}

export default function CVUpload({ currentCVUrl, userId, educatorId, onCVChange }: CVUploadProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError('');

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      // Vérifier que c'est un PDF
      if (file.type !== 'application/pdf') {
        setError('Seuls les fichiers PDF sont acceptés');
        return;
      }

      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 10MB');
        return;
      }

      setUploading(true);

      // Upload via API route (bypass RLS)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('educatorId', educatorId);

      const response = await fetch('/api/educator-cvs/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'upload');
      }

      onCVChange(result.url);
      showToast('CV téléchargé avec succès !');
    } catch (error: any) {
      console.error('Error uploading CV:', error);
      setError(error.message || 'Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre CV?')) {
      return;
    }

    try {
      setUploading(true);

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('educator_profiles')
        .update({ cv_url: null })
        .eq('id', educatorId);

      if (updateError) {
        throw updateError;
      }

      onCVChange(null);
      showToast('CV supprimé avec succès !');
    } catch (error: any) {
      console.error('Error deleting CV:', error);
      setError(error.message || 'Erreur lors de la suppression');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {currentCVUrl ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 bg-green-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base">CV téléchargé</p>
                <p className="text-xs sm:text-sm text-gray-600">Votre CV est visible sur votre profil public</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <a
                href={currentCVUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium transition text-center"
              >
                Voir
              </a>
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading}
                className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-primary-400 transition-colors">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <label className="cursor-pointer">
            <span className="inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium transition text-sm sm:text-base">
              {uploading ? 'Téléchargement...' : 'Télécharger mon CV (PDF)'}
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">Format PDF uniquement, max 10MB</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
