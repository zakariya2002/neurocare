import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getNewsletterWelcomeEmail } from '@/lib/email-templates/newsletter-welcome';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

// IDs des listes Brevo
const BREVO_LIST_IDS = {
  famille: 3, // neurocare - Familles & Aidants
  pro: 4,     // neurocare - Professionnels
  all: 5      // neurocare - Newsletter Générale
};

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, audience, source } = await request.json();

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'L\'email est requis' },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Déterminer la liste selon l'audience
    const listId = audience === 'pro'
      ? BREVO_LIST_IDS.pro
      : audience === 'famille'
        ? BREVO_LIST_IDS.famille
        : BREVO_LIST_IDS.all;

    // Préparer les attributs du contact pour Brevo
    const contactData: any = {
      email: email.toLowerCase(),
      attributes: {
        PRENOM: firstName || '',
        NOM: lastName || '',
        AUDIENCE: audience || 'general',
        SOURCE: source || 'website_footer',
        DATE_INSCRIPTION: new Date().toISOString().split('T')[0]
      },
      listIds: [listId],
      updateEnabled: true // Met à jour si le contact existe déjà
    };

    // Appel à l'API Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!
      },
      body: JSON.stringify(contactData)
    });

    // Gérer les différents cas de réponse Brevo
    // Note: Brevo retourne 201 sans body en cas de succès
    if (!brevoResponse.ok) {
      // Parser le JSON seulement en cas d'erreur
      let brevoResult;
      try {
        brevoResult = await brevoResponse.json();
      } catch {
        brevoResult = { code: 'unknown' };
      }

      // Si le contact existe déjà, on le met à jour
      if (brevoResult.code === 'duplicate_parameter') {
        // Mettre à jour le contact existant avec la nouvelle liste
        const updateResponse = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email.toLowerCase())}`, {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY!
          },
          body: JSON.stringify({
            attributes: contactData.attributes,
            listIds: [listId]
          })
        });

        if (!updateResponse.ok) {
          console.error('Erreur mise à jour Brevo:', await updateResponse.text());
        }
      } else {
        console.error('Erreur Brevo:', brevoResult);
        return NextResponse.json(
          { error: 'Erreur lors de l\'inscription. Veuillez réessayer.' },
          { status: 500 }
        );
      }
    }

    // Sauvegarder aussi en base de données locale pour historique
    try {
      await supabase
        .from('newsletter_subscribers')
        .upsert({
          email: email.toLowerCase(),
          first_name: firstName || null,
          last_name: lastName || null,
          audience: audience || 'general',
          source: source || 'website_footer',
          subscribed_at: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'email'
        });
    } catch (dbError) {
      // Log l'erreur mais ne pas échouer si la DB locale échoue
      console.error('Erreur sauvegarde DB locale:', dbError);
    }

    // Envoyer l'email de bienvenue via Resend
    try {
      await resend.emails.send({
        from: 'neurocare <newsletter@neuro-care.fr>',
        to: email.toLowerCase(),
        subject: 'Bienvenue dans la newsletter neurocare !',
        html: getNewsletterWelcomeEmail(firstName, audience, email),
      });
    } catch (emailError) {
      // Log l'erreur mais ne pas échouer si l'email échoue
      console.error('Erreur envoi email bienvenue:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Inscription réussie ! Vérifiez votre boîte mail pour notre email de bienvenue.'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de l\'inscription newsletter:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer plus tard.' },
      { status: 500 }
    );
  }
}

// GET supprimé - exposait l'existence d'emails (privacy leak)
