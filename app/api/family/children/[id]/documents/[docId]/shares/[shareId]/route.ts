/**
 * API Coffre-fort — révocation d'un partage (B2 — coffreFortSante).
 *
 * DELETE /api/family/children/[id]/documents/[docId]/shares/[shareId]
 *        Révoque un partage (granted_by = auth.uid() en RLS).
 *        Audit log : action='share_revoke'.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FEATURES } from '@/lib/feature-flags';
import {
  createServerSupabasePublic,
  createServerSupabaseHealth,
} from '@/lib/supabase-server-helpers';

export const dynamic = 'force-dynamic';

function notFoundJson() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}

async function ensureChildOwnedByUser(
  supabase: ReturnType<typeof createServerSupabasePublic>,
  userId: string,
  childId: string
): Promise<boolean> {
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

function clientIp(request: NextRequest): string | null {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip') ?? null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string; shareId: string }> }
) {
  if (!FEATURES.coffreFortSante) return notFoundJson();
  const { id: childId, docId, shareId } = await params;
  const cookieStore = await cookies();

  const sbPublic = createServerSupabasePublic({ cookieStore });
  const { data: { user } } = await sbPublic.auth.getUser();
  if (!user) return unauthorized();
  const owned = await ensureChildOwnedByUser(sbPublic, user.id, childId);
  if (!owned) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });

  const sbHealth = createServerSupabaseHealth({ cookieStore });

  const { data: share } = await sbHealth
    .from('child_document_shares')
    .select('id, document_id')
    .eq('id', shareId)
    .eq('document_id', docId)
    .maybeSingle();
  if (!share) return NextResponse.json({ error: 'Partage introuvable' }, { status: 404 });

  const { error: deleteError } = await sbHealth
    .from('child_document_shares')
    .delete()
    .eq('id', shareId)
    .eq('document_id', docId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Audit log
  await sbHealth
    .from('child_document_access_log')
    .insert({
      document_id: docId,
      user_id: user.id,
      action: 'share_revoke',
      ip: clientIp(request),
      user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    })
    .then(() => undefined, () => undefined);

  return NextResponse.json({ ok: true });
}
