'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import AnnouncementWizard from '@/components/family/announcements/AnnouncementWizard';

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      setUserId(session.user.id);
      const { data: family } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (family) {
        setProfile(family);
        setFamilyId(family.id);
      }
      setLoading(false);
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      <section className="py-3 sm:py-5 md:py-8 px-3 sm:px-4 md:px-6 flex-1">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/dashboard/family/announcements')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            aria-label="Retour"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Retour à mes annonces</span>
          </button>

          <div className="mb-4 sm:mb-6">
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              Publier une annonce
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Décrivez votre besoin, les pros qualifiés vous contacteront.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto"
                style={{ borderTopColor: '#027e7e', borderRightColor: '#3a9e9e', borderBottomColor: '#6bbebe', borderLeftColor: 'rgba(2, 126, 126, 0.2)' }} />
              <p className="text-gray-600 mt-4 text-sm">Chargement...</p>
            </div>
          ) : (
            <AnnouncementWizard mode="create" />
          )}

          <div className="h-20" />
        </div>
      </section>

      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
