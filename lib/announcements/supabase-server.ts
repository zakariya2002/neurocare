import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Le projet utilise @supabase/ssr (createBrowserClient côté client).
// Pour relire la session dans les routes API, il faut utiliser createServerClient
// — sinon createRouteHandlerClient de @supabase/auth-helpers-nextjs ne reconnaît
// pas les cookies (formats différents) et retourne systématiquement "Non authentifié".
export async function getRouteSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set() {},
        remove() {},
      },
    }
  );
}
