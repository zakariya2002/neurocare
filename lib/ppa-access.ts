import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Vérifie l'accès au PPA d'un enfant pour un utilisateur donné.
 *
 * Règles :
 * - Famille parente (via family_profiles) → read + write
 * - Éducateur avec un appointment lié à la famille → read + write
 * - Éducateur invité via ppa_collaborations (status accepted) → read (toujours), write si permission='write'
 */

export interface PpaAccess {
  canRead: boolean;
  canWrite: boolean;
  reason: string;
}

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function canAccessPpa(userId: string, childId: string): Promise<PpaAccess> {
  const supabase = getServiceClient();

  // 1. Famille parente
  const { data: familyProfile } = await supabase
    .from('family_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (familyProfile) {
    const { data: child } = await supabase
      .from('child_profiles')
      .select('id')
      .eq('id', childId)
      .eq('family_id', familyProfile.id)
      .maybeSingle();
    if (child) return { canRead: true, canWrite: true, reason: 'family_parent' };
  }

  // 2. Éducateur ayant un appointment avec la famille de l'enfant
  const { data: educatorProfile } = await supabase
    .from('educator_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!educatorProfile) {
    return { canRead: false, canWrite: false, reason: 'no_role' };
  }

  const { data: child } = await supabase
    .from('child_profiles')
    .select('family_id')
    .eq('id', childId)
    .maybeSingle();

  if (child) {
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id')
      .eq('educator_id', educatorProfile.id)
      .eq('family_id', child.family_id)
      .in('status', ['accepted', 'confirmed', 'in_progress', 'completed'])
      .limit(1)
      .maybeSingle();
    if (appointment) return { canRead: true, canWrite: true, reason: 'direct_appointment' };
  }

  // 3. Éducateur invité via ppa_collaborations
  const { data: collab } = await supabase
    .from('ppa_collaborations')
    .select('permission, status')
    .eq('child_id', childId)
    .eq('invited_educator_id', educatorProfile.id)
    .eq('status', 'accepted')
    .maybeSingle();

  if (collab) {
    return {
      canRead: true,
      canWrite: collab.permission === 'write',
      reason: 'collaboration',
    };
  }

  return { canRead: false, canWrite: false, reason: 'no_access' };
}
