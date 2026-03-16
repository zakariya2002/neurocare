'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

interface AvatarModeration {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  avatar_moderation_status: string;
  avatar_moderation_reason: string | null;
  created_at: string;
  profile_type: 'educator' | 'family';
}

export default function AdminAvatarsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [avatars, setAvatars] = useState<AvatarModeration[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarModeration | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (loading === false) {
      fetchAvatars();
    }
  }, [filter, loading]);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      router.push('/');
    }
  };

  const fetchAvatars = async () => {
    try {
      const avatarsList: AvatarModeration[] = [];

      // Récupérer les avatars des éducateurs
      let educatorQuery = supabase
        .from('educator_profiles')
        .select('id, user_id, first_name, last_name, avatar_url, avatar_moderation_status, avatar_moderation_reason, created_at')
        .not('avatar_url', 'is', null);

      if (filter !== 'all') {
        educatorQuery = educatorQuery.eq('avatar_moderation_status', filter);
      }

      const { data: educators } = await educatorQuery;

      if (educators) {
        avatarsList.push(
          ...educators.map((edu) => ({
            ...edu,
            profile_type: 'educator' as const
          }))
        );
      }

      // Récupérer les avatars des familles
      let familyQuery = supabase
        .from('family_profiles')
        .select('id, user_id, first_name, last_name, avatar_url, avatar_moderation_status, avatar_moderation_reason, created_at')
        .not('avatar_url', 'is', null);

      if (filter !== 'all') {
        familyQuery = familyQuery.eq('avatar_moderation_status', filter);
      }

      const { data: families } = await familyQuery;

      if (families) {
        avatarsList.push(
          ...families.map((fam) => ({
            ...fam,
            profile_type: 'family' as const
          }))
        );
      }

      // Trier par date de création (plus récent en premier)
      avatarsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAvatars(avatarsList);
    } catch (error) {
      console.error('Erreur récupération avatars:', error);
    }
  };

  const openModal = (avatar: AvatarModeration) => {
    setSelectedAvatar(avatar);
    setReason(avatar.avatar_moderation_reason || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAvatar(null);
    setReason('');
    setModalOpen(false);
  };

  const handleApprove = async () => {
    if (!selectedAvatar) return;

    setProcessing(true);
    try {
      const table = selectedAvatar.profile_type === 'educator' ? 'educator_profiles' : 'family_profiles';

      const { error } = await supabase
        .from(table)
        .update({
          avatar_moderation_status: 'approved',
          avatar_moderation_reason: null
        })
        .eq('id', selectedAvatar.id);

      if (error) throw error;

      showToast('Photo approuvée !');
      closeModal();
      fetchAvatars();
    } catch (error: any) {
      showToast('Erreur: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAvatar) return;
    if (!reason.trim()) {
      showToast('Veuillez indiquer la raison du rejet', 'info');
      return;
    }

    setProcessing(true);
    try {
      const table = selectedAvatar.profile_type === 'educator' ? 'educator_profiles' : 'family_profiles';

      const { error } = await supabase
        .from(table)
        .update({
          avatar_moderation_status: 'rejected',
          avatar_moderation_reason: reason,
          avatar_url: null // Supprimer l'URL de la photo rejetée
        })
        .eq('id', selectedAvatar.id);

      if (error) throw error;

      showToast('Photo rejetée.');
      closeModal();
      fetchAvatars();
    } catch (error: any) {
      showToast('Erreur: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-purple-600/10"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100">
      {/* Navigation moderne */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/admin" className="flex items-center gap-2 sm:gap-3 group">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow">
                  <Image
                    src="/images/logo-neurocare.png"
                    alt="neurocare"
                    width={28}
                    height={28}
                    className="brightness-0 invert w-5 h-5 sm:w-7 sm:h-7"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    neurocare
                  </span>
                  <span className="hidden sm:block text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                    Administration
                  </span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-purple-50 transition-all duration-200"
                title="Retour"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">Retour</span>
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/');
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                title="Déconnexion"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8">
        {/* En-tête avec gradient */}
        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
            <span className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wide">Modération</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Photos de Profil</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">Vérifiez et validez les photos de profil</p>
        </div>

        {/* Filtres - scrollable sur mobile */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 md:mb-6 border border-gray-100 -mx-3 sm:mx-0">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              ⏳ En attente
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              ✅ Approuvées
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              ❌ Rejetées
            </button>
          </div>
        </div>

        {/* Grille des avatars */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {avatars.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl sm:rounded-2xl shadow-sm p-8 sm:p-12 text-center border border-gray-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium text-sm sm:text-base">Aucune photo à afficher</p>
            </div>
          ) : (
            avatars.map((avatar) => (
              <div
                key={`${avatar.profile_type}-${avatar.id}`}
                className="group bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
                onClick={() => openModal(avatar)}
              >
                {/* Photo */}
                <div className="aspect-square relative bg-gray-100">
                  {avatar.avatar_url ? (
                    <img
                      src={avatar.avatar_url}
                      alt={`${avatar.first_name} ${avatar.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="h-16 w-16 sm:h-24 sm:w-24" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Badge de statut */}
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                    {avatar.avatar_moderation_status === 'pending' && (
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-700 text-[10px] sm:text-xs font-semibold rounded-full">
                        ⏳
                      </span>
                    )}
                    {avatar.avatar_moderation_status === 'approved' && (
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-semibold rounded-full">
                        ✅
                      </span>
                    )}
                    {avatar.avatar_moderation_status === 'rejected' && (
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-100 text-red-700 text-[10px] sm:text-xs font-semibold rounded-full">
                        ❌
                      </span>
                    )}
                  </div>
                </div>

                {/* Informations */}
                <div className="p-2 sm:p-4">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    {avatar.first_name} {avatar.last_name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                    {avatar.profile_type === 'educator' ? '👨‍🏫 Pro' : '👨‍👩‍👧 Famille'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">
                    {new Date(avatar.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de modération */}
      {modalOpen && selectedAvatar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl md:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl">
            <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex justify-between items-start">
                <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-gray-900">Modération de photo</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6">

              {/* Photo en grand */}
              <div className="mb-4 sm:mb-6">
                <div className="aspect-square max-w-xs mx-auto relative bg-gray-100 rounded-lg overflow-hidden">
                  {selectedAvatar.avatar_url ? (
                    <img
                      src={selectedAvatar.avatar_url}
                      alt={`${selectedAvatar.first_name} ${selectedAvatar.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="h-24 w-24 sm:h-32 sm:w-32" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations */}
              <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6 text-sm">
                <div>
                  <span className="text-xs sm:text-sm text-gray-600">Utilisateur</span>
                  <p className="font-semibold">{selectedAvatar.first_name} {selectedAvatar.last_name}</p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-600">Type</span>
                  <p className="font-semibold">
                    {selectedAvatar.profile_type === 'educator' ? '👨‍🏫 Pro' : '👨‍👩‍👧 Famille'}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-600">Statut</span>
                  <p className="font-semibold">
                    {selectedAvatar.avatar_moderation_status === 'pending' && '⏳ En attente'}
                    {selectedAvatar.avatar_moderation_status === 'approved' && '✅ Approuvée'}
                    {selectedAvatar.avatar_moderation_status === 'rejected' && '❌ Rejetée'}
                  </p>
                </div>
                {selectedAvatar.avatar_moderation_reason && (
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600">Raison</span>
                    <p className="text-red-600 font-medium text-sm">{selectedAvatar.avatar_moderation_reason}</p>
                  </div>
                )}
              </div>

              {/* Champ de raison pour le rejet */}
              <div className="mb-3 sm:mb-4 md:mb-6">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                  Raison du rejet (si applicable)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Photo inappropriée, de mauvaise qualité, etc."
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold text-sm sm:text-base"
                >
                  {processing ? '...' : '✅ Approuver'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold text-sm sm:text-base"
                >
                  {processing ? '...' : '❌ Rejeter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
