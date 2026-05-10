/**
 * API Onboarding post-diagnostic (A1).
 *
 * GET  /api/family/onboarding?child_id=...   → retourne la progression d'un enfant
 * GET  /api/family/onboarding                → retourne la progression de tous les enfants
 * POST /api/family/onboarding                → met à jour une étape
 *   body : { child_id, step: 'doctor'|'mdph'|'pco_fip'|'school'|'aids', data: {...} }
 *   ou    { child_id, action: 'dismiss' | 'undismiss' | 'reset' }
 *
 * Sécurité :
 * - feature flag onboardingPostDiag → 404 sinon
 * - auth obligatoire (cookie session)
 * - vérifie que child_id appartient bien à l'utilisateur via family_profiles
 * - écrit avec le client serveur respectant le RLS
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import { createServerSupabasePublic } from '@/lib/supabase-server-helpers';
import {
  ONBOARDING_STEP_KEYS,
  ONBOARDING_TOTAL_STEPS,
  STEP_COLUMN,
  STEP_PARSERS,
  type OnboardingStepKey,
  type OnboardingProgressRow,
} from '@/lib/family/onboarding';

export const dynamic = 'force-dynamic';

function notFoundJson() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

async function ensureChildBelongsToUser(supabase: ReturnType<typeof createServerSupabasePublic>, userId: string, childId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('child_profiles')
    .select('id, family_id, family_profiles:family_id (user_id)')
    .eq('id', childId)
    .maybeSingle();

  if (error || !data) return false;
  const fp = (data as any).family_profiles;
  const owner = Array.isArray(fp) ? fp[0]?.user_id : fp?.user_id;
  return owner === userId;
}

function isStepKey(v: unknown): v is OnboardingStepKey {
  return typeof v === 'string' && (ONBOARDING_STEP_KEYS as readonly string[]).includes(v);
}

export async function GET(request: NextRequest) {
  if (!FEATURES.onboardingPostDiag) return notFoundJson();

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const childId = request.nextUrl.searchParams.get('child_id');

  if (childId) {
    const ok = await ensureChildBelongsToUser(supabase, user.id, childId);
    if (!ok) return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 });

    const { data, error } = await supabase
      .from('family_onboarding_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('child_id', childId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progress: (data as OnboardingProgressRow | null) ?? null });
  }

  // Toute la progression de l'utilisateur (pour le bloc dashboard)
  const { data, error } = await supabase
    .from('family_onboarding_progress')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: (data as OnboardingProgressRow[]) ?? [] });
}

export async function POST(request: NextRequest) {
  if (!FEATURES.onboardingPostDiag) return notFoundJson();

  const cookieStore = await cookies();
  const supabase = createServerSupabasePublic({ cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('JSON invalide');
  }

  const obj = (body && typeof body === 'object' && !Array.isArray(body)) ? body as Record<string, unknown> : null;
  if (!obj) return badRequest('Body invalide');

  const childId = typeof obj.child_id === 'string' ? obj.child_id : null;
  if (!childId) return badRequest('child_id manquant');

  const ok = await ensureChildBelongsToUser(supabase, user.id, childId);
  if (!ok) return NextResponse.json({ error: 'Enfant introuvable' }, { status: 404 });

  // Action de gestion (dismiss / undismiss / reset)
  const action = typeof obj.action === 'string' ? obj.action : null;
  if (action) {
    if (action === 'dismiss') {
      const { data, error } = await supabase
        .from('family_onboarding_progress')
        .upsert(
          {
            user_id: user.id,
            child_id: childId,
            dismissed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,child_id' }
        )
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ progress: data });
    }
    if (action === 'undismiss') {
      const { data, error } = await supabase
        .from('family_onboarding_progress')
        .update({ dismissed_at: null })
        .eq('user_id', user.id)
        .eq('child_id', childId)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ progress: data });
    }
    if (action === 'reset') {
      const { error } = await supabase
        .from('family_onboarding_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('child_id', childId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ progress: null });
    }
    return badRequest('Action inconnue');
  }

  // Mise à jour d'une étape
  const stepKey = obj.step;
  if (!isStepKey(stepKey)) return badRequest('Étape invalide');

  const parser = STEP_PARSERS[stepKey];
  const parsed = parser(obj.data);
  if (!parsed) return badRequest('Données d\'étape invalides');

  // Charger l'existant pour calculer si on est désormais "complete"
  const { data: existing, error: existingError } = await supabase
    .from('family_onboarding_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('child_id', childId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const column = STEP_COLUMN[stepKey];
  const merged: Record<string, unknown> = {
    user_id: user.id,
    child_id: childId,
    step_doctor: existing?.step_doctor ?? null,
    step_mdph: existing?.step_mdph ?? null,
    step_pco_fip: existing?.step_pco_fip ?? null,
    step_school: existing?.step_school ?? null,
    step_aids: existing?.step_aids ?? null,
    [column]: parsed,
  };

  // Recalculer completed_at
  const completedCount = ONBOARDING_STEP_KEYS.reduce((n, key) => {
    const c = STEP_COLUMN[key];
    const v = merged[c] as { completed?: boolean } | null;
    return n + (v?.completed ? 1 : 0);
  }, 0);

  if (completedCount >= ONBOARDING_TOTAL_STEPS) {
    merged.completed_at = existing?.completed_at ?? new Date().toISOString();
  } else {
    merged.completed_at = null;
  }

  const { data, error } = await supabase
    .from('family_onboarding_progress')
    .upsert(merged, { onConflict: 'user_id,child_id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data });
}
