import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRouteSupabase } from '@/lib/announcements/supabase-server';
import { updateResponseSchema } from '@/lib/announcements/schemas';

export const dynamic = 'force-dynamic';

const FAMILY_ALLOWED = ['read', 'shortlisted', 'accepted', 'declined'] as const;
const PRO_ALLOWED = ['withdrawn'] as const;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; responseId: string } }
) {
  const supabase = await getRouteSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = updateResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation échouée', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const targetStatus = parsed.data.status;

  // Charger la réponse + l'annonce
  const { data: response, error: respErr } = await supabase
    .from('announcement_responses')
    .select('id, announcement_id, educator_id, status')
    .eq('id', params.responseId)
    .eq('announcement_id', params.id)
    .maybeSingle();

  if (respErr) return NextResponse.json({ error: respErr.message }, { status: 500 });
  if (!response) return NextResponse.json({ error: 'Réponse introuvable' }, { status: 404 });

  // Déterminer le rôle : famille propriétaire de l'annonce, ou pro propriétaire de la réponse ?
  const { data: family } = await supabase
    .from('family_profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  let isFamilyOwner = false;
  if (family) {
    const { data: ann } = await supabase
      .from('family_announcements')
      .select('id')
      .eq('id', params.id)
      .eq('family_id', family.id)
      .maybeSingle();
    isFamilyOwner = !!ann;
  }

  const { data: educator } = await supabase
    .from('educator_profiles')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  const isProOwner = !!educator && educator.id === response.educator_id;

  if (!isFamilyOwner && !isProOwner) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Validation de transition
  if (isFamilyOwner && !FAMILY_ALLOWED.includes(targetStatus as any)) {
    return NextResponse.json(
      { error: 'Transition de statut non autorisée pour la famille' },
      { status: 403 }
    );
  }
  if (!isFamilyOwner && isProOwner && !PRO_ALLOWED.includes(targetStatus as any)) {
    return NextResponse.json(
      { error: 'Transition de statut non autorisée pour le pro' },
      { status: 403 }
    );
  }

  // Pas de transition depuis un statut final (accepted/declined/withdrawn → stop)
  if (['accepted', 'declined', 'withdrawn'].includes(response.status)) {
    return NextResponse.json(
      { error: `Réponse déjà en statut « ${response.status} »` },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const update: Record<string, any> = { status: targetStatus };
  // Le schéma DB n'a que read_at, responded_at, withdrawn_at.
  // shortlisted/accepted/declined utilisent responded_at (timestamp générique de décision famille).
  if (targetStatus === 'read') update.read_at = now;
  if (targetStatus === 'shortlisted' || targetStatus === 'accepted' || targetStatus === 'declined') {
    update.responded_at = now;
  }
  if (targetStatus === 'withdrawn') update.withdrawn_at = now;

  // Cas accepted : on bascule l'annonce en 'filled' et on lie filled_by_response_id
  // On utilise le client service-role pour garantir la cohérence si la RLS UPDATE
  // venait à bloquer un side-effect.
  if (targetStatus === 'accepted') {
    const service = getServiceClient();

    const { error: updRespErr } = await service
      .from('announcement_responses')
      .update(update)
      .eq('id', params.responseId);
    if (updRespErr) {
      return NextResponse.json({ error: updRespErr.message }, { status: 500 });
    }

    const { error: updAnnErr } = await service
      .from('family_announcements')
      .update({
        status: 'filled',
        filled_by_response_id: params.responseId,
      })
      .eq('id', params.id);
    if (updAnnErr) {
      return NextResponse.json({ error: updAnnErr.message }, { status: 500 });
    }

    // Optionnel : passer les autres réponses actives en 'declined'
    await service
      .from('announcement_responses')
      .update({ status: 'declined', responded_at: now })
      .eq('announcement_id', params.id)
      .neq('id', params.responseId)
      .in('status', ['pending', 'read', 'shortlisted']);

    const { data: refreshed } = await service
      .from('announcement_responses')
      .select('*')
      .eq('id', params.responseId)
      .single();

    return NextResponse.json(refreshed);
  }

  const { data, error } = await supabase
    .from('announcement_responses')
    .update(update)
    .eq('id', params.responseId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
