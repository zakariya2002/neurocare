/**
 * Onboarding post-diagnostic (A1) — page d'entrée du wizard.
 *
 * Server Component : vérifie le feature flag, l'auth, charge l'enfant
 * (selon ?child_id=), puis hydrate le wizard côté client.
 */

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import FamilyNavbar from '@/components/FamilyNavbar';
import OnboardingWizard from '@/components/family/onboarding/Wizard';
import type { OnboardingProgressRow } from '@/lib/family/onboarding';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ child_id?: string }>;
}

export default async function FamilyOnboardingPage({ searchParams }: PageProps) {
  if (!FEATURES.onboardingPostDiag) {
    notFound();
  }

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  const { data: family } = await supabase
    .from('family_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!family) {
    redirect('/dashboard/family');
  }

  const { data: childrenData, error: childrenError } = await supabase
    .from('child_profiles')
    .select('id, first_name, last_name, is_active')
    .eq('family_id', family.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (childrenError) {
    console.error('[onboarding] children fetch:', childrenError);
  }

  const children = (childrenData ?? []) as Array<{ id: string; first_name: string; last_name: string | null }>;

  if (children.length === 0) {
    return <EmptyChildrenState profile={family} familyId={family.id} userId={user.id} />;
  }

  const params = await searchParams;
  const requestedChildId = params?.child_id;
  const initialChildId = (requestedChildId && children.some((c) => c.id === requestedChildId))
    ? requestedChildId
    : children[0].id;

  // Charger toute la progression de l'utilisateur en une seule requête
  const { data: progressRows } = await supabase
    .from('family_onboarding_progress')
    .select('*')
    .eq('user_id', user.id);

  const initialProgress: Record<string, OnboardingProgressRow | null> = {};
  for (const child of children) {
    initialProgress[child.id] = (progressRows ?? []).find((r: any) => r.child_id === child.id) ?? null;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <FamilyNavbar profile={family} familyId={family.id} userId={user.id} />
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full flex-1">
        <div className="mb-4">
          <Link
            href="/dashboard/family"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au tableau de bord
          </Link>
        </div>

        <header className="mb-6 sm:mb-8 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#e6f4f4' }}>
            <svg className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Premiers pas
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl mx-auto">
            Quelques questions pour structurer vos démarches après le diagnostic. Toutes les
            réponses sont facultatives et modifiables.
          </p>
        </header>

        <OnboardingWizard
          // eslint-disable-next-line react/no-children-prop
          children={children}
          initialChildId={initialChildId}
          initialProgress={initialProgress}
        />

        <p className="text-xs text-gray-500 mt-6 text-center">
          Vos réponses sont enregistrées au fil de l&apos;eau et restent privées.
        </p>
      </main>
      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}

function EmptyChildrenState({ profile, familyId, userId }: { profile: any; familyId: string; userId: string }) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10 w-full flex-1">
        <div className="mb-4">
          <Link
            href="/dashboard/family"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au tableau de bord
          </Link>
        </div>
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#e6f4f4' }}>
            <svg className="w-8 h-8" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Ajoutez d&apos;abord un enfant
          </h2>
          <p className="text-sm text-gray-600 mb-5 max-w-md mx-auto">
            Le parcours « Premiers pas » se fait par enfant. Créez le profil de votre enfant pour
            commencer.
          </p>
          <Link
            href="/dashboard/family/children"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition hover:opacity-90"
            style={{ backgroundColor: '#027e7e' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un proche
          </Link>
        </div>
      </main>
      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
