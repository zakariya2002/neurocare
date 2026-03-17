import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEducatorWelcomeEmail, sendFamilyWelcomeEmail } from '@/lib/email';

// Client Supabase avec la clé SERVICE ROLE qui bypass RLS
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
    const { email, password, role, profileData, baseUrl } = body;

    if (!email || !password || !role || !profileData) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // 1. Générer le lien de confirmation avec l'API Admin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: { role },
        redirectTo: `${baseUrl || 'https://neuro-care.fr'}/auth/login?confirmed=true`
      }
    });

    if (linkError) {
      console.error('Erreur génération lien:', linkError);

      // Si l'email existe déjà
      if (linkError.message.includes('already been registered') || linkError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé. Essayez de vous connecter ou utilisez un autre email.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Une erreur est survenue lors de la création du compte. Veuillez réessayer.' },
        { status: 500 }
      );
    }

    if (!linkData.user) {
      return NextResponse.json(
        { error: 'Utilisateur non créé' },
        { status: 500 }
      );
    }

    const userId = linkData.user.id;
    const confirmationUrl = linkData.properties?.action_link;
    console.log('[REGISTER] confirmationUrl exists:', !!confirmationUrl, 'action_link:', linkData.properties?.action_link?.substring(0, 50));

    // 2. Créer le profil selon le rôle
    if (role === 'educator') {
      const { error: profileError } = await supabaseAdmin
        .from('educator_profiles')
        .insert({
          user_id: userId,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          bio: profileData.bio || '',
          phone: profileData.phone || null,
          location: profileData.location,
          years_of_experience: profileData.years_of_experience || 0,
          hourly_rate: profileData.hourly_rate || null,
          specializations: profileData.specializations || [],
          languages: profileData.languages || [],
          profession_type: profileData.profession_type || 'educator',
          siret: profileData.siret || null,
          sap_number: profileData.sap_number || null,
          diploma_type: profileData.diploma_type || null,
          rpps_number: profileData.rpps_number || null,
        });

      if (profileError) {
        console.error('Erreur création profil éducateur:', profileError);
        // Supprimer l'utilisateur si le profil échoue
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        );
      }

      // 3. Envoyer l'email de bienvenue avec le lien de confirmation
      if (confirmationUrl) {
        await sendEducatorWelcomeEmail(email, profileData.first_name, confirmationUrl);
      }

    } else if (role === 'family') {
      const { error: profileError } = await supabaseAdmin
        .from('family_profiles')
        .insert({
          user_id: userId,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone || null,
          location: profileData.location,
          relationship: profileData.relationship || 'parent',
          person_with_autism_age: profileData.person_with_autism_age || null,
          support_level_needed: profileData.support_level_needed || 'level_1',
          specific_needs: profileData.specific_needs || [],
          preferred_certifications: profileData.preferred_certifications || [],
          budget_min: profileData.budget_min || null,
          budget_max: profileData.budget_max || null,
        });

      if (profileError) {
        console.error('Erreur création profil famille:', profileError);
        // Supprimer l'utilisateur si le profil échoue
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        );
      }

      // 3. Envoyer l'email de bienvenue avec le lien de confirmation
      if (confirmationUrl) {
        await sendFamilyWelcomeEmail(email, profileData.first_name, confirmationUrl);
      }
    } else {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse email.',
      requiresConfirmation: true
    });

  } catch (error: any) {
    console.error('Erreur API register-with-confirmation:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
