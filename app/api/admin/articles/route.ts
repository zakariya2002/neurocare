import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET: Returns content calendar items
 */
export async function GET() {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { data, error } = await supabase
      .from('content_calendar')
      .select('*')
      .order('planned_date', { ascending: true });

    if (error) {
      console.error('Error fetching content calendar:', error);
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({ articles: [], error: 'Table content_calendar non trouvée. Exécutez la migration.' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ articles: data || [] });
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST: Generate or publish an article
 * Body: { action: 'save_draft' | 'publish', articleId, generatedData? }
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { action, articleId, generatedData } = body;

    if (action === 'save_draft') {
      // Save generated content back to the content_calendar row
      if (!articleId || !generatedData) {
        return NextResponse.json(
          { error: 'articleId et generatedData requis' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('content_calendar')
        .update({
          status: 'draft',
          generated_title: generatedData.title,
          generated_description: generatedData.metaDescription,
          generated_keywords: generatedData.keywords,
          generated_content: generatedData.content,
          image_suggestion: generatedData.imagePrompt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId);

      if (error) {
        console.error('Error saving draft:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'publish') {
      if (!articleId) {
        return NextResponse.json({ error: 'articleId requis' }, { status: 400 });
      }

      // Fetch the calendar entry
      const { data: calendarEntry, error: fetchError } = await supabase
        .from('content_calendar')
        .select('*')
        .eq('id', articleId)
        .single();

      if (fetchError || !calendarEntry) {
        return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
      }

      if (!calendarEntry.generated_content) {
        return NextResponse.json(
          { error: 'L\'article doit d\'abord être généré avant d\'être publié' },
          { status: 400 }
        );
      }

      // Generate a slug
      const slug = (calendarEntry.generated_title || calendarEntry.title)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Check for slug uniqueness
      const { data: existingSlug } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single();

      const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

      // Extract excerpt from content (first ~200 chars of plain text)
      const plainText = (calendarEntry.generated_content as string)
        .replace(/<[^>]*>/g, '')
        .trim();
      const excerpt = plainText.length > 200
        ? plainText.substring(0, 200).trim() + '...'
        : plainText;

      // Calculate read time
      const wordCount = plainText.split(/\s+/).length;
      const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

      // Insert into blog_posts
      const { data: blogPost, error: insertError } = await supabase
        .from('blog_posts')
        .insert({
          author_id: null, // AI-generated, no educator author
          title: calendarEntry.generated_title || calendarEntry.title,
          slug: finalSlug,
          excerpt,
          content: calendarEntry.generated_content,
          category: 'ressources',
          status: 'published',
          published_at: new Date().toISOString(),
          read_time_minutes: readTimeMinutes,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error publishing post:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Update calendar entry with blog_post reference
      await supabase
        .from('content_calendar')
        .update({
          status: 'published',
          blog_post_id: blogPost.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId);

      return NextResponse.json({ success: true, blogPostId: blogPost.id });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
