'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import AnnouncementWizard from '@/components/family/announcements/AnnouncementWizard';
import {
  AnnouncementFormData,
  emptyForm,
  FamilyAnnouncement,
} from '@/components/family/announcements/types';

function toFormData(a: FamilyAnnouncement): AnnouncementFormData {
  return {
    ...emptyForm(),
    title: a.title || '',
    description: a.description || '',
    accompaniment_types: a.accompaniment_types || [],
    desired_professions: a.desired_professions || [],
    tnd_context: a.tnd_context || [],
    child_id: a.child_id || null,
    person_age: a.person_age ?? null,
    gender_preference: a.gender_preference || 'any',
    location_label: a.location_label || '',
    city: a.city || '',
    postal_code: a.postal_code || '',
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    radius_km: a.radius_km ?? 10,
    place_types: a.place_types || [],
    hours_per_week: a.hours_per_week ?? null,
    schedule_preferences: a.schedule_preferences || [],
    start_date: a.start_date || '',
    start_date_flexibility: a.start_date_flexibility || 'flexible',
  };
}

export default function EditAnnouncementPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const announcementId = params?.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [initial, setInitial] = useState<AnnouncementFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!announcementId) return;
    let active = true;
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
      if (!active) return;
      if (family) {
        setProfile(family);
        setFamilyId(family.id);
      }
      try {
        const res = await fetch(`/api/family/announcements/${announcementId}`);
        if (!res.ok) throw new Error('Annonce introuvable.');
        const body = await res.json();
        if (active && body.announcement) {
          setInitial(toFormData(body.announcement));
        }
      } catch (e: any) {
        if (active) setError(e.message || 'Erreur.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [announcementId, router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      <section className="py-3 sm:py-5 md:py-8 px-3 sm:px-4 md:px-6 flex-1">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push(`/dashboard/family/announcements/${announcementId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            aria-label="Retour"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Retour à l&apos;annonce</span>
          </button>

          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Modifier l&apos;annonce
            </h1>
          </div>

          <div
            className="mb-4 p-3 rounded-xl text-sm"
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#92400e', border: '1px solid rgba(245, 158, 11, 0.3)' }}
          >
            Toute modification renvoie l&apos;annonce en file de validation.
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r text-sm mb-4" role="alert">
              {error}
            </div>
          )}

          {loading || !initial ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto"
                style={{ borderTopColor: '#027e7e', borderRightColor: '#3a9e9e', borderBottomColor: '#6bbebe', borderLeftColor: 'rgba(2, 126, 126, 0.2)' }} />
              <p className="text-gray-600 mt-4 text-sm">Chargement...</p>
            </div>
          ) : (
            <AnnouncementWizard
              mode="edit"
              announcementId={announcementId}
              initialData={initial}
            />
          )}

          <div className="h-20" />
        </div>
      </section>

      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
