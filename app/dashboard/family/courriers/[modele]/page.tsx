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
    .select('id, first_name, last_name, location, phone')
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
      className="min-h-screen min-h-[100dvh]"
      style={{ backgroundColor: '#fdf9f4' }}
    >
      <Header title={modele.shortTitle} />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="mb-4">
          <Link
            href="/dashboard/family/courriers"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour aux modèles
          </Link>
        </div>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">{modele.title}</h1>
          <p className="text-sm text-gray-600 mt-1">{modele.description}</p>
        </div>

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
    </div>
  );
}

export async function generateStaticParams() {
  return COURRIER_MODELES.map((m) => ({ modele: m.id }));
}

function Header({ title }: { title: string }) {
  return (
    <div
      className="px-3 sm:px-4 md:px-6 py-4 flex items-center justify-center"
      style={{ backgroundColor: '#05a5a5' }}
    >
      <h1 className="text-lg sm:text-xl font-bold text-white">{title}</h1>
    </div>
  );
}

function EmptyChildrenState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Ajoutez d&apos;abord un proche
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Le courrier est rédigé au nom d&apos;un enfant ou d&apos;un proche.
        Créez son profil pour commencer.
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
