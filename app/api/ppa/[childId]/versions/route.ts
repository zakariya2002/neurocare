import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyChildAccess(userId: string, childId: string) {
  // Vérifier si l'utilisateur est la famille parente de cet enfant
  const { data: familyProfile } = await supabase
    .from('family_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (familyProfile) {
    const { data: child } = await supabase
      .from('child_profiles')
      .select('id')
      .eq('id', childId)
      .eq('family_id', familyProfile.id)
      .single();
    if (child) return true;
  }

  // Vérifier si l'utilisateur est un éducateur ayant un RDV avec cet enfant
  const { data: educatorProfile } = await supabase
    .from('educator_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (educatorProfile) {
    const { data: child } = await supabase
      .from('child_profiles')
      .select('family_id')
      .eq('id', childId)
      .single();

    if (child) {
      const { data: appointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('educator_id', educatorProfile.id)
        .eq('family_id', child.family_id)
        .in('status', ['accepted', 'confirmed', 'in_progress', 'completed'])
        .limit(1)
        .single();
      if (appointment) return true;
    }
  }

  return false;
}

// GET - Récupérer l'historique des versions du PPA
export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    // Vérifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const { childId } = params;

    // Vérifier l'accès à cet enfant
    if (!(await verifyChildAccess(user!.id, childId))) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { data: versions, error } = await supabase
      .from('child_ppa_versions')
      .select('id, version_number, version_label, evaluation_date, archived_at, archived_by')
      .eq('child_id', childId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error fetching PPA versions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ versions: versions || [] });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Créer une nouvelle version (archiver le PPA actuel)
export async function POST(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    // Vérifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const { childId } = params;
    const body = await request.json();
    const { versionLabel } = body;

    // Vérifier l'accès à cet enfant
    if (!(await verifyChildAccess(user!.id, childId))) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const userId = user!.id;

    // Récupérer le PPA actuel
    const { data: currentPpa, error: ppaError } = await supabase
      .from('child_ppa')
      .select('*')
      .eq('child_id', childId)
      .single();

    if (ppaError || !currentPpa) {
      return NextResponse.json({ error: 'PPA non trouvé' }, { status: 404 });
    }

    // Compter les versions existantes pour déterminer le numéro
    const { count } = await supabase
      .from('child_ppa_versions')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId);

    const versionNumber = (count || 0) + 1;

    // Créer la version archivée
    const { data: newVersion, error: insertError } = await supabase
      .from('child_ppa_versions')
      .insert({
        ppa_id: currentPpa.id,
        child_id: childId,
        version_number: versionNumber,
        version_label: versionLabel || `Version ${versionNumber}`,

        // Copier tous les champs du PPA
        educator_name: currentPpa.educator_name,
        educator_structure: currentPpa.educator_structure,
        evaluation_date: currentPpa.evaluation_date,
        evaluation_period_start: currentPpa.evaluation_period_start,
        evaluation_period_end: currentPpa.evaluation_period_end,

        previous_support: currentPpa.previous_support,
        schooling_history: currentPpa.schooling_history,
        family_context: currentPpa.family_context,
        significant_events: currentPpa.significant_events,
        life_events: currentPpa.life_events,

        school_info: currentPpa.school_info,
        other_professionals: currentPpa.other_professionals,
        family_expectations: currentPpa.family_expectations,

        comm_receptive: currentPpa.comm_receptive,
        comm_expressive: currentPpa.comm_expressive,
        comm_written: currentPpa.comm_written,

        autonomy_personal: currentPpa.autonomy_personal,
        autonomy_domestic: currentPpa.autonomy_domestic,
        autonomy_community: currentPpa.autonomy_community,

        social_interpersonal: currentPpa.social_interpersonal,
        social_leisure: currentPpa.social_leisure,
        social_adaptation: currentPpa.social_adaptation,

        motor_global: currentPpa.motor_global,
        motor_fine: currentPpa.motor_fine,

        sensory_visual: currentPpa.sensory_visual,
        sensory_auditory: currentPpa.sensory_auditory,
        sensory_gustatory: currentPpa.sensory_gustatory,
        sensory_olfactory: currentPpa.sensory_olfactory,
        sensory_tactile: currentPpa.sensory_tactile,
        sensory_proprioceptive: currentPpa.sensory_proprioceptive,
        sensory_vestibular: currentPpa.sensory_vestibular,

        cognitive_facilitating_conditions: currentPpa.cognitive_facilitating_conditions,
        cognitive_position: currentPpa.cognitive_position,
        cognitive_guidance: currentPpa.cognitive_guidance,
        cognitive_material_structure: currentPpa.cognitive_material_structure,
        cognitive_attention_time: currentPpa.cognitive_attention_time,
        cognitive_max_tasks: currentPpa.cognitive_max_tasks,
        cognitive_work_leads: currentPpa.cognitive_work_leads,

        psycho_affective: currentPpa.psycho_affective,
        problem_behaviors: currentPpa.problem_behaviors,

        priority_axes: currentPpa.priority_axes,
        session_frequency: currentPpa.session_frequency,
        intervention_locations: currentPpa.intervention_locations,
        resources_needed: currentPpa.resources_needed,

        next_review_date: currentPpa.next_review_date,
        review_frequency: currentPpa.review_frequency,
        observations: currentPpa.observations,

        // Métadonnées originales
        original_created_at: currentPpa.created_at,
        original_updated_at: currentPpa.updated_at,
        original_created_by: currentPpa.created_by,
        original_last_updated_by: currentPpa.last_updated_by,

        // Archivage
        archived_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating version:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      version: newVersion,
      message: `Version ${versionNumber} créée avec succès`
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
