import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';
import {
  getRelanceJ1Email,
  getRelanceJ3Email,
  getRelanceJ7Email,
} from '@/lib/email-templates/relance-documents';

export const dynamic = 'force-dynamic';

const templateFns: Record<string, (name: string, docs: number) => string> = {
  j1: getRelanceJ1Email,
  j3: getRelanceJ3Email,
  j7: getRelanceJ7Email,
};

function getSubject(template: string, firstName: string, docsCount: number): string {
  switch (template) {
    case 'j1':
      return `Bienvenue ${firstName} ! Finalisez votre inscription NeuroCare`;
    case 'j3': {
      const missing = Math.max(0, 4 - docsCount);
      return `Rappel : ${missing} document${missing > 1 ? 's' : ''} en attente - NeuroCare`;
    }
    case 'j7':
      return 'Dernier rappel : votre profil NeuroCare est incomplet';
    default:
      return '';
  }
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  const template = request.nextUrl.searchParams.get('template') || 'j1';
  const educatorId = request.nextUrl.searchParams.get('educatorId');
  const fn = templateFns[template];

  if (!fn) {
    return NextResponse.json({ error: 'Template invalide' }, { status: 400 });
  }

  // Preview générique (clic sur les badges de la légende) — données factices
  if (!educatorId) {
    const html = fn('Prenom', 0);
    return NextResponse.json({
      html,
      subject: getSubject(template, 'Prenom', 0),
      to: null,
      firstName: 'Prenom',
      docsCount: 0,
    });
  }

  // Preview ciblée sur un éducateur — données réelles
  const supabase = getSupabase();

  const { data: educator, error: educatorError } = await supabase
    .from('educator_profiles')
    .select('id, user_id, first_name, last_name')
    .eq('id', educatorId)
    .single();

  if (educatorError || !educator) {
    return NextResponse.json({ error: 'Éducateur introuvable' }, { status: 404 });
  }

  let email: string | null = null;
  if (UUID_RE.test(educator.user_id)) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(educator.user_id);
      email = userData?.user?.email || null;
    } catch {
      // ignore — fallback null
    }
  }

  const { count } = await supabase
    .from('verification_documents')
    .select('*', { count: 'exact', head: true })
    .eq('educator_id', educatorId);
  const docsCount = count || 0;

  const html = fn(educator.first_name, docsCount);
  const subject = getSubject(template, educator.first_name, docsCount);

  return NextResponse.json({
    html,
    subject,
    to: email,
    firstName: educator.first_name,
    docsCount,
  });
}
