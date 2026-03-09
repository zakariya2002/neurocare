'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { uploadAvatar, deleteAvatar, updateProfileAvatar, validateAvatarFile } from '@/lib/avatar';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userId: string;
  profileType: 'educator' | 'family';
  moderationStatus?: 'pending' | 'approved' | 'rejected' | null;
  moderationReason?: string | null;
  onAvatarChange?: (newAvatarUrl: string) => void;
}

export default function AvatarUpload({
  currentAvatarUrl,
  userId,
  profileType,
  moderationStatus,
  moderationReason,
  onAvatarChange,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

    // Valider le fichier
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide');
      return;
    }

    // Créer une preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload automatique
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError('');

    try {
      // Supprimer l'ancien avatar si existant
      if (avatarUrl) {
        await deleteAvatar(avatarUrl);
      }

      // Upload le nouveau fichier
      const uploadResult = await uploadAvatar(file, userId);

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Erreur lors de l\'upload');
      }

      // Mettre à jour le profil avec la nouvelle URL
      const updateResult = await updateProfileAvatar(
        profileType,
        userId,
        uploadResult.url
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Erreur lors de la mise à jour');
      }

      setAvatarUrl(uploadResult.url);
      setSuccess('Photo uploadée avec succès ! En attente de modération.');

      if (onAvatarChange) {
        onAvatarChange(uploadResult.url);
      }

      // Réinitialiser la preview après 2 secondes
      setTimeout(() => {
        setPreviewUrl(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      const deleteResult = await deleteAvatar(avatarUrl);

      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Erreur lors de la suppression');
      }

      // Mettre à jour le profil
      const updateResult = await updateProfileAvatar(profileType, userId, '');

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Erreur lors de la mise à jour');
      }

      setAvatarUrl(null);
      setPreviewUrl(null);
      setSuccess('Photo supprimée avec succès');

      if (onAvatarChange) {
        onAvatarChange('');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || avatarUrl;
  const showModerationBadge = moderationStatus && moderationStatus !== 'approved';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Avatar preview */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 sm:border-4 border-gray-300">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-8 h-8 sm:w-16 sm:h-16 text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>

          {/* Badge de modération */}
          {showModerationBadge && (
            <div
              className={`absolute -bottom-1 -right-1 px-2 py-1 rounded-full text-xs font-semibold ${
                moderationStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : moderationStatus === 'rejected'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {moderationStatus === 'pending' && '⏳ En attente'}
              {moderationStatus === 'rejected' && '❌ Rejetée'}
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex-1 space-y-3 text-center sm:text-left w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition hover:opacity-90"
              style={{ backgroundColor: '#f0879f' }}
            >
              {uploading ? 'Upload en cours...' : avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
              >
                Supprimer
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500">
            JPG, PNG ou WEBP. Maximum 2MB.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Messages d'état */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {success}
        </div>
      )}

      {/* Message de modération rejetée */}
      {moderationStatus === 'rejected' && moderationReason && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-md text-sm">
          <p className="font-semibold mb-1">⚠️ Votre photo a été rejetée</p>
          <p>Raison : {moderationReason}</p>
          <p className="mt-2 text-xs">Veuillez uploader une nouvelle photo conforme.</p>
        </div>
      )}

      {/* Message de modération en attente */}
      {moderationStatus === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
          <p className="font-semibold mb-1">ℹ️ Photo en cours de vérification</p>
          <p className="text-xs">
            Votre photo est en attente de modération. Elle sera visible publiquement après validation.
          </p>
        </div>
      )}
    </div>
  );
}
