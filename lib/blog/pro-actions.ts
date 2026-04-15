'use server';

import { createClient } from '@supabase/supabase-js';
import { BlogPost, BlogPostsQueryParams, BlogPostsResult } from '@/types/blog';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRO_AUDIENCES = ['pro', 'both'] as const;

export async function getProPublishedPosts(
  params: BlogPostsQueryParams = {}
): Promise<BlogPostsResult> {
  const { category, search, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('blog_posts')
    .select(
      `
      *,
      author:educator_profiles!author_id (
        id,
        first_name,
        last_name,
        profession_type,
        avatar_url
      )
    `,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .in('audience', PRO_AUDIENCES as unknown as string[])
    .order('published_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching pro published posts:', error);
    return { posts: [], total: 0, totalPages: 0, currentPage: page };
  }

  return {
    posts: (data || []) as BlogPost[],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
  };
}

export async function getProPostBySlug(
  slug: string
): Promise<(BlogPost & { audience?: string }) | null> {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select(
      `
      *,
      author:educator_profiles!author_id (
        id,
        first_name,
        last_name,
        profession_type,
        avatar_url
      )
    `
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .in('audience', PRO_AUDIENCES as unknown as string[])
    .single();

  if (error) {
    console.error('Error fetching pro post by slug:', error);
    return null;
  }

  return data as BlogPost & { audience?: string };
}

export async function getProPublishedSlugs(): Promise<
  { slug: string; audience: string; updated_at: string | null; published_at: string | null }[]
> {
  try {
    const { data } = await supabaseAdmin
      .from('blog_posts')
      .select('slug, audience, updated_at, published_at')
      .eq('status', 'published')
      .in('audience', PRO_AUDIENCES as unknown as string[]);

    return (data || []) as {
      slug: string;
      audience: string;
      updated_at: string | null;
      published_at: string | null;
    }[];
  } catch {
    return [];
  }
}
