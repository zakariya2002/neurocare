import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEducatorWelcomeEmail, sendFamilyWelcomeEmail } from '@/lib/email';

// Alternative approach: Using service_role key to bypass RLS
// If you don't have service_role key, you must disable RLS on the tables
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, role, profileData } = body;

    if (!userId || !role || !profileData) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Récupérer l'email de l'utilisateur
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email;

    // Créer le profil selon le rôle
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
          siret: profileData.siret || null,
          sap_number: profileData.sap_number || null,
          profession_type: profileData.profession_type || 'educator',
          diploma_type: profileData.diploma_type || null,
          rpps_number: profileData.rpps_number || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création profil éducateur:', error);
        return NextResponse.json(
          { error: error.message, details: error },
          { status: 500 }
        );
      }

      // Envoyer l'email de bienvenue éducateur
      if (userEmail) {
        await sendEducatorWelcomeEmail(userEmail, profileData.first_name);
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
          { error: error.message, details: error },
          { status: 500 }
        );
      }

      // Envoyer l'email de bienvenue famille
      if (userEmail) {
        await sendFamilyWelcomeEmail(userEmail, profileData.first_name);
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
