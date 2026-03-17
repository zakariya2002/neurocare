import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/assert-admin';

// Client Supabase avec la clé SERVICE ROLE qui bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    // Seul un admin peut créer des profils via cette route
    const { error: adminError } = await assertAdmin();
    if (adminError) return adminError;

    const body = await request.json();
    const { email, password, role, profileData } = body;

    if (!email || !password || !role || !profileData) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // 1. Créer l'utilisateur avec email confirmé automatiquement
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        role,
      },
    });

    if (authError) {
      console.error('Erreur création utilisateur:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Utilisateur non créé' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Créer le profil selon le rôle (avec bypass RLS grâce à la clé admin)
    if (role === 'educator') {
      const { data, error } = await supabaseAdmin
        .from('educator_profiles')
        .insert({
          user_id: userId,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          bio: profileData.bio || '',
          phone: profileData.phone || null,
          location: profileData.location,
          years_of_experience: profileData.years_of_experience,
          hourly_rate: profileData.hourly_rate || null,
          specializations: profileData.specializations || [],
          languages: profileData.languages || [],
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création profil éducateur:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    } else if (role === 'family') {
      const { data, error } = await supabaseAdmin
        .from('family_profiles')
        .insert({
          user_id: userId,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone || null,
          location: profileData.location,
          relationship: profileData.relationship,
          person_with_autism_age: profileData.person_with_autism_age || null,
          support_level_needed: profileData.support_level_needed,
          specific_needs: profileData.specific_needs || [],
          preferred_certifications: profileData.preferred_certifications || [],
          budget_min: profileData.budget_min || null,
          budget_max: profileData.budget_max || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création profil famille:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { error: 'Rôle invalide' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Erreur API:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
