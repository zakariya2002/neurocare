/**
 * Justificatif annuel CAF / impôts / CESU (A4 — justificatifsAnnuels).
 *
 * GET /api/family/receipts/annual/[year]
 *
 * Réponse : PDF binaire (Content-Type application/pdf) agrégeant tous les
 * reçus de la famille pour l'année calendaire indiquée.
 *
 * Sécurité :
 * - Feature flag justificatifsAnnuels → 404 sinon.
 * - Auth obligatoire (cookie session).
 * - Le RLS Postgres limite déjà les `invoices` à la famille connectée ;
 *   on filtre en plus explicitement par `family_id`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import {
  generateJustificatifAnnuelPDF,
  type JustificatifAnnuelData,
  type JustificatifAnnuelLine,
} from '@/lib/pdf/justificatif-annuel';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string }>;
}

const MIN_YEAR = 2020;

function notFoundJson() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}
function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!FEATURES.justificatifsAnnuels) return notFoundJson();

  const { year: yearStr } = await params;
  const year = Number.parseInt(yearStr, 10);
  const currentYear = new Date().getFullYear();
  if (
    !Number.isInteger(year) ||
    year < MIN_YEAR ||
    year > currentYear + 1
  ) {
    return badRequest('Année invalide.');
  }

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  // Famille du user
  const { data: family, error: familyError } = await supabase
    .from('family_profiles')
    .select('id, first_name, last_name, location')
    .eq('user_id', user.id)
    .maybeSingle();
  if (familyError || !family) return unauthorized();

  const startISO = `${year}-01-01`;
  const endISO = `${year}-12-31`;

  // Reçus famille de l'année (un seul fetch — le RLS double-vérifie).
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select(
      `
        id,
        invoice_number,
        invoice_date,
        amount_total,
        appointment:appointments(
          appointment_date,
          start_time,
          end_time,
          child_id,
          child:child_profiles(
            id,
            first_name,
            last_name
          ),
          educator:educator_profiles(
            id,
            first_name,
            last_name,
            siret,
            sap_number,
            rpps_number,
            adeli_number,
            profession,
            profession_label
          )
        )
      `
    )
    .eq('family_id', family.id)
    .eq('type', 'family_receipt')
    .gte('invoice_date', startISO)
    .lte('invoice_date', endISO)
    .order('invoice_date', { ascending: true });

  if (invoicesError) {
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des reçus.',
        detail: invoicesError.message,
      },
      { status: 500 }
    );
  }

  type RawAppointment = {
    appointment_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    child_id?: string | null;
    child?: any;
    educator?: any;
  };
  type RawInvoice = {
    id: string;
    invoice_number: string | null;
    invoice_date: string | null;
    amount_total: number | null;
    appointment?: RawAppointment | RawAppointment[] | null;
  };

  const rawInvoices = (invoices ?? []) as RawInvoice[];

  if (rawInvoices.length === 0) {
    return NextResponse.json(
      {
        error: `Aucun reçu trouvé pour l'année ${year}.`,
      },
      { status: 404 }
    );
  }

  // Normalisation (Supabase peut retourner un objet ou un tableau pour les jointures).
  const lines: JustificatifAnnuelLine[] = [];
  const childAggregates = new Map<
    string,
    { fullName: string; total: number; count: number }
  >();
  let totalCents = 0;

  for (const inv of rawInvoices) {
    const ap = Array.isArray(inv.appointment)
      ? inv.appointment[0]
      : inv.appointment;
    if (!ap || !ap.appointment_date) continue;

    const educator = Array.isArray(ap.educator) ? ap.educator[0] : ap.educator;
    const child = Array.isArray(ap.child) ? ap.child[0] : ap.child;

    const educatorFirstName = educator?.first_name ?? '';
    const educatorLastName = educator?.last_name ?? '';
    const educatorFullName =
      `${educatorFirstName} ${educatorLastName}`.trim() || 'Professionnel';

    const childFirstName = child?.first_name ?? '';
    const childLastName = child?.last_name ?? '';
    const childFullName =
      `${childFirstName} ${childLastName}`.trim() || 'Enfant non précisé';
    const childKey = child?.id ?? `__no_child__:${childFullName}`;

    const durationMinutes = computeDurationMinutes(ap.start_time, ap.end_time);

    const amount = inv.amount_total ?? 0;
    totalCents += amount;

    const agg = childAggregates.get(childKey);
    if (agg) {
      agg.total += amount;
      agg.count += 1;
    } else {
      childAggregates.set(childKey, {
        fullName: childFullName,
        total: amount,
        count: 1,
      });
    }

    lines.push({
      appointmentDate: parseDateOnly(ap.appointment_date),
      startTime: ap.start_time ?? undefined,
      endTime: ap.end_time ?? undefined,
      durationMinutes,
      educatorFullName,
      educatorProfessionLabel:
        educator?.profession_label ?? undefined,
      educatorSiret: educator?.siret ?? undefined,
      educatorSapNumber: educator?.sap_number ?? undefined,
      educatorRppsNumber: educator?.rpps_number ?? undefined,
      educatorAdeliNumber: educator?.adeli_number ?? undefined,
      childFullName,
      amountTotalCents: amount,
      invoiceNumber: inv.invoice_number ?? undefined,
    });
  }

  // Tri chronologique (sécurité — ordre déjà côté SQL mais on s'assure).
  lines.sort(
    (a, b) =>
      a.appointmentDate.getTime() - b.appointmentDate.getTime() ||
      (a.startTime ?? '').localeCompare(b.startTime ?? '')
  );

  const childrenBreakdown = Array.from(childAggregates.values())
    .map((c) => ({
      childFullName: c.fullName,
      totalCents: c.total,
      appointmentsCount: c.count,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);

  const fullParentName =
    `${family.first_name ?? ''} ${family.last_name ?? ''}`.trim() ||
    user.email ||
    'Parent';

  const reference = buildReference(year, family.id);

  const data: JustificatifAnnuelData = {
    reference,
    year,
    generationDate: new Date(),
    parentFullName: fullParentName,
    parentAddress: family.location ?? undefined,
    parentEmail: user.email ?? undefined,
    parentTaxId: undefined,
    totalCents,
    totalEligibleHalfCents: Math.round(totalCents / 2),
    appointmentsCount: lines.length,
    childrenBreakdown,
    lines,
  };

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateJustificatifAnnuelPDF(data);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Erreur lors de la génération du PDF.',
        detail: err?.message,
      },
      { status: 500 }
    );
  }

  const filename = `justificatif-annuel-${year}-neurocare.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

function parseDateOnly(s: string): Date {
  // `s` est au format YYYY-MM-DD — on évite la dérive de fuseau en
  // construisant la date à midi UTC.
  const [y, m, d] = s.split('-').map((p) => Number.parseInt(p, 10));
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d)
  ) {
    return new Date(s);
  }
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function computeDurationMinutes(
  start?: string | null,
  end?: string | null
): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map((p) => Number.parseInt(p, 10));
  const [eh, em] = end.split(':').map((p) => Number.parseInt(p, 10));
  if (
    !Number.isFinite(sh) ||
    !Number.isFinite(sm) ||
    !Number.isFinite(eh) ||
    !Number.isFinite(em)
  ) {
    return 0;
  }
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  return Math.max(0, endMin - startMin);
}

function buildReference(year: number, familyId: string): string {
  const shortId = familyId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `NC-AN-${year}-${shortId}`;
}
