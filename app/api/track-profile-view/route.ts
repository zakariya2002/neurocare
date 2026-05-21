import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { educatorId } = await request.json();

    if (!educatorId) {
      return NextResponse.json({ error: 'Educator ID requis' }, { status: 400 });
    }

    // Récupère la session si l'utilisateur est connecté (optionnel — les visiteurs
    // anonymes sont aussi comptés).
    let viewerUserId: string | null = null;
    try {
      const cookieStore = await cookies();
      const supabaseSession = createServerClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get: (name: string) => cookieStore.get(name)?.value,
            set() {},
            remove() {},
          },
        },
      );
      const { data: { session } } = await supabaseSession.auth.getSession();
      viewerUserId = session?.user?.id ?? null;
    } catch {
      // tolère l'absence de cookies (mode anonyme)
    }

    // IP du visiteur — utile pour analytics, mais ne sert plus à dédupliquer.
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    const { error } = await supabaseAdmin.from('profile_views').insert({
      educator_id: educatorId,
      viewer_ip: ip,
      viewer_user_id: viewerUserId,
    });

    if (error) {
      console.error('Erreur enregistrement vue:', error);
      // On ne fait pas échouer la requête côté client : le tracking est best-effort.
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur track-profile-view:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 },
    );
  }
}
