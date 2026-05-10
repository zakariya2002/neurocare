/**
 * Justificatifs annuels CAF / impôts / CESU (A4 — justificatifsAnnuels).
 *
 * Server Component : vérifie le feature flag, l'auth, agrège les reçus
 * par année calendaire, et propose le téléchargement du PDF de synthèse.
 *
 * Aucune mutation côté serveur — tout passe par la route GET
 * `/api/family/receipts/annual/[year]`.
 */

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import AnnualYearList, {
  type AnnualYearSummary,
} from '@/components/family/receipts/AnnualYearList';
import FamilyNavbar from '@/components/FamilyNavbar';

export const dynamic = 'force-dynamic';

export default async function FamilyAnnualReceiptsPage() {
  if (!FEATURES.justificatifsAnnuels) {
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

  // On agrège côté Node : volume très faible (quelques dizaines / an / famille).
  type RawRow = {
    invoice_date: string | null;
    amount_total: number | null;
    appointment?:
      | { child_id?: string | null }
      | Array<{ child_id?: string | null }>
      | null;
  };

  const { data: rows } = await supabase
    .from('invoices')
    .select(
      `
        invoice_date,
        amount_total,
        appointment:appointments(child_id)
      `
    )
    .eq('family_id', family.id)
    .eq('type', 'family_receipt')
    .order('invoice_date', { ascending: false });

  const aggregates = new Map<
    number,
    { totalCents: number; count: number; children: Set<string> }
  >();

  for (const row of (rows ?? []) as RawRow[]) {
    if (!row.invoice_date) continue;
    const year = Number.parseInt(row.invoice_date.slice(0, 4), 10);
    if (!Number.isInteger(year)) continue;

    const ap = Array.isArray(row.appointment)
      ? row.appointment[0]
      : row.appointment;
    const childId = ap?.child_id ?? '__no_child__';

    const agg = aggregates.get(year);
    if (agg) {
      agg.totalCents += row.amount_total ?? 0;
      agg.count += 1;
      agg.children.add(childId);
    } else {
      aggregates.set(year, {
        totalCents: row.amount_total ?? 0,
        count: 1,
        children: new Set([childId]),
      });
    }
  }

  const years: AnnualYearSummary[] = Array.from(aggregates.entries())
    .map(([year, agg]) => ({
      year,
      totalCents: agg.totalCents,
      appointmentsCount: agg.count,
      childrenCount: agg.children.size,
    }))
    .sort((a, b) => b.year - a.year);

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
            href="/dashboard/family/receipts"
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
            Retour à mes reçus
          </Link>
        </div>

        {/* Header de page */}
        <header className="mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
          <div
            className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#e6f4f4' }}
            aria-hidden="true"
          >
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7"
              style={{ color: '#027e7e' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              Mes justificatifs annuels
            </h1>
            <p
              className="text-sm sm:text-base text-gray-600 mt-1"
              style={{ fontFamily: 'Open Sans, sans-serif' }}
            >
              Synthèse PDF de vos paiements pour la CAF, vos impôts ou le CESU,
              prête à joindre à votre dossier.
            </p>
          </div>
        </header>

        {/* Comment ça marche ? */}
        <section
          className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5 sm:mb-6"
          aria-label="Comment ça marche ?"
        >
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#e6f4f4' }}
              aria-hidden="true"
            >
              <svg
                className="w-5 h-5"
                style={{ color: '#027e7e' }}
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
            <h2
              className="text-sm sm:text-base font-bold text-gray-900"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              Comment ça marche&nbsp;?
            </h2>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-5">
            <Step
              n={1}
              title="Choisissez l'année"
              text="Sélectionnez l'année civile concernée dans la liste ci-dessous."
            />
            <Step
              n={2}
              title="Téléchargez le PDF"
              text="Un récapitulatif détaillé est généré en quelques secondes."
            />
            <Step
              n={3}
              title="Joignez-le à votre dossier"
              text="Déclaration d'impôts, dossier CAF/MDPH, ou demande CESU."
            />
          </ol>
        </section>

        <AnnualYearList years={years} />

        {/* Mentions légales */}
        <section
          className="mt-6 sm:mt-8 rounded-xl md:rounded-2xl border p-4 sm:p-5 flex items-start gap-3"
          style={{ backgroundColor: '#e6f4f4', borderColor: '#c9eaea' }}
          aria-label="Mentions légales"
        >
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#c9eaea' }}
            aria-hidden="true"
          >
            <svg
              className="w-5 h-5"
              style={{ color: '#015c5c' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h2
              className="text-sm font-bold text-gray-900 mb-1"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              Mentions légales
            </h2>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Ce document récapitule les paiements effectués via NeuroCare au
              cours d&apos;une année civile (du 1<sup>er</sup> janvier au 31
              décembre). Il peut être joint à votre déclaration de revenus
              (crédit d&apos;impôt « services à la personne »), à un dossier
              CAF/MDPH (AEEH, PCH) ou CESU. NeuroCare ne se prononce pas sur
              l&apos;éligibilité fiscale ou sociale&nbsp;: il vous appartient de
              la vérifier auprès de votre administration.
            </p>
          </div>
        </section>
      </main>

      <div
        className="mt-auto"
        style={{ backgroundColor: '#027e7e', height: '40px' }}
      />
    </div>
  );
}

function Step({
  n,
  title,
  text,
}: {
  n: number;
  title: string;
  text: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: '#027e7e', color: 'white' }}
        aria-hidden="true"
      >
        {n}
      </div>
      <div className="min-w-0">
        <p
          className="text-sm font-semibold text-gray-900"
          style={{ fontFamily: 'Verdana, sans-serif' }}
        >
          {title}
        </p>
        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{text}</p>
      </div>
    </li>
  );
}
