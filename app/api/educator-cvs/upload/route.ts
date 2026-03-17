import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';

// Client Supabase côté serveur avec service_role key (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const educatorId = formData.get('educatorId') as string;

    if (!file || !educatorId) {
      return NextResponse.json(
        { error: 'Fichier et educatorId requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est bien cet éducateur
    const { data: profile } = await supabaseAdmin
      .from('educator_profiles')
      .select('id')
      .eq('id', educatorId)
      .eq('user_id', user!.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier que c'est un PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Seuls les fichiers PDF sont acceptés' },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Le fichier ne doit pas dépasser 10MB' },
        { status: 400 }
      );
    }

    // Construire le chemin
    const fileName = `${user!.id}_${Date.now()}.pdf`;
    const filePath = `educator-cvs/${educatorId}/${fileName}`;

    // Convertir le File en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload avec le client admin (bypass RLS)
    const { error: uploadError, data } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Mettre à jour le profil éducateur
    const { error: updateError } = await supabaseAdmin
      .from('educator_profiles')
      .update({ cv_url: urlData.publicUrl })
      .eq('id', educatorId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
