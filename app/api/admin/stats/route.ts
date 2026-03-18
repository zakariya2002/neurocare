import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const [
      { count: certCount },
      { count: avatarCount },
      { count: educatorCount },
      { count: familyCount },
      { count: verificationCount },
      { count: blogCount },
    ] = await Promise.all([
      supabase
        .from('certifications')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending'),
      supabase
        .from('educator_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('avatar_moderation_status', 'pending')
        .not('avatar_url', 'is', null),
      supabase
        .from('educator_profiles')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('family_profiles')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('educator_profiles')
        .select('*', { count: 'exact', head: true })
        .in('verification_status', ['documents_submitted', 'documents_verified', 'interview_scheduled']),
      supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);

    return NextResponse.json({
      pendingCertifications: certCount || 0,
      pendingAvatars: avatarCount || 0,
      totalEducators: educatorCount || 0,
      totalFamilies: familyCount || 0,
      pendingVerifications: verificationCount || 0,
      pendingBlogPosts: blogCount || 0,
    });
  } catch (error: any) {
    console.error('Erreur stats admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
