import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Recherche Pexels avec variation : per_page=15 + page aléatoire (1-3),
 * puis pick aléatoire parmi les 15 résultats → 45 images possibles pour
 * un même set de mots-clés, vs 1 seule en mode "première image".
 */
async function searchVariedImage(query: string, excludeUrl?: string | null): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const page = 1 + Math.floor(Math.random() * 3); // 1, 2 ou 3
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape&size=large`,
      { headers: { Authorization: apiKey } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photos: any[] = data.photos || [];
    if (photos.length === 0) return null;

    // Filtre les photos qui correspondent à l'image actuelle pour forcer un changement.
    const candidates = photos.filter((p) => {
      const url = p.src?.large2x || p.src?.large;
      return url && url !== excludeUrl;
    });
    const pool = candidates.length > 0 ? candidates : photos;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return pick.src?.large2x || pick.src?.large || null;
  } catch {
    return null;
  }
}

/**
 * POST /api/admin/articles/regenerate-image
 * Body: { articleId }
 * Régénère uniquement l'image de l'article (sans toucher au contenu IA).
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { articleId } = await request.json();
    if (!articleId) {
      return NextResponse.json({ error: 'articleId requis' }, { status: 400 });
    }

    const { data: article, error: fetchErr } = await supabase
      .from('content_calendar')
      .select('id, blog_post_id, target_keyword, generated_keywords, generated_title, image_url')
      .eq('id', articleId)
      .single();

    if (fetchErr || !article) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    const keywords: string[] = Array.isArray(article.generated_keywords)
      ? article.generated_keywords
      : [];
    const query =
      keywords.slice(0, 3).join(' ') ||
      article.target_keyword ||
      article.generated_title ||
      '';

    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Pas de mots-clés disponibles pour la recherche image' },
        { status: 400 },
      );
    }

    const newImageUrl = await searchVariedImage(query, article.image_url);

    if (!newImageUrl) {
      return NextResponse.json(
        { error: 'Pexels n\'a renvoyé aucune image (clé manquante ou aucun résultat)' },
        { status: 502 },
      );
    }

    // Update du calendrier (brouillon).
    const { error: updErr } = await supabase
      .from('content_calendar')
      .update({ image_url: newImageUrl, updated_at: new Date().toISOString() })
      .eq('id', articleId);
    if (updErr) {
      console.error('[regenerate-image] update calendar error:', updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // Si publié, mettre à jour aussi blog_posts pour le rendu public.
    if (article.blog_post_id) {
      const { error: blogErr } = await supabase
        .from('blog_posts')
        .update({ image_url: newImageUrl })
        .eq('id', article.blog_post_id);
      if (blogErr) {
        console.error('[regenerate-image] update blog_posts error:', blogErr);
      }
    }

    return NextResponse.json({ success: true, imageUrl: newImageUrl });
  } catch (error: unknown) {
    console.error('[regenerate-image] error:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
