import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/assert-admin';

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
    // Seul un admin peut télécharger les documents de vérification
    const { error: authError } = await assertAdmin();
    if (authError) return authError;

    // Reconstruire le chemin complet du fichier (ex: "user_id/timestamp.pdf")
    const filePath = params.path.join('/');

    // Télécharger le fichier depuis Supabase Storage avec les droits admin
    const { data, error } = await supabaseAdmin.storage
      .from('verification-documents')
      .download(filePath);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Déterminer le type MIME
    const contentType = data.type || 'application/octet-stream';

    // Extraire le nom du fichier pour l'en-tête Content-Disposition
    const fileName = filePath.split('/').pop() || 'document';

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
