import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { assertAdmin } from '@/lib/assert-admin';
import {
  getRelanceJ1Email,
  getRelanceJ3Email,
  getRelanceJ7Email,
} from '@/lib/email-templates/relance-documents';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ──────────────────────────────────────────────
// GET — List educators with pending documents + relance history
// ──────────────────────────────────────────────
export async function GET() {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  const supabase = getSupabase();

  try {
    // Fetch educators with pending/null verification_status
    const { data: profiles, error: profilesError } = await supabase
      .from('educator_profiles')
      .select('id, user_id, first_name, last_name, created_at, verification_status')
      .or('verification_status.is.null,verification_status.eq.pending_documents')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Attempt to fetch relances — graceful fallback if table doesn't exist
    let relancesMap: Record<string, { last_sent_at: string; last_template: string; total: number }> = {};
    let relancesToday = 0;
    let relancesThisWeek = 0;

    try {
      const { data: relances, error: relancesError } = await supabase
        .from('educator_relances')
        .select('educator_id, template, sent_at, status')
        .eq('status', 'sent')
        .order('sent_at', { ascending: false });

      if (!relancesError && relances) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        for (const r of relances) {
          const sentDate = new Date(r.sent_at);
          if (sentDate >= todayStart) relancesToday++;
          if (sentDate >= weekStart) relancesThisWeek++;

          if (!relancesMap[r.educator_id]) {
            relancesMap[r.educator_id] = {
              last_sent_at: r.sent_at,
              last_template: r.template,
              total: 1,
            };
          } else {
            relancesMap[r.educator_id].total++;
          }
        }
      }
    } catch {
      // Table doesn't exist yet — continue with empty relances
    }

    // Enrich each educator with email + document count + relance info
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const educators = await Promise.all(
      (profiles || []).map(async (profile) => {
        // Get email from auth (skip if user_id is not a valid UUID)
        let userData: any = null;
        if (UUID_RE.test(profile.user_id)) {
          try {
            const res = await supabase.auth.admin.getUserById(profile.user_id);
            userData = res.data;
          } catch {
            // Auth user may have been deleted
          }
        }

        // Count uploaded documents (graceful if table doesn't exist)
        let count = 0;
        try {
          const { count: docCount, error: docError } = await supabase
            .from('verification_documents')
            .select('*', { count: 'exact', head: true })
            .eq('educator_id', profile.id);
          if (!docError) count = docCount || 0;
        } catch {
          // Table may not exist
        }

        const daysSinceSignup = Math.floor(
          (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        const relanceInfo = relancesMap[profile.id] || null;

        // Suggest which template to use
        let suggestedTemplate: 'j1' | 'j3' | 'j7' = 'j1';
        if (daysSinceSignup >= 7) suggestedTemplate = 'j7';
        else if (daysSinceSignup >= 3) suggestedTemplate = 'j3';

        return {
          id: profile.id,
          user_id: profile.user_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: userData?.user?.email || 'N/A',
          created_at: profile.created_at,
          verification_status: profile.verification_status,
          documents_count: count,
          days_since_signup: daysSinceSignup,
          last_relance_at: relanceInfo?.last_sent_at || null,
          last_relance_template: relanceInfo?.last_template || null,
          total_relances: relanceInfo?.total || 0,
          suggested_template: suggestedTemplate,
        };
      })
    );

    // Stats
    const neverRelanced = educators.filter((e) => e.total_relances === 0).length;

    return NextResponse.json({
      educators,
      stats: {
        total: educators.length,
        relancesToday,
        relancesThisWeek,
        neverRelanced,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as any).message)
        : JSON.stringify(error);
    console.error('Erreur API relances GET:', message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ──────────────────────────────────────────────
// POST — Send a relance email
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { user, error: authError } = await assertAdmin();
  if (authError) return authError;

  const supabase = getSupabase();

  try {
    const body = await request.json();
    const { educatorId, template } = body as {
      educatorId: string;
      template: 'j1' | 'j3' | 'j7';
    };

    if (!educatorId || !template || !['j1', 'j3', 'j7'].includes(template)) {
      return NextResponse.json(
        { success: false, message: 'Paramètres invalides (educatorId, template requis)' },
        { status: 400 }
      );
    }

    // Fetch educator profile
    const { data: educator, error: educatorError } = await supabase
      .from('educator_profiles')
      .select('id, user_id, first_name, last_name')
      .eq('id', educatorId)
      .single();

    if (educatorError || !educator) {
      return NextResponse.json(
        { success: false, message: 'Éducateur introuvable' },
        { status: 404 }
      );
    }

    // Get email
    const { data: userData } = await supabase.auth.admin.getUserById(educator.user_id);
    const educatorEmail = userData?.user?.email;
    if (!educatorEmail) {
      return NextResponse.json(
        { success: false, message: 'Email introuvable pour cet éducateur' },
        { status: 400 }
      );
    }

    // Count documents
    const { count } = await supabase
      .from('verification_documents')
      .select('*', { count: 'exact', head: true })
      .eq('educator_id', educatorId);
    const docsCount = count || 0;

    // Build email HTML based on template
    const templateSubjects: Record<string, string> = {
      j1: `Bienvenue ${educator.first_name} ! Finalisez votre inscription NeuroCare`,
      j3: `Rappel : ${4 - docsCount} document${4 - docsCount > 1 ? 's' : ''} en attente - NeuroCare`,
      j7: `Dernier rappel : votre profil NeuroCare est incomplet`,
    };

    const templateFns: Record<string, (name: string, docs: number) => string> = {
      j1: getRelanceJ1Email,
      j3: getRelanceJ3Email,
      j7: getRelanceJ7Email,
    };

    const html = templateFns[template](educator.first_name, docsCount);
    const subject = templateSubjects[template];

    // Send via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'NeuroCare Pro <admin@neuro-care.fr>',
      to: [educatorEmail],
      subject,
      html,
    });

    const status = sendError ? 'failed' : 'sent';

    // Record the relance — graceful if table doesn't exist
    try {
      await supabase.from('educator_relances').insert({
        educator_id: educatorId,
        template,
        sent_by: user!.id,
        status,
      });
    } catch {
      // Table might not exist yet — not blocking
      console.warn('educator_relances table may not exist, relance not recorded');
    }

    if (sendError) {
      console.error('Erreur envoi relance:', sendError);
      return NextResponse.json(
        { success: false, message: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Relance ${template.toUpperCase()} envoyée à ${educatorEmail}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Erreur API relances POST:', message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
