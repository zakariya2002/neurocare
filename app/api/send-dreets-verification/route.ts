import { NextRequest, NextResponse } from 'next/server';
import { dreetsService } from '@/lib/dreets-verification';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      educatorId,
      educatorFirstName,
      educatorLastName,
      educatorEmail,
      educatorPhone,
      diplomaUrl,
      diplomaNumber,
      deliveryDate,
      region,
      ocrAnalysis
    } = body;

    // Validation
    if (!educatorId || !educatorFirstName || !educatorLastName || !diplomaUrl || !region) {
      return NextResponse.json(
        { success: false, message: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Envoyer l'email à la DREETS
    const result = await dreetsService.sendDREETSVerificationRequest({
      educatorId,
      educatorFirstName,
      educatorLastName,
      educatorEmail: educatorEmail || '',
      educatorPhone: educatorPhone || '',
      diplomaUrl,
      diplomaNumber,
      deliveryDate,
      region,
      ocrAnalysis
    });

    if (result.success) {
      // Mettre à jour la base de données avec la date d'envoi
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase
        .from('educator_profiles')
        .update({
          dreets_verification_sent_at: new Date().toISOString()
        })
        .eq('id', educatorId);

      // Enregistrer dans l'historique
      await supabase
        .from('diploma_verification_history')
        .insert({
          educator_id: educatorId,
          action: 'dreets_sent',
          reason: `Email envoyé à la DREETS ${region}`,
          dreets_verification_sent: true
        });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Erreur API send-dreets-verification:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Erreur lors de l\'envoi à la DREETS'
      },
      { status: 500 }
    );
  }
}
