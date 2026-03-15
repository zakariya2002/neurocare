import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Utiliser le client Supabase pour exécuter du SQL brut
    const { data, error } = await supabase.rpc('exec', {
      query: `
        -- Ajouter la colonne siret (obligatoire)
        ALTER TABLE educator_profiles
        ADD COLUMN IF NOT EXISTS siret VARCHAR(14);

        -- Ajouter la colonne sap_number (facultatif)
        ALTER TABLE educator_profiles
        ADD COLUMN IF NOT EXISTS sap_number VARCHAR(50);

        -- Ajouter des commentaires pour la documentation
        COMMENT ON COLUMN educator_profiles.siret IS 'Numéro SIRET de l''éducateur (14 chiffres, obligatoire pour facturation)';
        COMMENT ON COLUMN educator_profiles.sap_number IS 'Numéro d''agrément Services à la Personne (facultatif, permet aux familles de bénéficier du CESU et crédit d''impôt)';
      `
    });

    if (error) {
      console.error('Erreur SQL:', error);
      return NextResponse.json({
        error: error.message,
        details: 'Veuillez exécuter la migration manuellement dans le SQL Editor de Supabase'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Migration SIRET et SAP exécutée avec succès !',
      data
    });

  } catch (error: any) {
    console.error('Erreur migration:', error);
    return NextResponse.json({
      error: error.message,
      instructions: 'Connectez-vous à Supabase Dashboard > SQL Editor et exécutez le contenu de supabase/migrations/20251125_add_siret_sap_to_profiles.sql'
    }, { status: 500 });
  }
}
