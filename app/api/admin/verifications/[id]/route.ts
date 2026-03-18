import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';
import { logAdminAction } from '@/lib/admin-audit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const educatorId = params.id;

    // Fetch educator profile
    const { data: profile, error: profileError } = await supabase
      .from('educator_profiles')
      .select('*')
      .eq('id', educatorId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
    }

    // Fetch email via auth admin
    const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);

    // Fetch documents
    const { data: documents, error: docsError } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('educator_id', educatorId)
      .order('uploaded_at', { ascending: false });

    if (docsError) throw docsError;

    return NextResponse.json({
      educator: {
        ...profile,
        email: userData?.user?.email || 'N/A',
      },
      documents: documents || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const educatorId = params.id;
    const body = await request.json();
    const { action } = body;

    // Whitelist des actions autorisées
    const allowedActions = ['approve_document', 'reject_document', 'save_notes', 'mark_interview_scheduled', 'approve_educator', 'reject_interview'];
    if (!allowedActions.includes(action)) {
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }

    // Audit log (fire-and-forget, ne bloque pas l'action)
    logAdminAction({
      adminUserId: user!.id,
      adminEmail: user!.email,
      action: `verification_${action}`,
      targetType: 'educator',
      targetId: educatorId,
      details: body,
    });

    switch (action) {
      case 'approve_document': {
        const { documentId, documentType } = body;

        await supabase
          .from('verification_documents')
          .update({ status: 'approved', verified_at: new Date().toISOString() })
          .eq('id', documentId);

        if (documentType === 'criminal_record') {
          await supabase.from('criminal_record_verifications').insert({
            educator_id: educatorId,
            verified_at: new Date().toISOString(),
            is_clean: true,
            notes: 'Casier vierge - Approuvé',
          });
        }

        // Check if all documents are approved
        const { data: allDocs } = await supabase
          .from('verification_documents')
          .select('status, document_type')
          .eq('educator_id', educatorId);

        const requiredTypes = ['diploma', 'criminal_record', 'id_card', 'insurance'];
        const approvedTypes = allDocs?.filter(d => d.status === 'approved').map(d => d.document_type) || [];
        const allApproved = requiredTypes.every(type => approvedTypes.includes(type));

        if (allApproved) {
          await supabase
            .from('educator_profiles')
            .update({ verification_status: 'documents_verified' })
            .eq('id', educatorId);
        }

        return NextResponse.json({ success: true });
      }

      case 'reject_document': {
        const { documentId, documentType, reason } = body;

        await supabase
          .from('verification_documents')
          .update({
            status: 'rejected',
            verified_at: new Date().toISOString(),
            rejection_reason: reason,
          })
          .eq('id', documentId);

        if (documentType === 'criminal_record') {
          await supabase.from('criminal_record_verifications').insert({
            educator_id: educatorId,
            verified_at: new Date().toISOString(),
            is_clean: false,
            notes: reason,
          });

          await supabase
            .from('educator_profiles')
            .update({
              verification_status: 'rejected_criminal_record',
              verification_badge: false,
              profile_visible: false,
            })
            .eq('id', educatorId);
        }

        return NextResponse.json({ success: true });
      }

      case 'save_notes': {
        const { adminNotes, scheduledDate } = body;

        await supabase
          .from('educator_profiles')
          .update({
            admin_notes: adminNotes,
            interview_scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : null,
          })
          .eq('id', educatorId);

        return NextResponse.json({ success: true });
      }

      case 'mark_interview_scheduled': {
        const { adminNotes, scheduledDate } = body;

        await supabase
          .from('educator_profiles')
          .update({
            verification_status: 'interview_scheduled',
            admin_notes: adminNotes,
            interview_scheduled_date: new Date(scheduledDate).toISOString(),
          })
          .eq('id', educatorId);

        return NextResponse.json({ success: true });
      }

      case 'approve_educator': {
        await supabase
          .from('educator_profiles')
          .update({
            verification_status: 'verified',
            verification_badge: true,
            profile_visible: true,
          })
          .eq('id', educatorId);

        await supabase
          .from('video_interviews')
          .update({
            status: 'passed',
            overall_result: 'passed',
            completed_at: new Date().toISOString(),
          })
          .eq('educator_id', educatorId)
          .eq('status', 'pending');

        return NextResponse.json({ success: true });
      }

      case 'reject_interview': {
        const { reason } = body;

        await supabase
          .from('video_interviews')
          .update({
            status: 'failed',
            overall_result: 'failed',
            failure_reason: reason,
            completed_at: new Date().toISOString(),
          })
          .eq('educator_id', educatorId)
          .eq('status', 'pending');

        await supabase
          .from('educator_profiles')
          .update({
            verification_status: 'rejected_interview',
            verification_badge: false,
            profile_visible: false,
          })
          .eq('id', educatorId);

        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
