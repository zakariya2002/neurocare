import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { assertAuth } from '@/lib/assert-admin';

// Client Supabase avec service role pour bypasser RLS
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

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Vérifier l'authentification (admin OU éducateur propriétaire)
    const { user, error: authError } = await assertAuth();
    if (authError || !user) return authError || NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    // Reconstruire le chemin complet du fichier (ex: "user_id/timestamp.pdf")
    const filePath = params.path.join('/');

    // Vérifier que l'utilisateur est admin OU propriétaire du fichier
    const isAdmin = user.role === 'admin';
    const fileUserId = filePath.split('/')[0]; // premier segment = user_id
    const isOwner = fileUserId === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Télécharger le fichier depuis Supabase Storage avec les droits admin
    const { data, error } = await supabaseAdmin.storage
      .from('verification-documents')
      .download(filePath);

    if (error || !data) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    // Déterminer le type MIME
    const contentType = data.type || 'application/octet-stream';
    const fileName = filePath.split('/').pop() || 'document';

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
