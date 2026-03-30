import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateUnsubscribeToken } from '@/lib/newsletter-token';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'L\'email est requis' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verifier le token HMAC si fourni (liens depuis les emails)
    // Si pas de token, on accepte quand meme (formulaire manuel) mais on verifie
    // que l'email existe dans la base avant de desabonner
    if (token) {
      const expectedToken = generateUnsubscribeToken(normalizedEmail);
      if (token !== expectedToken) {
        return NextResponse.json(
          { error: 'Lien de desabonnement invalide' },
          { status: 403 }
        );
      }
    } else {
      // Sans token, verifier que l'email est bien abonne
      const { data: subscriber } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', normalizedEmail)
        .eq('is_active', true)
        .single();

      if (!subscriber) {
        // Ne pas reveler si l'email existe ou non
        return NextResponse.json({
          success: true,
          message: 'Si cet email est abonne, il sera desabonne.'
        });
      }
    }

    // 1. Désabonner sur Brevo
    try {
      // Récupérer le contact pour connaître ses listes
      const getResponse = await fetch(
        `https://api.brevo.com/v3/contacts/${encodeURIComponent(normalizedEmail)}`,
        {
          headers: {
            'Accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY!
          }
        }
      );

      if (getResponse.ok) {
        const contact = await getResponse.json();
        const listIds = contact.listIds || [];

        // Retirer de toutes les listes
        for (const listId of listIds) {
          await fetch(
            `https://api.brevo.com/v3/contacts/lists/${listId}/contacts/remove`,
            {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY!
              },
              body: JSON.stringify({ emails: [normalizedEmail] })
            }
          );
        }
      }
    } catch (brevoError) {
      console.error('Erreur Brevo unsubscribe:', brevoError);
      // Continuer même si Brevo échoue
    }

    // 2. Mettre à jour la base de données locale
    await supabase
      .from('newsletter_subscribers')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString()
      })
      .eq('email', normalizedEmail);

    return NextResponse.json({
      success: true,
      message: 'Vous avez été désabonné avec succès.'
    });

  } catch (error) {
    console.error('Erreur désabonnement:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
