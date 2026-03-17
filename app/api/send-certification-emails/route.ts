import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assertAdmin } from '@/lib/assert-admin';

// Créer un client Supabase avec la clé service (accès admin)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  // Seul un admin peut déclencher l'envoi d'emails
  const { error: authError } = await assertAdmin();
  if (authError) return authError;
  try {
    // Récupérer les emails en attente
    const { data: pendingEmails, error: fetchError } = await supabaseAdmin
      .from('email_notifications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10); // Traiter 10 emails à la fois

    if (fetchError) {
      console.error('Erreur récupération emails:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ message: 'Aucun email en attente', count: 0 });
    }

    const results = [];

    // Envoyer chaque email
    for (const email of pendingEmails) {
      try {
        // Méthode 1 : Utiliser Resend (recommandé - gratuit jusqu'à 3000 emails/mois)
        if (process.env.RESEND_API_KEY) {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'NeuroCare <notifications@neuro-care.fr>',
              to: email.recipient_email,
              subject: email.subject,
              text: email.body
            })
          });

          if (response.ok) {
            // Marquer comme envoyé
            await supabaseAdmin.rpc('mark_email_as_sent', { email_id: email.id });
            results.push({ id: email.id, status: 'sent' });
          } else {
            const errorData = await response.json();
            await supabaseAdmin.rpc('mark_email_as_failed', {
              email_id: email.id,
              error_msg: JSON.stringify(errorData)
            });
            results.push({ id: email.id, status: 'failed', error: errorData });
          }
        }
        // Méthode 2 : Utiliser Nodemailer avec SMTP (si vous avez un serveur SMTP)
        else if (process.env.SMTP_HOST) {
          // Code nodemailer ici si besoin
          results.push({ id: email.id, status: 'skipped', reason: 'SMTP not configured' });
        }
        // Méthode 3 : Fallback (pour le développement)
        else {
          // Marquer comme envoyé en dev (pour tester le flux)
          if (process.env.NODE_ENV === 'development') {
            await supabaseAdmin.rpc('mark_email_as_sent', { email_id: email.id });
            results.push({ id: email.id, status: 'sent_dev' });
          } else {
            results.push({ id: email.id, status: 'skipped', reason: 'No email service configured' });
          }
        }

      } catch (emailError: any) {
        console.error(`Erreur envoi email ${email.id}:`, emailError);
        await supabaseAdmin.rpc('mark_email_as_failed', {
          email_id: email.id,
          error_msg: emailError.message
        });
        results.push({ id: email.id, status: 'failed', error: emailError.message });
      }
    }

    return NextResponse.json({
      message: 'Traitement terminé',
      total: pendingEmails.length,
      results
    });

  } catch (error: any) {
    console.error('Erreur générale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET supprimé pour sécurité - utiliser uniquement POST avec auth admin
