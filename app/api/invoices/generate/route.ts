import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEducatorInvoicePDF, generateFamilyReceiptPDF } from '@/lib/invoice-generator';
import { assertAuth } from '@/lib/assert-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID required' },
        { status: 400 }
      );
    }

    // Récupérer les données du rendez-vous
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        educator:educator_profiles!educator_id(*),
        family:family_profiles!family_id(*)
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est partie prenante du RDV
    const isEducator = appointment.educator?.user_id === user!.id;
    const isFamily = appointment.family?.user_id === user!.id;
    if (!isEducator && !isFamily) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier que le rendez-vous est terminé
    if (appointment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Appointment must be completed to generate invoices' },
        { status: 400 }
      );
    }

    // Récupérer la transaction associée
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Récupérer les users pour les emails
    const { data: educatorUser } = await supabase.auth.admin.getUserById(
      appointment.educator.user_id
    );
    const { data: familyUser } = await supabase.auth.admin.getUserById(
      appointment.family.user_id
    );

    const educatorEmail = educatorUser?.user?.email || '';
    const familyEmail = familyUser?.user?.email || '';

    // Calculer la durée en minutes
    const startTime = new Date(`2000-01-01T${appointment.start_time}`);
    const endTime = new Date(`2000-01-01T${appointment.end_time}`);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    const appointmentDate = new Date(appointment.appointment_date);

    // Générer le numéro de facture éducateur
    const { data: educatorInvoiceNumber } = await supabase
      .rpc('generate_invoice_number', {
        p_invoice_type: 'educator_invoice'
      });

    // Générer le numéro de reçu famille
    const { data: familyInvoiceNumber } = await supabase
      .rpc('generate_invoice_number', {
        p_invoice_type: 'family_receipt'
      });

    // Données pour la facture éducateur
    const educatorInvoiceData = {
      invoiceNumber: educatorInvoiceNumber || 'FACT-ERROR',
      invoiceDate: new Date(),
      appointmentDate,
      duration,
      startTime: appointment.start_time,
      endTime: appointment.end_time,

      educatorName: `${appointment.educator.first_name} ${appointment.educator.last_name}`,
      educatorAddress: appointment.educator.location || '',
      educatorSiret: appointment.educator.siret || undefined,
      educatorSapNumber: appointment.educator.sap_number || undefined,
      educatorEmail,
      // Données de profession pour adapter les descriptions de service
      educatorProfession: appointment.educator.profession || 'educator',
      educatorProfessionLabel: appointment.educator.profession_label || 'Éducateur spécialisé',
      educatorRppsNumber: appointment.educator.rpps_number || undefined,

      familyName: `${appointment.family.first_name} ${appointment.family.last_name}`,
      familyAddress: appointment.family.location || '',

      amountTotal: transaction.amount_total,
      amountHT: transaction.amount_total, // Auto-entrepreneur = franchise de TVA
      amountTVA: 0,
      amountCommission: transaction.amount_commission,
      amountNet: transaction.amount_educator,

      type: 'educator_invoice' as const
    };

    // Données pour le reçu famille
    const familyReceiptData = {
      ...educatorInvoiceData,
      invoiceNumber: familyInvoiceNumber || 'RECU-ERROR',
      type: 'family_receipt' as const
    };

    // Générer les PDFs
    const [educatorPDFBuffer, familyPDFBuffer] = await Promise.all([
      generateEducatorInvoicePDF(educatorInvoiceData),
      generateFamilyReceiptPDF(familyReceiptData)
    ]);

    // Upload vers Supabase Storage
    const educatorFilePath = `invoices/educators/${appointmentId}_${educatorInvoiceNumber}.pdf`;
    const familyFilePath = `invoices/families/${appointmentId}_${familyInvoiceNumber}.pdf`;

    const [educatorUpload, familyUpload] = await Promise.all([
      supabase.storage
        .from('documents')
        .upload(educatorFilePath, educatorPDFBuffer, {
          contentType: 'application/pdf',
          upsert: true
        }),
      supabase.storage
        .from('documents')
        .upload(familyFilePath, familyPDFBuffer, {
          contentType: 'application/pdf',
          upsert: true
        })
    ]);

    if (educatorUpload.error || familyUpload.error) {
      console.error('Upload errors:', {
        educator: educatorUpload.error,
        family: familyUpload.error
      });
    }

    // Obtenir les URLs publiques
    const { data: educatorURL } = supabase.storage
      .from('documents')
      .getPublicUrl(educatorFilePath);

    const { data: familyURL } = supabase.storage
      .from('documents')
      .getPublicUrl(familyFilePath);

    // Enregistrer en base de données
    const [educatorInvoice, familyInvoice] = await Promise.all([
      supabase.from('invoices').insert({
        appointment_id: appointmentId,
        educator_id: appointment.educator_id,
        family_id: appointment.family_id,
        type: 'educator_invoice',
        invoice_number: educatorInvoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        amount_total: transaction.amount_total,
        amount_ht: transaction.amount_total,
        amount_tva: 0,
        amount_commission: transaction.amount_commission,
        amount_net: transaction.amount_educator,
        client_name: familyReceiptData.familyName,
        client_address: familyReceiptData.familyAddress,
        client_siret: appointment.educator.siret || null,
        pdf_url: educatorURL.publicUrl,
        pdf_storage_path: educatorFilePath,
        status: 'generated'
      }).select().single(),

      supabase.from('invoices').insert({
        appointment_id: appointmentId,
        educator_id: appointment.educator_id,
        family_id: appointment.family_id,
        type: 'family_receipt',
        invoice_number: familyInvoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        amount_total: transaction.amount_total,
        amount_ht: transaction.amount_total,
        amount_tva: 0,
        amount_commission: null,
        amount_net: null,
        client_name: familyReceiptData.familyName,
        client_address: familyReceiptData.familyAddress,
        pdf_url: familyURL.publicUrl,
        pdf_storage_path: familyFilePath,
        status: 'generated'
      }).select().single()
    ]);

    return NextResponse.json({
      success: true,
      invoices: {
        educator: {
          id: educatorInvoice.data?.id,
          number: educatorInvoiceNumber,
          url: educatorURL.publicUrl
        },
        family: {
          id: familyInvoice.data?.id,
          number: familyInvoiceNumber,
          url: familyURL.publicUrl
        }
      }
    });

  } catch (error: any) {
    console.error('Error generating invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate invoices' },
      { status: 500 }
    );
  }
}
