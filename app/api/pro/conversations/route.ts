import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRouteSupabase } from '@/lib/announcements/supabase-server';

export const dynamic = 'force-dynamic';

// Service-role client : bypass RLS pour charger toutes les conversations du pro,
// peu importe son statut (vérifié ou non, suspendu ou non).
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/pro/conversations
 * Charge les conversations du professionnel connecté. Utilise service_role
 * côté serveur pour contourner les éventuels problèmes RLS / propagation
 * de session — particulièrement utile pour les pros non vérifiés.
 */
export async function GET() {
  const supabase = await getRouteSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Profile éducateur du user connecté
  const { data: profile, error: profileError } = await adminClient
    .from('educator_profiles')
    .select('id, verification_badge')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[/api/pro/conversations] profile error:', profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ conversations: [], unverified: false });
  }

  const { data: conversations, error: convError } = await adminClient
    .from('conversations')
    .select(`
      *,
      educator_profiles(*),
      family_profiles(*)
    `)
    .eq('educator_id', profile.id)
    .order('updated_at', { ascending: false });

  if (convError) {
    console.error('[/api/pro/conversations] conv error:', convError);
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }

  return NextResponse.json({
    conversations: conversations || [],
    unverified: profile.verification_badge !== true,
  });
}
