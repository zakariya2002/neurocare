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
import FamilyNavbar from '@/components/FamilyNavbar';
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
    .select('*')
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#fef3c7' }}>
            <svg className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Mes rappels administratifs
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl mx-auto">
            Saisissez vos échéances MDPH, AEEH, PCH, FIP ou PPS. Nous vous enverrons un rappel par
            email à 3&nbsp;mois, 2&nbsp;mois, 1&nbsp;mois et 1&nbsp;semaine de l&apos;expiration.
          </p>
        </header>

        {children.length === 0 ? (
          <EmptyChildrenState />
        ) : (
          <RemindersList
            // eslint-disable-next-line react/no-children-prop
            children={children}
            initialReminders={(reminders as FamilyAdminReminderRow[]) ?? []}
          />
        )}
      </main>
      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}

function EmptyChildrenState() {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#e6f4f4' }}>
        <svg className="w-8 h-8" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
        Ajoutez d&apos;abord un proche
      </h2>
      <p className="text-sm text-gray-600 mb-5 max-w-md mx-auto">
        Les rappels sont liés à un enfant ou un proche. Créez son profil pour commencer.
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
  );
}
