/**
 * API Courriers administratifs (A3 — courriersAdmin).
 *
 * POST /api/family/courriers/[modele]
 *
 * Body JSON :
 *   {
 *     childId: string,
 *     fields: Record<string, string>,
 *     object?: string,
 *     recipientAddressBlock: string,
 *     mode?: 'download' | 'preview' (défaut: 'download')
 *   }
 *
 * Réponse : PDF binaire (Content-Type application/pdf).
 *
 * Sécurité :
 * - Feature flag courriersAdmin → 404 sinon.
 * - Auth obligatoire (cookie session).
 * - Vérifie que childId appartient bien à la famille du user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import { getModele } from '@/lib/pdf/courriers/templates';
import { generateCourrierPDF } from '@/lib/pdf/courriers/generator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ modele: string }>;
}

function notFoundJson() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}
function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'courrier';
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!FEATURES.courriersAdmin) return notFoundJson();

  const { modele: modeleId } = await params;
  const modele = getModele(modeleId);
  if (!modele) return notFoundJson();

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return badRequest('Corps JSON invalide.');
  }

  const childId = typeof body?.childId === 'string' ? body.childId : '';
  const fields =
    body?.fields && typeof body.fields === 'object' && !Array.isArray(body.fields)
      ? (body.fields as Record<string, unknown>)
      : null;
  const recipientAddressBlock =
    typeof body?.recipientAddressBlock === 'string'
      ? body.recipientAddressBlock.trim()
      : '';
  const objectField =
    typeof body?.object === 'string' && body.object.trim().length > 0
      ? body.object.trim()
      : modele.defaultObject;
  const mode = body?.mode === 'preview' ? 'preview' : 'download';

  if (!childId) return badRequest("L'enfant doit être sélectionné.");
  if (!fields) return badRequest('Champs invalides.');
  if (!recipientAddressBlock)
    return badRequest('Le destinataire doit être renseigné.');

  // Validation des champs requis spécifiques au modèle
  const stringFields: Record<string, string> = {};
  for (const f of modele.fields) {
    const raw = fields[f.name];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (f.required && !value) {
      return badRequest(`Le champ « ${f.label} » est requis.`);
    }
    stringFields[f.name] = value;
  }

  // Charger profil parent
  const { data: family, error: familyError } = await supabase
    .from('family_profiles')
    .select('id, first_name, last_name, location, phone')
    .eq('user_id', user.id)
    .maybeSingle();
  if (familyError || !family) return unauthorized();

  // Vérifier que l'enfant appartient à la famille
  const { data: child, error: childError } = await supabase
    .from('child_profiles')
    .select('id, first_name, last_name, birth_date, family_id')
    .eq('id', childId)
    .eq('family_id', family.id)
    .maybeSingle();
  if (childError || !child) {
    return badRequest('Enfant introuvable ou non rattaché à votre compte.');
  }

  const fullParentName = [family.first_name, family.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || (user.email ?? 'Parent');

  const fullChildName = [child.first_name, child.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || child.first_name || 'Mon enfant';

  // Adresse parent → on stocke `location` (ville). Si elle n'est pas
  // décomposée, on la passe telle quelle. Le département MDPH éventuel
  // est porté par les fields spécifiques au modèle.
  const senderAddressLines: string[] = [];
  if (family.location) senderAddressLines.push(family.location);

  const place = family.location?.split(',')[0]?.trim() || 'Lieu';

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateCourrierPDF({
      modeleId: modele.id,
      sender: {
        fullName: fullParentName,
        addressLines: senderAddressLines,
        email: user.email ?? undefined,
        phone: family.phone ?? undefined,
      },
      child: {
        fullName: fullChildName,
        birthDate: child.birth_date ?? undefined,
      },
      recipient: {
        addressBlock: recipientAddressBlock,
      },
      object: objectField,
      place,
      date: new Date(),
      fields: stringFields,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF.', detail: err?.message },
      { status: 500 }
    );
  }

  const filenameBase = `${modele.id}-${sanitizeFilename(fullChildName.toLowerCase().replace(/\s+/g, '-'))}-${new Date().toISOString().slice(0, 10)}`;
  const disposition =
    mode === 'preview'
      ? `inline; filename="${filenameBase}.pdf"`
      : `attachment; filename="${filenameBase}.pdf"`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
      'Cache-Control': 'no-store',
    },
  });
}
