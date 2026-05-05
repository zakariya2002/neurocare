import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/assert-admin';
import {
  getCampagneProsV1,
  getCampagneProsV2,
  getCampagneProsV3,
  CAMPAGNE_PROS_SUBJECTS,
} from '@/lib/email-templates/campagne-pros';

export const dynamic = 'force-dynamic';

const EXAMPLE_PRENOM = 'Sophie';
const EXAMPLE_RAISON_SOCIALE = "Cabinet d'ergothérapie";

const TEMPLATES = {
  v1: getCampagneProsV1,
  v2: getCampagneProsV2,
  v3: getCampagneProsV3,
} as const;

type TemplateKey = keyof typeof TEMPLATES;

// ──────────────────────────────────────────────
// GET — Preview a cold email template
// ?template=v1|v2|v3
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const template = searchParams.get('template') as TemplateKey | null;

  if (!template || !Object.keys(TEMPLATES).includes(template)) {
    return NextResponse.json(
      { error: 'Paramètre invalide : ?template=v1|v2|v3 requis' },
      { status: 400 },
    );
  }

  const html = TEMPLATES[template](EXAMPLE_PRENOM, EXAMPLE_RAISON_SOCIALE);
  const subject = CAMPAGNE_PROS_SUBJECTS[template];

  return NextResponse.json({ html, subject, template });
}
