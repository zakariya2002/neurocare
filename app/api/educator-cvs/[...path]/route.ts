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
    // Vérifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    // Reconstruire le chemin complet du fichier (ex: "user_id/cv.pdf")
    const filePath = params.path.join('/');

    // Télécharger le fichier depuis Supabase Storage avec les droits admin
    const { data, error } = await supabaseAdmin.storage
      .from('educator-cvs')
      .download(filePath);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to download CV' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'CV not found' },
        { status: 404 }
      );
    }

    // Déterminer le type MIME
    const contentType = data.type || 'application/pdf';

    // Extraire le nom du fichier pour l'en-tête Content-Disposition
    const fileName = filePath.split('/').pop() || 'cv.pdf';

    // Retourner le fichier
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
