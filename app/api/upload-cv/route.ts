import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Fichier et userId requis' }, { status: 400 });
    }

    // Valider le type de fichier
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Format PDF uniquement' }, { status: 400 });
    }

    // Valider la taille (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!user?.user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${userId}/${Date.now()}.pdf`;

    // Upload via service role (bypass RLS)
    const { data, error } = await supabaseAdmin.storage
      .from('cvs')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error('Erreur upload CV:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 });
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from('cvs')
      .getPublicUrl(data.path);

    // Mettre à jour le profil éducateur
    await supabaseAdmin
      .from('educator_profiles')
      .update({ cv_url: urlData.publicUrl })
      .eq('user_id', userId);

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (error: any) {
    console.error('Erreur API upload-cv:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
