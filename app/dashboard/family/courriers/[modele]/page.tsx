/**
 * Modèles de courriers PDF (A3) — page formulaire d'un modèle.
 *
 * Server Component : feature flag, auth, charge le profil parent, la liste
 * des enfants et le statut MDPH éventuel pour pré-remplir le formulaire.
 * L'UI est ensuite déléguée au composant client.
 */

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import { getModele, COURRIER_MODELES } from '@/lib/pdf/courriers/templates';
import CourrierForm from '@/components/family/courriers/CourrierForm';
import FamilyNavbar from '@/components/FamilyNavbar';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ modele: string }>;
}

export default async function FamilyCourrierModelePage({ params }: PageProps) {
  if (!FEATURES.courriersAdmin) {
    notFound();
  }

  const { modele: modeleId } = await params;
  const modele = getModele(modeleId);
  if (!modele) {
    notFound();
  }

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  const { data: family } = await supabase
    .from('family_profiles')
    .select(
      'id, first_name, last_name, location, phone, avatar_url, gender'
    )
    .eq('user_id', user.id)
    .maybeSingle();
  if (!family) {
    redirect('/dashboard/family');
  }

  const { data: childrenData } = await supabase
    .from('child_profiles')
    .select('id, first_name, last_name, birth_date')
    .eq('family_id', family.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  const children = (childrenData ?? []).map((c: any) => ({
    id: c.id as string,
    firstName: (c.first_name as string) ?? '',
    lastName: (c.last_name as string | null) ?? null,
    birthDate: (c.birth_date as string | null) ?? null,
  }));

  // Charger le statut MDPH (numéro de dossier, code département) si l'enfant
  // en a un — utile pour pré-remplir certains champs.
  const childIds = children.map((c) => c.id);
  let mdphByChild: Record<
    string,
    { mdphNumber: string | null; departmentCode: string | null }
  > = {};
  if (childIds.length > 0) {
    const { data: mdphData } = await supabase
      .from('child_mdph_status')
      .select('child_id, mdph_number, department_code')
      .in('child_id', childIds);
    (mdphData ?? []).forEach((row: any) => {
      mdphByChild[row.child_id] = {
        mdphNumber: row.mdph_number ?? null,
        departmentCode: row.department_code ?? null,
      };
    });
  }

  const familyInfo = {
    parentFullName:
      [family.first_name, family.last_name].filter(Boolean).join(' ').trim() ||
      user.email ||
      '',
    location: (family.location as string | null) ?? '',
    phone: (family.phone as string | null) ?? '',
    email: user.email ?? '',
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col"
      style={{ backgroundColor: '#fdf9f4' }}
    >
      <FamilyNavbar profile={family} familyId={family.id} userId={user.id} />

      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full flex-1">
        {/* Breadcrumb + retour */}
        <nav aria-label="Fil d'Ariane" className="mb-4">
          <ol className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-600">
            <li>
              <Link
                href="/dashboard/family"
                className="hover:text-gray-900 transition"
              >
                Tableau de bord
              </Link>
            </li>
            <li aria-hidden="true" className="text-gray-400">
              /
            </li>
            <li>
              <Link
                href="/dashboard/family/courriers"
                className="hover:text-gray-900 transition"
              >
                Modèles de courriers
              </Link>
            </li>
            <li aria-hidden="true" className="text-gray-400">
              /
            </li>
            <li
              className="font-semibold text-gray-900 truncate max-w-full"
              aria-current="page"
            >
              {modele.shortTitle}
            </li>
          </ol>
        </nav>

        {/* Header de page */}
        <header className="mb-5 sm:mb-6 flex items-start gap-3 sm:gap-4">
          <div
            className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#dbeafe' }}
            aria-hidden="true"
          >
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7"
              style={{ color: '#2563eb' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              {modele.title}
            </h1>
            <p
              className="text-sm sm:text-base text-gray-600 mt-1"
              style={{ fontFamily: 'Open Sans, sans-serif' }}
            >
              {modele.description}
            </p>
          </div>
        </header>

        {children.length === 0 ? (
          <EmptyChildrenState />
        ) : (
          <CourrierForm
            modele={modele}
            children={children}
            mdphByChild={mdphByChild}
            family={familyInfo}
          />
        )}
      </main>

      <div
        className="mt-auto"
        style={{ backgroundColor: '#027e7e', height: '40px' }}
      />
    </div>
  );
}

export async function generateStaticParams() {
  return COURRIER_MODELES.map((m) => ({ modele: m.id }));
}

function EmptyChildrenState() {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 text-center">
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: '#dbeafe' }}
        aria-hidden="true"
      >
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10"
          style={{ color: '#2563eb' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h2
        className="text-lg sm:text-xl font-bold text-gray-900 mb-2"
        style={{ fontFamily: 'Verdana, sans-serif' }}
      >
        Ajoutez d&apos;abord un proche
      </h2>
      <p className="text-sm text-gray-600 mb-5 max-w-md mx-auto">
        Le courrier est rédigé au nom d&apos;un enfant ou d&apos;un proche.
        Créez son profil pour commencer.
      </p>
      <Link
        href="/dashboard/family/children"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white shadow-sm transition hover:opacity-90"
        style={{ backgroundColor: '#027e7e' }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Ajouter un proche
      </Link>
    </div>
  );
}
