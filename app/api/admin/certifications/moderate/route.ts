import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { certId, action, status, notes, certName, educatorUserId } = await request.json();

    if (!certId || !action) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    if (action === 'approve') {
      const { error } = await supabase
        .from('certifications')
        .update({
          verification_status: status || 'document_verified',
          verification_date: new Date().toISOString(),
          verification_notes: notes || null
        })
        .eq('id', certId);
      if (error) throw error;

      if (educatorUserId) {
        const statusLabel = status === 'document_verified' ? 'vérifiée' : 'confirmée officiellement';
        await supabase.from('notifications').insert({
          user_id: educatorUserId,
          type: 'system',
          title: 'Certification approuvée',
          content: `Votre certification "${certName}" a été ${statusLabel}.`,
          link: '/dashboard/educator/profile',
          metadata: { certification_id: certId },
        });
      }
    } else if (action === 'reject') {
      const { error } = await supabase
        .from('certifications')
        .update({
          verification_status: 'rejected',
          verification_date: new Date().toISOString(),
          verification_notes: notes
        })
        .eq('id', certId);
      if (error) throw error;

      if (educatorUserId) {
        await supabase.from('notifications').insert({
          user_id: educatorUserId,
          type: 'system',
          title: 'Certification rejetée',
          content: `Votre certification "${certName}" a été rejetée. Raison : ${notes}`,
          link: '/dashboard/educator/profile',
          metadata: { certification_id: certId },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
