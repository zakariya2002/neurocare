'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import EducatorNavbar from '@/components/EducatorNavbar';
import NewPostForm from '@/components/community/NewPostForm';

export default function NewPostPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<'family' | 'educator' | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push('/auth/login?redirect=/community/new');
          return;
        }

        setUserId(session.user.id);

        // Parallelize educator and family profile checks
        const [educatorResult, familyResult] = await Promise.all([
          supabase
            .from('educator_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single(),
          supabase
            .from('family_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single(),
        ]);

        if (educatorResult.data) {
          setUserRole('educator');
          setProfile(educatorResult.data);
        } else if (familyResult.data) {
          setUserRole('family');
          setProfile(familyResult.data);
          setFamilyId(familyResult.data.id);
        } else {
          // User has no profile, redirect to complete registration
          router.push('/auth/register');
          return;
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf9f4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf9f4]">
      {/* Navbar */}
      {userRole === 'educator' ? (
        <EducatorNavbar profile={profile} />
      ) : (
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      )}

      <main className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Back button */}
        <Link
          href="/communaute"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la communauté
        </Link>

        {/* Page header */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Créer un nouveau post
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Partagez votre expérience, posez une question ou donnez des conseils à la communauté
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          <NewPostForm />
        </div>

        {/* Guidelines */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-teal-50 rounded-xl border border-teal-100">
          <h3 className="font-medium text-teal-800 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Conseils pour un bon post
          </h3>
          <ul className="text-sm text-teal-700 space-y-1">
            <li>• Choisissez un titre clair et descriptif</li>
            <li>• Soyez respectueux et bienveillant envers les autres membres</li>
            <li>• Évitez de partager des informations personnelles sensibles</li>
            <li>• Utilisez l'option anonyme si vous souhaitez rester discret</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
