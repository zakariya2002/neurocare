/**
 * Modèles de courriers PDF (A3) — page d'accueil.
 *
 * Server Component : vérifie le feature flag, l'auth, charge la liste
 * des modèles disponibles. Cliquer sur un modèle ouvre la sous-page
 * /dashboard/family/courriers/[modele].
 */

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import { COURRIER_MODELES } from '@/lib/pdf/courriers/templates';

export const dynamic = 'force-dynamic';

export default async function FamilyCourriersPage() {
  if (!FEATURES.courriersAdmin) {
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

  const children = (childrenData ?? []) as Array<{
    id: string;
    first_name: string;
    last_name: string | null;
  }>;

  return (
    <div
      className="min-h-screen min-h-[100dvh]"
      style={{ backgroundColor: '#fdf9f4' }}
    >
      <Header />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="mb-4">
          <Link
            href="/dashboard/family"
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
            Retour au tableau de bord
          </Link>
        </div>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Mes modèles de courriers
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Téléchargez en quelques clics des modèles pré-remplis avec vos
            informations. Vous pouvez ensuite les imprimer, signer et les
            envoyer par voie postale ou en lettre recommandée avec accusé de
            réception.
          </p>
        </div>

        {children.length === 0 ? (
          <EmptyChildrenState />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {COURRIER_MODELES.map((modele) => (
              <Link
                key={modele.id}
                href={`/dashboard/family/courriers/${modele.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 transition hover:shadow-md hover:border-[#027e7e]/40"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#e6f4f4' }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: '#027e7e' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      {modele.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {modele.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      <span className="font-semibold text-gray-700">
                        Quand l’utiliser ?
                      </span>{' '}
                      {modele.whenToUse}
                    </p>
                  </div>
                  <svg
                    className="hidden sm:block w-5 h-5 text-gray-400 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div
          className="mt-6 rounded-2xl border p-4"
          style={{ backgroundColor: '#fff7ed', borderColor: '#fed7aa' }}
        >
          <p className="text-sm text-gray-800">
            <span className="font-semibold">À noter :</span> ces modèles sont
            fournis à titre indicatif et ne constituent pas un conseil
            juridique. Pensez à relire et adapter chaque courrier à votre
            situation, à le signer manuellement et à l’envoyer en lettre
            recommandée avec accusé de réception lorsque cela est requis (par
            exemple pour un recours MDPH).
          </p>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <div
      className="px-3 sm:px-4 md:px-6 py-4 flex items-center justify-center"
      style={{ backgroundColor: '#05a5a5' }}
    >
      <h1 className="text-lg sm:text-xl font-bold text-white">
        Modèles de courriers
      </h1>
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
        Les courriers sont rédigés au nom d’un enfant ou d’un proche. Créez son
        profil pour commencer.
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
