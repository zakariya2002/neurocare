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
import FamilyNavbar from '@/components/FamilyNavbar';

export const dynamic = 'force-dynamic';

// Palette d'accents par modèle, pensée pour évoquer chaque démarche.
const MODELE_THEME: Record<
  string,
  {
    bg: string;
    border: string;
    icon: string;
    iconColor: string;
    label: string;
    iconPath: React.ReactNode;
  }
> = {
  'recours-mdph': {
    bg: 'rgba(220, 38, 38, 0.08)',
    border: 'rgba(220, 38, 38, 0.25)',
    icon: '#fee2e2',
    iconColor: '#dc2626',
    label: 'Recours',
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    ),
  },
  'demande-pps': {
    bg: '#dbeafe',
    border: 'rgba(37, 99, 235, 0.25)',
    icon: '#dbeafe',
    iconColor: '#2563eb',
    label: 'Scolarité',
    iconPath: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 14l9-5-9-5-9 5 9 5z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
        />
      </>
    ),
  },
  'ess-exceptionnelle': {
    bg: 'rgba(124, 58, 237, 0.08)',
    border: 'rgba(124, 58, 237, 0.25)',
    icon: 'rgba(124, 58, 237, 0.15)',
    iconColor: '#7c3aed',
    label: 'ESS',
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 014-4h2a4 4 0 014 4v2zm3-12a4 4 0 11-8 0 4 4 0 018 0zm6 4a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
  'notification-mdph': {
    bg: 'rgba(217, 119, 6, 0.08)',
    border: 'rgba(217, 119, 6, 0.25)',
    icon: 'rgba(217, 119, 6, 0.15)',
    iconColor: '#d97706',
    label: 'Notification',
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    ),
  },
  'prolongation-fip-pco': {
    bg: '#e6f4f4',
    border: 'rgba(2, 126, 126, 0.25)',
    icon: '#c9eaea',
    iconColor: '#027e7e',
    label: 'Prolongation',
    iconPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
};

const DEFAULT_THEME = MODELE_THEME['prolongation-fip-pco'];

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
    .select('id, first_name, last_name, avatar_url, gender')
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
      className="min-h-screen min-h-[100dvh] flex flex-col"
      style={{ backgroundColor: '#fdf9f4' }}
    >
      <FamilyNavbar profile={family} familyId={family.id} userId={user.id} />

      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full flex-1">
        {/* Retour */}
        <div className="mb-4">
          <Link
            href="/dashboard/family"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
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

        {/* Header de page */}
        <header className="mb-6 sm:mb-8 flex items-start gap-4">
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
              Modèles de courriers
            </h1>
            <p
              className="text-sm sm:text-base text-gray-600 mt-1"
              style={{ fontFamily: 'Open Sans, sans-serif' }}
            >
              Téléchargez des modèles de courriers pré-remplis avec vos
              informations, prêts à imprimer, signer et envoyer.
            </p>
          </div>
        </header>

        {children.length === 0 ? (
          <EmptyChildrenState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {COURRIER_MODELES.map((modele) => {
              const theme = MODELE_THEME[modele.id] ?? DEFAULT_THEME;
              return (
                <Link
                  key={modele.id}
                  href={`/dashboard/family/courriers/${modele.id}`}
                  className="group bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 sm:p-5 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-[#027e7e]/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#027e7e]"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: theme.icon }}
                      aria-hidden="true"
                    >
                      <svg
                        className="w-6 h-6"
                        style={{ color: theme.iconColor }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {theme.iconPath}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide mb-1.5 border"
                        style={{
                          backgroundColor: theme.bg,
                          color: theme.iconColor,
                          borderColor: theme.border,
                        }}
                      >
                        {theme.label}
                      </span>
                      <h2
                        className="text-base sm:text-lg font-bold text-gray-900 leading-snug"
                        style={{ fontFamily: 'Verdana, sans-serif' }}
                      >
                        {modele.title}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">
                        {modele.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">
                        Quand l&apos;utiliser ?
                      </span>{' '}
                      {modele.whenToUse}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-end text-sm font-semibold transition-colors"
                    style={{ color: '#027e7e' }}
                  >
                    Créer ce courrier
                    <svg
                      className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
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
              );
            })}
          </div>
        )}

        {/* Notice indicative */}
        <div
          className="mt-6 sm:mt-8 rounded-xl md:rounded-2xl border p-4 sm:p-5 flex items-start gap-3"
          style={{ backgroundColor: '#fff7ed', borderColor: '#fed7aa' }}
        >
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#fed7aa' }}
            aria-hidden="true"
          >
            <svg
              className="w-5 h-5"
              style={{ color: '#c2410c' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">
            <span className="font-semibold">À noter :</span> ces modèles sont
            fournis à titre indicatif et ne constituent pas un conseil
            juridique. Pensez à relire et adapter chaque courrier à votre
            situation, à le signer manuellement et à l&apos;envoyer en lettre
            recommandée avec accusé de réception lorsque cela est requis (par
            exemple pour un recours MDPH).
          </p>
        </div>
      </main>

      <div
        className="mt-auto"
        style={{ backgroundColor: '#027e7e', height: '40px' }}
      />
    </div>
  );
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
        Les courriers sont rédigés au nom d&apos;un enfant ou d&apos;un proche.
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
