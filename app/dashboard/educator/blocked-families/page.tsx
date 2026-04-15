'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import EducatorNavbar from '@/components/EducatorNavbar';
import { useToast } from '@/components/Toast';

interface BlockedFamily {
  id: string;
  family_id: string;
  reason: string | null;
  blocked_at: string;
  family: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export default function BlockedFamiliesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [educatorId, setEducatorId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [blockedFamilies, setBlockedFamilies] = useState<BlockedFamily[]>([]);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (educatorId) {
      fetchBlockedFamilies();
    }
  }, [educatorId]);

  const checkAuth = async () => {
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

    setEducatorId(educatorProfile.id);
    setProfile(educatorProfile);
    setLoading(false);
  };

  const fetchBlockedFamilies = async () => {
    if (!educatorId) return;

    try {
      const response = await fetch(`/api/blocked-families?educatorId=${educatorId}`);
      if (response.ok) {
        const data = await response.json();
        setBlockedFamilies(data.blockedFamilies || []);
      }
    } catch (error) {
      console.error('Erreur chargement familles bloquées:', error);
    }
  };

  const handleUnblock = async (familyId: string) => {
    if (!educatorId) return;

    if (!confirm('Êtes-vous sûr de vouloir débloquer cette famille ? Elle pourra à nouveau voir votre profil et vous contacter.')) {
      return;
    }

    setUnblocking(familyId);

    try {
      const response = await fetch(`/api/blocked-families?educatorId=${educatorId}&familyId=${familyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setBlockedFamilies(prev => prev.filter(bf => bf.family_id !== familyId));
      } else {
        const data = await response.json();
        showToast(data.error || 'Erreur lors du déblocage', 'error');
      }
    } catch (error) {
      console.error('Erreur déblocage:', error);
      showToast('Erreur lors du déblocage de la famille', 'error');
    } finally {
      setUnblocking(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EducatorNavbar profile={profile} />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8">
        {/* Bouton retour */}
        <Link
          href="/messages"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 md:mb-6 transition-colors"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs md:text-sm font-medium">Retour à la messagerie</span>
        </Link>

        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Familles bloquées</h1>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
            Gérez les familles que vous avez bloquées. Elles ne peuvent plus voir votre profil ni vous contacter.
          </p>
        </div>

        {blockedFamilies.length === 0 ? (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-6 sm:p-8 md:p-12 text-center">
            <svg className="w-14 h-14 md:w-20 md:h-20 text-gray-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
              Aucune famille bloquée
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Vous n&apos;avez bloqué aucune famille pour le moment.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
            <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
              <p className="text-xs md:text-sm text-gray-600">
                {blockedFamilies.length} famille{blockedFamilies.length > 1 ? 's' : ''} bloquée{blockedFamilies.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {blockedFamilies.map((bf) => (
                <div key={bf.id} className="p-3 sm:p-4 md:p-6 flex items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {bf.family?.avatar_url ? (
                      <img
                        src={bf.family.avatar_url}
                        alt=""
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-semibold text-sm md:text-lg">
                          {bf.family?.first_name?.[0]?.toUpperCase()}{bf.family?.last_name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-sm md:text-base">
                        {bf.family?.first_name} {bf.family?.last_name}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500">
                        Bloqué le {formatDate(bf.blocked_at)}
                      </p>
                      {bf.reason && (
                        <p className="text-xs md:text-sm text-gray-600 mt-1 italic">
                          Raison : {bf.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(bf.family_id)}
                    disabled={unblocking === bf.family_id}
                    className="flex-shrink-0 px-3 md:px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 disabled:opacity-50"
                  >
                    {unblocking === bf.family_id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Déblocage...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Débloquer</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 sm:mt-6 md:mt-8 bg-blue-50 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-blue-200">
          <div className="flex items-start gap-2 sm:gap-3">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-900 text-xs md:text-sm">A savoir</h4>
              <ul className="text-[11px] md:text-sm text-blue-800 mt-1 sm:mt-2 space-y-1 list-disc list-inside">
                <li>Une famille bloquée ne peut plus voir votre profil</li>
                <li>Elle ne peut plus vous envoyer de messages</li>
                <li>Elle ne peut plus prendre de rendez-vous avec vous</li>
                <li>Les rendez-vous en attente sont automatiquement annulés au moment du blocage</li>
                <li>Vous pouvez débloquer une famille à tout moment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
