import { createClient } from '@supabase/supabase-js';

interface ExtractedData {
  INVOICE_NUMBER?: string;
  AMOUNT?: string;
  TOTAL_AMOUNT?: string;
  ISSUE_DATE?: string;
  ISSUED_TO?: string;
  ISSUER?: string;
  ISSUER_NIF?: string;
  ISSUER_ADDRESS?: string;
  ISSUER_PHONE?: string;
  INVOICE_TIME?: string;
  PAYMENT_TERMS?: string;
  DESCRIPTION?: string;
  STATUS?: string;
  CLIENT_ID?: number;
}

export async function insertInvoice(
  supabase: ReturnType<typeof createClient>,
  extractedData: ExtractedData,
  tenantId: number
) {
  try {
    // Format issue date
    const issueDate = extractedData.ISSUE_DATE || new Date().toISOString().split('T')[0];

    // Insert invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        number: extractedData.INVOICE_NUMBER || `INV-${Date.now()}`,
        amount: extractedData.AMOUNT || '0',
        totalAmount: extractedData.TOTAL_AMOUNT || extractedData.AMOUNT || '0',
        tenantId,
        clientName: extractedData.ISSUED_TO || extractedData.ISSUER || "Cliente Desconhecido",
        clientTaxId: extractedData.ISSUER_NIF || null,
        issueDate,
        paymentTerms: extractedData.PAYMENT_TERMS || null,
        description: extractedData.DESCRIPTION || null,
        status: extractedData.STATUS || 'pending',
        clientId: extractedData.CLIENT_ID || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return invoice;
  } catch (error) {
    console.error('Error inserting invoice:', error);
    throw error;
  }
}