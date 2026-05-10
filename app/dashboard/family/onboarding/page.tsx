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
    .select('id')
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
    return (
      <EmptyChildrenState />
    );
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
    <div className="min-h-screen min-h-[100dvh]" style={{ backgroundColor: '#fdf9f4' }}>
      <Header />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="mb-4">
          <Link
            href="/dashboard/family"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au tableau de bord
          </Link>
        </div>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Premiers pas</h1>
          <p className="text-sm text-gray-600 mt-1">
            Quelques questions pour structurer vos démarches après le diagnostic. Toutes les
            réponses sont facultatives et modifiables.
          </p>
        </div>

        <OnboardingWizard
          children={children}
          initialChildId={initialChildId}
          initialProgress={initialProgress}
        />

        <p className="text-xs text-gray-500 mt-4 text-center">
          Vos réponses sont enregistrées au fil de l\'eau et restent privées.
        </p>
      </main>
    </div>
  );
}

function Header() {
  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 flex items-center justify-center" style={{ backgroundColor: '#05a5a5' }}>
      <h1 className="text-lg sm:text-xl font-bold text-white">Onboarding</h1>
    </div>
  );
}

function EmptyChildrenState() {
  return (
    <div className="min-h-screen min-h-[100dvh]" style={{ backgroundColor: '#fdf9f4' }}>
      <Header />
      <main className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ajoutez d\'abord un enfant</h2>
          <p className="text-sm text-gray-600 mb-4">
            Le parcours « Premiers pas » se fait par enfant. Créez le profil de votre enfant pour
            commencer.
          </p>
          <Link
            href="/dashboard/family/children"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition"
            style={{ backgroundColor: '#027e7e' }}
          >
            Ajouter un proche
          </Link>
        </div>
      </main>
    </div>
  );
}
