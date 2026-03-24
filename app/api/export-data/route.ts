import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.user_metadata?.role;

    let exportData: any = {
      export_date: new Date().toISOString(),
      user_id: userId,
      email: session.user.email,
      role: userRole,
    };

    if (userRole === 'family') {
      const { data: familyProfile } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: children } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('family_id', familyProfile?.id);

      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('family_id', familyProfile?.id);

      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('family_id', familyProfile?.id);

      exportData = {
        ...exportData,
        profile: familyProfile,
        children: children || [],
        appointments: appointments || [],
        reviews: reviews || [],
      };
    } else if (userRole === 'educator') {
      const { data: educatorProfile } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: certifications } = await supabase
        .from('certifications')
        .select('*')
        .eq('educator_id', educatorProfile?.id);

      const { data: availabilities } = await supabase
        .from('educator_availability')
        .select('*')
        .eq('educator_id', educatorProfile?.id);

      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('educator_id', educatorProfile?.id);

      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('educator_id', educatorProfile?.id);

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status, plan_id, current_period_start, current_period_end')
        .eq('educator_id', educatorProfile?.id);

      exportData = {
        ...exportData,
        profile: educatorProfile,
        certifications: certifications || [],
        availabilities: availabilities || [],
        appointments: appointments || [],
        reviews_received: reviews || [],
        subscriptions: subscriptions || [],
      };
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="neuro-care-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Erreur export données:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export des données' },
      { status: 500 }
    );
  }
}
