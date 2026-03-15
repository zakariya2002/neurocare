import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    // Récupérer les éducateurs
    let educators: any[] = [];
    if (role === 'all' || role === 'educator') {
      let query = supabase
        .from('educator_profiles')
        .select('id, user_id, first_name, last_name, location, created_at, verification_status, subscription_status', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      if (role === 'educator') {
        query = query.range(offset, offset + limit - 1);
      } else {
        query = query.limit(limit);
      }

      const { data, count } = await query;
      educators = (data || []).map(e => ({ ...e, role: 'educator', total: count }));
    }

    // Récupérer les familles
    let families: any[] = [];
    if (role === 'all' || role === 'family') {
      let query = supabase
        .from('family_profiles')
        .select('id, user_id, first_name, last_name, location, created_at', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      if (role === 'family') {
        query = query.range(offset, offset + limit - 1);
      } else {
        query = query.limit(limit);
      }

      const { data, count } = await query;
      families = (data || []).map(f => ({ ...f, role: 'family', total: count }));
    }

    // Récupérer les emails et statuts de ban via auth.admin
    const allUsers = [...educators, ...families];
    const enrichedUsers = [];

    const enrichedResults = await Promise.all(
      allUsers.map(async (user) => {
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(user.user_id);
          const authUser = authData?.user as any;
          return {
            ...user,
            email: authUser?.email || '',
            banned: authUser?.banned_until
              ? new Date(authUser.banned_until) > new Date()
              : false,
            banned_until: authUser?.banned_until || null,
            last_sign_in: authUser?.last_sign_in_at || null,
          };
        } catch {
          return { ...user, email: '', banned: false, banned_until: null, last_sign_in: null };
        }
      })
    );
    enrichedUsers.push(...enrichedResults);

    // Trier par date de création décroissante
    enrichedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Stats globales
    const { count: totalEducators } = await supabase
      .from('educator_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalFamilies } = await supabase
      .from('family_profiles')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      users: enrichedUsers,
      stats: {
        totalEducators: totalEducators || 0,
        totalFamilies: totalFamilies || 0,
        totalUsers: (totalEducators || 0) + (totalFamilies || 0),
      },
    });

  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Suspendre / Réactiver un utilisateur
export async function PUT(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { user_id, action } = await request.json();

    if (!user_id || !action) {
      return NextResponse.json({ error: 'user_id et action requis' }, { status: 400 });
    }

    if (action === 'ban') {
      // Suspendre pour 100 ans (= ban permanent)
      const banUntil = new Date();
      banUntil.setFullYear(banUntil.getFullYear() + 100);

      const { error } = await supabase.auth.admin.updateUserById(user_id, {
        ban_duration: '876000h', // ~100 ans
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Utilisateur suspendu' });
    }

    if (action === 'unban') {
      const { error } = await supabase.auth.admin.updateUserById(user_id, {
        ban_duration: 'none',
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Utilisateur réactivé' });
    }

    return NextResponse.json({ error: 'Action invalide. Utilisez "ban" ou "unban"' }, { status: 400 });

  } catch (error: any) {
    console.error('Admin user action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
