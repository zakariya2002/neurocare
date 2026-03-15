import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    // Créer le client Supabase avec service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Récupérer le filtre depuis les query params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'pending';

    // Construire la requête
    let query = supabase
      .from('educator_profiles')
      .select('*')
      .not('diploma_url', 'is', null)
      .order('diploma_submitted_at', { ascending: false, nullsFirst: false });

    if (filter !== 'all') {
      query = query.eq('diploma_verification_status', filter);
    }

    const { data: educators, error } = await query;

    if (error) throw error;

    // Récupérer les emails depuis auth.users et générer signed URLs
    const educatorsWithEmails = await Promise.all(
      (educators || []).map(async (educator) => {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          educator.user_id
        );

        if (userError) {
          console.error('Erreur récupération user:', userError);
        }

        // Générer une signed URL pour le diplôme si disponible
        let signedDiplomaUrl = educator.diploma_url;
        if (educator.diploma_url && !educator.diploma_url.startsWith('http')) {
          const { data: signedUrlData } = await supabase.storage
            .from('diplomas')
            .createSignedUrl(educator.diploma_url, 3600); // 1 heure

          if (signedUrlData?.signedUrl) {
            signedDiplomaUrl = signedUrlData.signedUrl;
          }
        }

        return {
          ...educator,
          email: userData?.user?.email || 'Email non disponible',
          diploma_url: signedDiplomaUrl
        };
      })
    );

    return NextResponse.json({ success: true, data: educatorsWithEmails });

  } catch (error: any) {
    console.error('❌ Erreur API get-diplomas:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
