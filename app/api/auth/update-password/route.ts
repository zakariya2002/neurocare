import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      );
    }

    // Validation serveur alignee avec les exigences client
    const passwordErrors: string[] = [];
    if (password.length < 8) passwordErrors.push('au moins 8 caracteres');
    if (!/[A-Z]/.test(password)) passwordErrors.push('une majuscule');
    if (!/[a-z]/.test(password)) passwordErrors.push('une minuscule');
    if (!/[0-9]/.test(password)) passwordErrors.push('un chiffre');
    if (!/[^A-Za-z0-9]/.test(password)) passwordErrors.push('un caractere special');

    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: `Le mot de passe doit contenir : ${passwordErrors.join(', ')}` },
        { status: 400 }
      );
    }

    // Vérifier le token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Lien invalide ou expiré' },
        { status: 400 }
      );
    }

    // Vérifier l'expiration
    if (new Date(tokenData.expires_at) < new Date()) {
      // Supprimer le token expiré
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('id', tokenData.id);

      return NextResponse.json(
        { error: 'Ce lien a expiré. Veuillez faire une nouvelle demande.' },
        { status: 400 }
      );
    }

    // Mettre à jour le mot de passe via l'API admin Supabase
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password }
    );

    if (updateError) {
      console.error('Erreur mise à jour mot de passe:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du mot de passe' },
        { status: 500 }
      );
    }

    // Supprimer le token utilisé
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('id', tokenData.id);

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur update-password:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
