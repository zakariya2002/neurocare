'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { getCurrentPosition, reverseGeocode } from '@/lib/geolocation';
import AvatarUpload from '@/components/AvatarUpload';
import FamilyNavbar from '@/components/FamilyNavbar';
import CityAutocomplete from '@/components/CityAutocomplete';

export default function FamilyProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarModerationStatus, setAvatarModerationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [avatarModerationReason, setAvatarModerationReason] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    phone: '',
    location: '',
    relationship: 'parent',
    specific_needs: '',
    preferred_certifications: [] as string[],
    budget_min: '',
    budget_max: '',
    show_email: false,
    show_phone: false,
    sms_reminders_enabled: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);

      // Récupérer le profil famille
      const { data: profile } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profile) {
        setProfile(profile);
        setFamilyId(profile.id);
        setProfileData({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          gender: profile.gender || '',
          phone: profile.phone || '',
          location: profile.location || '',
          relationship: profile.relationship || 'parent',
          specific_needs: (profile.specific_needs || []).join(', '),
          preferred_certifications: profile.preferred_certifications || [],
          budget_min: profile.budget_min?.toString() || '',
          budget_max: profile.budget_max?.toString() || '',
          show_email: profile.show_email || false,
          show_phone: profile.show_phone || false,
          sms_reminders_enabled: profile.sms_reminders_enabled !== false,
        });

        // Charger les données d'avatar
        setAvatarUrl(profile.avatar_url || null);
        setAvatarModerationStatus(profile.avatar_moderation_status || null);
        setAvatarModerationReason(profile.avatar_moderation_reason || null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Utilisateur non connecté');
      }

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('family_profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          gender: profileData.gender || null,
          phone: profileData.phone || null,
          location: profileData.location,
          relationship: profileData.relationship,
          specific_needs: profileData.specific_needs.split(',').map(s => s.trim()).filter(Boolean),
          preferred_certifications: profileData.preferred_certifications,
          budget_min: profileData.budget_min ? parseFloat(profileData.budget_min) : null,
          budget_max: profileData.budget_max ? parseFloat(profileData.budget_max) : null,
          show_email: profileData.show_email,
          show_phone: profileData.show_phone,
          sms_reminders_enabled: profileData.sms_reminders_enabled,
        })
        .eq('user_id', session.user.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess('Profil mis à jour avec succès !');

      // Rediriger vers le dashboard après 1 seconde
      setTimeout(() => {
        router.push('/dashboard/family');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
      setSaving(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setGeolocating(true);
    try {
      const position = await getCurrentPosition();
      const address = await reverseGeocode(position.latitude, position.longitude);

      if (address) {
        setProfileData({ ...profileData, location: address });
        setSuccess('Localisation mise à jour !');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Impossible de déterminer votre adresse. Veuillez la saisir manuellement.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la géolocalisation');
      setTimeout(() => setError(''), 3000);
    } finally {
      setGeolocating(false);
    }
  };

  const handleCertificationToggle = (cert: string) => {
    const current = profileData.preferred_certifications;
    if (current.includes(cert)) {
      setProfileData({
        ...profileData,
        preferred_certifications: current.filter(c => c !== cert),
      });
    } else {
      setProfileData({
        ...profileData,
        preferred_certifications: [...current, cert],
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#027e7e' }}></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      setError('Veuillez taper exactement "SUPPRIMER" pour confirmer');
      return;
    }

    if (!userId) {
      setError('Erreur: utilisateur non identifié');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      await signOut();
      router.push('/?deleted=true');
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      setError(err.message || 'Erreur lors de la suppression du compte');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navbar teal */}
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8">
        {/* En-tête avec flèche retour */}
        <div className="mb-3 sm:mb-4 md:mb-6">
          {/* Flèche retour */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            aria-label="Retour à la page précédente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Retour</span>
          </button>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center p-1" style={{ backgroundColor: profileData.gender === 'female' ? '#f0879f' : '#027e7e' }}>
              <img src={profileData.gender === 'female' ? '/images/icons/profile-female.svg' : '/images/icons/profile-male.svg'} alt="" className="w-full h-full" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mon profil</h1>
            <p className="text-gray-500 text-sm mt-1">Gérez vos informations et préférences</p>
          </div>
        </div>

        {error && (
          <div
            className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded"
            role="alert"
            aria-live="polite"
          >
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
          <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-gray-100">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Informations personnelles</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-2">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Vos données personnelles sont protégées conformément au RGPD. Toute modification est enregistrée de manière sécurisée.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Photo de profil */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-3">Photo de profil</label>
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                userId={userId || ''}
                profileType="family"
                moderationStatus={avatarModerationStatus}
                moderationReason={avatarModerationReason}
                onAvatarChange={(newUrl) => setAvatarUrl(newUrl)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                <input
                  type="text"
                  required
                  aria-required="true"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  required
                  aria-required="true"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                />
              </div>
            </div>

            {/* Sélection du genre */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-3">Genre</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, gender: 'male' })}
                  className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    profileData.gender === 'male'
                      ? 'border-[#027e7e] bg-[#027e7e]/10'
                      : 'border-gray-200 hover:border-[#027e7e]/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    profileData.gender === 'male' ? 'bg-[#027e7e]' : 'bg-gray-100'
                  }`}>
                    <img src="/images/icons/profile-male.svg" alt="" className="w-8 h-8" />
                  </div>
                  <span className={`font-medium ${
                    profileData.gender === 'male' ? 'text-[#027e7e]' : 'text-gray-700'
                  }`}>Homme</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, gender: 'female' })}
                  className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    profileData.gender === 'female'
                      ? 'border-[#f0879f] bg-[#f0879f]/10'
                      : 'border-gray-200 hover:border-[#f0879f]/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    profileData.gender === 'female' ? 'bg-[#f0879f]' : 'bg-gray-100'
                  }`}>
                    <img src="/images/icons/profile-female.svg" alt="" className="w-8 h-8" />
                  </div>
                  <span className={`font-medium ${
                    profileData.gender === 'female' ? 'text-[#f0879f]' : 'text-gray-700'
                  }`}>Femme</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                style={{ '--tw-ring-color': '#027e7e' } as any}
              />
            </div>

            {/* Paramètres de confidentialité */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Paramètres de confidentialité</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choisissez les informations de contact que vous souhaitez partager avec les éducateurs
              </p>
              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={profileData.show_phone}
                    onChange={(e) => setProfileData({ ...profileData, show_phone: e.target.checked })}
                    className="h-4 w-4 border-gray-300 rounded mt-0.5"
                    style={{ accentColor: '#027e7e' }}
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">Afficher mon numéro de téléphone</span>
                    <span className="block text-gray-500 mt-1">Les éducateurs pourront voir votre téléphone</span>
                  </span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={profileData.show_email}
                    onChange={(e) => setProfileData({ ...profileData, show_email: e.target.checked })}
                    className="h-4 w-4 border-gray-300 rounded mt-0.5"
                    style={{ accentColor: '#027e7e' }}
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">Afficher mon adresse e-mail</span>
                    <span className="block text-gray-500 mt-1">Les éducateurs pourront voir votre e-mail</span>
                  </span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={profileData.sms_reminders_enabled}
                    onChange={(e) => setProfileData({ ...profileData, sms_reminders_enabled: e.target.checked })}
                    className="h-4 w-4 border-gray-300 rounded mt-0.5"
                    style={{ accentColor: '#027e7e' }}
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">Recevoir les rappels par SMS</span>
                    <span className="block text-gray-500 mt-1">Vous recevrez un SMS 24h et 1h avant chaque rendez-vous (numéro requis)</span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Localisation *</label>
              <div className="flex gap-2">
                <CityAutocomplete
                  value={profileData.location}
                  onChange={(val) => setProfileData({ ...profileData, location: val })}
                  required
                  className="flex-1 border border-gray-300 rounded-lg shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={geolocating}
                  aria-busy={geolocating}
                  aria-label="Utiliser ma position actuelle"
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition hover:opacity-90"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  {geolocating ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" aria-hidden="true"></div>
                      <span className="hidden sm:inline">Localisation...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="hidden sm:inline">Ma position</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Vous êtes *</label>
              <select
                value={profileData.relationship}
                onChange={(e) => setProfileData({ ...profileData, relationship: e.target.value })}
                aria-required="true"
                className="w-full border border-gray-300 rounded-lg shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                style={{ '--tw-ring-color': '#027e7e' } as any}
              >
                <option value="parent">Parent</option>
                <option value="guardian">Tuteur</option>
                <option value="self">Personne avec TND</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Besoins spécifiques</label>
              <textarea
                rows={3}
                placeholder="Ex: Communication non verbale, Gestion des comportements, Compétences sociales"
                value={profileData.specific_needs}
                onChange={(e) => setProfileData({ ...profileData, specific_needs: e.target.value })}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                style={{ '--tw-ring-color': '#027e7e' } as any}
              />
              <p className="mt-1 text-sm text-gray-500">Séparez les besoins par des virgules</p>
            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Budget minimum (€/h)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={profileData.budget_min}
                  onChange={(e) => setProfileData({ ...profileData, budget_min: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Budget maximum (€/h)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={profileData.budget_max}
                  onChange={(e) => setProfileData({ ...profileData, budget_max: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="px-5 py-2.5 md:px-6 md:py-3 text-xs sm:text-sm md:text-base text-white rounded-lg disabled:opacity-50 font-semibold transition hover:opacity-90 shadow-md"
                style={{ backgroundColor: '#027e7e' }}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>

        {/* Export des données RGPD */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 mt-3 sm:mt-4 md:mt-6">
          <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter mes données (RGPD)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Conformément au RGPD, vous pouvez télécharger une copie de toutes vos données personnelles au format JSON.
            </p>
            <a
              href="/api/export-data"
              download
              aria-label="Télécharger mes données personnelles au format JSON"
              className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition hover:opacity-90"
              style={{ backgroundColor: '#027e7e' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger mes données
            </a>
          </div>
        </div>

        {/* Suppression du compte */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 mt-3 sm:mt-4 md:mt-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ Supprimer mon compte</h3>
            <p className="text-sm text-red-700 mb-3">
              Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées :
            </p>
            <ul className="text-sm text-red-700 space-y-1 mb-4 ml-4">
              <li>• Votre profil et vos informations personnelles</li>
              <li>• Vos préférences de recherche</li>
              <li>• Votre historique de messages</li>
              <li>• Vos favoris et éducateurs sauvegardés</li>
              <li>• Vos réservations et rendez-vous</li>
            </ul>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
              >
                Je veux supprimer mon compte
              </button>
            ) : (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-red-800 mb-2">
                    Pour confirmer, tapez exactement <span className="font-bold">SUPPRIMER</span>
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Tapez SUPPRIMER"
                    className="w-full border-2 border-red-300 rounded-lg shadow-sm py-3 px-4 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== 'SUPPRIMER'}
                    aria-busy={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Suppression en cours...' : 'Supprimer définitivement mon compte'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={deleting}
                    aria-label="Annuler la suppression du compte"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
