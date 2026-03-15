import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAuth } from '@/lib/assert-admin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * RGPD — Suppression complète du compte utilisateur.
 * Supprime le profil, anonymise les données liées, et supprime le compte Supabase Auth.
 * Les factures sont conservées 10 ans (obligation légale française).
 *
 * Requiert une confirmation via le body : { confirm: true }
 */
export async function DELETE(request: NextRequest) {
  const { user, error } = await assertAuth();
  if (error) return error;

  try {
    const body = await request.json();
    if (!body.confirm) {
      return NextResponse.json(
        { error: 'Veuillez confirmer la suppression avec { "confirm": true }' },
        { status: 400 }
      );
    }

    const userId = user!.id;
    const role = user!.role;

    // 1. Anonymiser les avis (garder les notes, retirer les infos personnelles)
    if (role === 'family') {
      await supabaseAdmin
        .from('reviews')
        .update({ comment: '[Compte supprimé]' })
        .eq('family_id', userId);
    }

    // 2. Supprimer les messages
    await supabaseAdmin
      .from('messages')
      .delete()
      .eq('sender_id', userId);

    // 3. Supprimer les conversations
    await supabaseAdmin
      .from('conversations')
      .delete()
      .or(`family_id.eq.${userId},educator_id.eq.${userId}`);

    // 4. Supprimer les favoris
    if (role === 'family') {
      await supabaseAdmin
        .from('favorite_educators')
        .delete()
        .eq('family_id', userId);
    }

    // 5. Supprimer les abonnements
    if (role === 'educator') {
      await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('educator_id', userId);
    }

    // 6. Anonymiser les rendez-vous (conserver pour audit, anonymiser les données)
    const appointmentField = role === 'educator' ? 'educator_id' : 'family_id';
    await supabaseAdmin
      .from('appointments')
      .update({ family_notes: null, address: null })
      .eq(appointmentField, userId);

    // 7. Supprimer les transactions de paiement (hors factures — conservation légale 10 ans)
    if (role === 'educator') {
      await supabaseAdmin
        .from('payment_transactions')
        .delete()
        .eq('educator_id', userId);
    }

    // 8. Supprimer la newsletter
    await supabaseAdmin
      .from('newsletter_subscribers')
      .delete()
      .eq('email', user!.email);

    // 9. Supprimer le profil
    if (role === 'educator') {
      await supabaseAdmin
        .from('certifications')
        .delete()
        .eq('educator_id', userId);

      await supabaseAdmin
        .from('educator_profiles')
        .delete()
        .eq('user_id', userId);
    } else if (role === 'family') {
      await supabaseAdmin
        .from('family_profiles')
        .delete()
        .eq('user_id', userId);
    }

    // 10. Supprimer le compte Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Erreur suppression auth:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du compte' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Votre compte et toutes vos données personnelles ont été supprimés.',
    });
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
