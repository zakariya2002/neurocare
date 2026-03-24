import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Récupérer les avis approuvés (public)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('platform_reviews')
    .select('id, author_name, author_role, rating, comment, created_at')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST: Soumettre un avis (authentifié)
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value, set() {}, remove() {} } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { rating, comment, authorName } = await request.json();

  if (!rating || !comment || !authorName) {
    return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Note entre 1 et 5' }, { status: 400 });
  }

  const role = session.user.user_metadata?.role || 'family';

  const { error } = await supabaseAdmin
    .from('platform_reviews')
    .insert({
      user_id: session.user.id,
      author_name: authorName.substring(0, 100),
      author_role: role,
      rating: Math.round(rating),
      comment: comment.substring(0, 1000),
      is_approved: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: 'Merci ! Votre avis sera publié après validation.' });
}
