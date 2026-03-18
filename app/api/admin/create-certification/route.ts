import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';
import { logAdminAction } from '@/lib/admin-audit';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  const { user, error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { educator_id } = body;

    if (!educator_id) {
      return NextResponse.json({ error: 'educator_id requis' }, { status: 400 });
    }

    // Vérifier si le profil existe
    const { data: educator, error: educatorError } = await supabase
      .from('educator_profiles')
      .select('id, first_name, last_name')
      .eq('id', educator_id)
      .single();

    if (educatorError || !educator) {
      return NextResponse.json({ error: 'Éducateur non trouvé', details: educatorError?.message }, { status: 404 });
    }

    // Vérifier les certifications existantes
    const { data: existingCerts, error: certsError } = await supabase
      .from('certifications')
      .select('*')
      .eq('educator_id', educator_id);

    if (certsError) {
      return NextResponse.json({ error: 'Erreur lors de la vérification', details: certsError.message }, { status: 500 });
    }

    // Si certification existe, mettre à jour le statut
    if (existingCerts && existingCerts.length > 0) {
      const { error: updateError } = await supabase
        .from('certifications')
        .update({ verification_status: 'document_verified' })
        .eq('educator_id', educator_id);

      if (updateError) {
        return NextResponse.json({ error: 'Erreur lors de la mise à jour', details: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Certifications mises à jour',
        educator,
        certifications: existingCerts
      });
    }

    // Sinon, créer une nouvelle certification
    // Types valides: 'ABA', 'TEACCH', 'PECS', 'OTHER'
    const { data: newCert, error: insertError } = await supabase
      .from('certifications')
      .insert({
        educator_id,
        name: 'Diplôme d\'État d\'Éducateur Spécialisé',
        type: 'OTHER',
        issuing_organization: 'Ministère de l\'Enseignement Supérieur',
        issue_date: '2023-06-15',
        verification_status: 'document_verified'
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Erreur lors de la création', details: insertError.message }, { status: 500 });
    }

    await logAdminAction({
      adminUserId: user!.id,
      adminEmail: user!.email,
      action: 'create_certification',
      targetType: 'certification',
      targetId: educator_id,
      details: { certId: newCert?.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Certification créée avec succès',
      educator,
      certification: newCert
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { user, error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { certification_id, educator_id, verification_status = 'document_verified' } = body;

    // Mise à jour par ID de certification (plus direct)
    if (certification_id) {
      const { data, error } = await supabase
        .from('certifications')
        .update({ verification_status })
        .eq('id', certification_id)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, certifications: data });
    }

    // Mise à jour par educator_id
    if (educator_id) {
      const { data, error } = await supabase
        .from('certifications')
        .update({ verification_status })
        .eq('educator_id', educator_id)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, certifications: data });
    }

    return NextResponse.json({ error: 'certification_id ou educator_id requis' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const certification_id = searchParams.get('certification_id');
    const educator_id = searchParams.get('educator_id');

    if (certification_id) {
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', certification_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Certification supprimée' });
    }

    if (educator_id) {
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('educator_id', educator_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Certifications supprimées' });
    }

    return NextResponse.json({ error: 'certification_id ou educator_id requis' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const educator_id = searchParams.get('educator_id');

    // Récupérer toutes les certifications ou celles d'un éducateur spécifique
    let query = supabase.from('certifications').select('*');

    if (educator_id) {
      query = query.eq('educator_id', educator_id);
    }

    const { data: certs, error } = await query.limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ certifications: certs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
