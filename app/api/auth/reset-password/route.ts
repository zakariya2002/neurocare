import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe.
    // Bug historique : listUsers() pagine à 50 par défaut → les comptes
    // au-delà du 50e n'étaient jamais trouvés et la fonction renvoyait
    // success sans envoyer d'email. On itère sur toutes les pages.
    const emailLower = email.toLowerCase();
    let user: { id: string; email?: string } | undefined;
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error: authError } = await supabase.auth.admin.listUsers({ page, perPage });
      if (authError) {
        console.error('Erreur recherche utilisateur:', authError);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
      }
      user = data.users.find((u) => u.email?.toLowerCase() === emailLower);
      if (user) break;
      if (data.users.length < perPage) break; // dernière page atteinte
      page++;
    }

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return NextResponse.json({
        success: true,
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
      });
    }

    // Récupérer le prénom de l'utilisateur depuis les profils
    let firstName = 'Utilisateur';

    // Chercher dans educator_profiles
    const { data: educatorProfile } = await supabase
      .from('educator_profiles')
      .select('first_name')
      .eq('user_id', user.id)
      .single();

    if (educatorProfile?.first_name) {
      firstName = educatorProfile.first_name;
    } else {
      // Chercher dans family_profiles
      const { data: familyProfile } = await supabase
        .from('family_profiles')
        .select('first_name')
        .eq('user_id', user.id)
        .single();

      if (familyProfile?.first_name) {
        firstName = familyProfile.first_name;
      }
    }

    // Générer un token unique
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Supprimer les anciens tokens pour cet utilisateur
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id);

    // Sauvegarder le nouveau token
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Erreur création token:', insertError);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    // Créer le lien de réinitialisation.
    // Strip "www." parce que www.neuro-care.fr n'a pas de résolution DNS
    // → ERR_NAME_NOT_RESOLVED. Seul le domaine apex est configuré.
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://neuro-care.fr')
      .trim()
      .replace(/^(https?:\/\/)www\./i, '$1');
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    // Envoyer l'email
    const emailResult = await sendPasswordResetEmail(email, firstName, resetUrl);

    if (!emailResult.success) {
      console.error('Erreur envoi email:', emailResult.error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
    });

  } catch (error) {
    console.error('Erreur reset-password:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
