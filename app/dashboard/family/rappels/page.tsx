/**
 * Rappels MDPH (A2) — page d'entrée.
 *
 * Server Component : vérifie le feature flag, l'auth, charge la liste
 * des enfants + les rappels existants, puis hydrate le client.
 */

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import RemindersList from '@/components/family/reminders/RemindersList';
import type { FamilyAdminReminderRow } from '@/lib/family/reminders-mdph';

export const dynamic = 'force-dynamic';

export default async function FamilyRemindersPage() {
  if (!FEATURES.rappelsMdph) {
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

  const { data: childrenData } = await supabase
    .from('child_profiles')
    .select('id, first_name, last_name, is_active')
    .eq('family_id', family.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  const children = (childrenData ?? []) as Array<{ id: string; first_name: string; last_name: string | null }>;

  const { data: reminders } = await supabase
    .from('family_admin_reminders')
    .select('*')
    .eq('user_id', user.id)
    .order('expires_at', { ascending: true });

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
          <h1 className="text-2xl font-bold text-gray-900">Mes rappels administratifs</h1>
          <p className="text-sm text-gray-600 mt-1">
            Saisissez vos échéances MDPH, AEEH, PCH, FIP ou PPS. Nous vous enverrons un rappel par
            email à 3 mois, 2 mois, 1 mois et 1 semaine de l’expiration.
          </p>
        </div>

        {children.length === 0 ? (
          <EmptyChildrenState />
        ) : (
          <RemindersList
            children={children}
            initialReminders={(reminders as FamilyAdminReminderRow[]) ?? []}
          />
        )}
      </main>
    </div>
  );
}

function Header() {
  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 flex items-center justify-center" style={{ backgroundColor: '#05a5a5' }}>
      <h1 className="text-lg sm:text-xl font-bold text-white">Rappels administratifs</h1>
    </div>
  );
}

function EmptyChildrenState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Ajoutez d&apos;abord un proche</h2>
      <p className="text-sm text-gray-600 mb-4">
        Les rappels sont liés à un enfant ou un proche. Créez son profil pour commencer.
      </p>
      <Link
        href="/dashboard/family/children"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition"
        style={{ backgroundColor: '#027e7e' }}
      >
        Ajouter un proche
      </Link>
    </div>
  );
}
