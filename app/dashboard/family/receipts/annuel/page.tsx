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
    .select('id, first_name, last_name')
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
      <main className="flex-1 max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full">
        <div className="mb-4">
          <Link
            href="/dashboard/family/receipts"
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
            Retour à mes reçus
          </Link>
        </div>

        <header className="mb-5 sm:mb-6">
          <div
            className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center p-3 mb-3"
            style={{ backgroundColor: '#027e7e' }}
            aria-hidden="true"
          >
            <svg
              className="w-full h-full text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zm9-15a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Mes justificatifs annuels
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Téléchargez la synthèse de vos paiements par année civile pour
            votre déclaration de revenus, votre dossier CAF/MDPH ou votre CESU.
          </p>
        </header>

        <section
          className="rounded-xl p-4 sm:p-5 mb-5 sm:mb-6"
          style={{
            backgroundColor: '#e6f4f4',
            border: '1px solid #c9eaea',
          }}
          aria-label="À propos du justificatif annuel"
        >
          <h2
            className="text-sm font-semibold mb-2"
            style={{ color: '#027e7e' }}
          >
            À quoi sert ce document ?
          </h2>
          <ul className="text-xs sm:text-sm text-gray-700 space-y-1.5">
            <li className="flex items-start gap-2">
              <span style={{ color: '#3a9e9e' }} className="mt-0.5">
                •
              </span>
              <span>
                Récapitule les paiements effectués via NeuroCare au cours
                d&apos;une année civile (du 1
                <sup>er</sup> janvier au 31 décembre).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#3a9e9e' }} className="mt-0.5">
                •
              </span>
              <span>
                Peut être joint à votre déclaration de revenus (crédit
                d&apos;impôt « services à la personne »), à votre dossier CAF
                (AEEH) ou MDPH (PCH), ou à un dossier CESU.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#3a9e9e' }} className="mt-0.5">
                •
              </span>
              <span>
                NeuroCare ne se prononce pas sur l&apos;éligibilité fiscale ou
                sociale : c&apos;est à vous de la vérifier auprès de votre
                administration.
              </span>
            </li>
          </ul>
        </section>

        <AnnualYearList years={years} />

        <div className="h-8" />
      </main>

      <div
        className="mt-auto"
        style={{ backgroundColor: '#027e7e', height: '40px' }}
      />
    </div>
  );
}
