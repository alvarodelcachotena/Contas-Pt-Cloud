import { storage } from "../storage";
import { InsertInvoice } from "@shared/schema";

interface ExtractedInvoiceData {
  ISSUER?: string;
  ISSUER_NIF?: string;
  ISSUER_ADDRESS?: string;
  ISSUER_PHONE?: string;
  INVOICE_DATE?: string;
  INVOICE_TIME?: string;
  TOTAL_WITHOUT_VAT?: string;
  VAT_VALUE?: string;
  TOTAL_WITH_VAT?: string;
  VAT_PERCENTAGE?: string;
  ISSUED_TO?: string;
  confidence: number;
}

export async function insertInvoiceFromExtraction(
  extractedData: ExtractedInvoiceData,
  originalFilename: string,
  tenantId: number = 1
): Promise<{ invoiceId: number; success: boolean }> {
  try {
    // Generate invoice number if not provided
    const invoiceNumber = generateInvoiceNumber();
    
    // Calculate due date (30 days from invoice date)
    const issueDate = extractedData.INVOICE_DATE || new Date().toISOString().split('T')[0];
    const dueDate = calculateDueDate(issueDate, 30);

    // Prepare invoice data for database insertion
    const invoiceData: InsertInvoice = {
      tenantId,
      number: invoiceNumber,
      clientName: extractedData.ISSUED_TO || extractedData.ISSUER || "Cliente Desconhecido",
      clientTaxId: extractedData.ISSUER_NIF || null,
      clientAddress: extractedData.ISSUER_ADDRESS || null,
      // clientPhone: extractedData.ISSUER_PHONE || null, // Temporarily disabled due to schema sync issue
      issueDate,
      // issueTime: extractedData.INVOICE_TIME || null, // Temporarily disabled due to schema sync issue
      dueDate,
      amount: extractedData.TOTAL_WITHOUT_VAT || "0.00",
      vatAmount: extractedData.VAT_VALUE || "0.00",
      vatRate: extractedData.VAT_PERCENTAGE || "23.00",
      totalAmount: extractedData.TOTAL_WITH_VAT || extractedData.TOTAL_WITHOUT_VAT || "0.00",
      status: "draft",
      description: `Fatura extraída automaticamente de: ${originalFilename}`,
      paymentTermsDays: 30,
      notes: `Processado com IA - Confiança: ${extractedData.confidence}%`
    };

    // Insert invoice into database
    const invoice = await storage.createInvoice(invoiceData);
    
    console.log(`✅ Invoice ${invoice.number} created successfully with ID: ${invoice.id}`);
    
    return {
      invoiceId: invoice.id,
      success: true
    };
  } catch (error) {
    console.error("Error inserting invoice:", error);
    throw new Error(`Database insertion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function generateInvoiceNumber(): string {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  
  return `FT${currentYear}/${currentMonth.toString().padStart(2, '0')}/${timestamp}`;
}

function calculateDueDate(issueDateStr: string, paymentTermsDays: number): string {
  const issueDate = new Date(issueDateStr);
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);
  
  return dueDate.toISOString().split('T')[0];
}