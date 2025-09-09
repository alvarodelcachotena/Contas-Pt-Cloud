// Script para verificar el procesamiento de WhatsApp
import { createClient } from '@supabase/supabase-js';
import { loadEnvStrict } from '../lib/env-loader.js';

// Cargar variables de entorno
loadEnvStrict();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWhatsAppProcessing() {
  try {
    console.log('🔍 Verificando procesamiento de WhatsApp...');
    
    // Verificar documentos recientes
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('processing_method', 'whatsapp_webhook')
      .order('created_at', { ascending: false })
      .limit(5);

    if (docError) {
      console.error('❌ Error obteniendo documentos:', docError);
      return;
    }

    console.log(`📄 Documentos encontrados: ${documents.length}`);
    
    for (const doc of documents) {
      console.log(`\n📋 Documento ID: ${doc.id}`);
      console.log(`   - Archivo: ${doc.filename}`);
      console.log(`   - Estado: ${doc.processing_status}`);
      console.log(`   - Confianza: ${doc.confidence_score}`);
      console.log(`   - Datos extraídos: ${Object.keys(doc.extracted_data || {}).length} campos`);
      
      // Verificar si hay factura asociada
      if (doc.extracted_data?.invoice_id) {
        console.log(`   - Factura ID: ${doc.extracted_data.invoice_id}`);
      }
    }

    // Verificar facturas recientes
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (invError) {
      console.error('❌ Error obteniendo facturas:', invError);
      return;
    }

    console.log(`\n📄 Facturas encontradas: ${invoices.length}`);
    
    for (const invoice of invoices) {
      console.log(`\n📋 Factura ID: ${invoice.id}`);
      console.log(`   - Número: ${invoice.number}`);
      console.log(`   - Cliente: ${invoice.client_name}`);
      console.log(`   - Cliente ID: ${invoice.client_id}`);
      console.log(`   - Importe: €${invoice.total_amount}`);
      console.log(`   - Fecha: ${invoice.issue_date}`);
    }

    // Verificar despesas recientes
    const { data: expenses, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (expError) {
      console.error('❌ Error obteniendo despesas:', expError);
      return;
    }

    console.log(`\n💰 Despesas encontradas: ${expenses.length}`);
    
    for (const expense of expenses) {
      console.log(`\n📋 Despesa ID: ${expense.id}`);
      console.log(`   - Proveedor: ${expense.vendor}`);
      console.log(`   - Importe: €${expense.amount}`);
      console.log(`   - Fecha: ${expense.expense_date}`);
      console.log(`   - Factura ID: ${expense.invoice_id}`);
    }

    // Verificar clientes recientes
    const { data: clients, error: cliError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (cliError) {
      console.error('❌ Error obteniendo clientes:', cliError);
      return;
    }

    console.log(`\n👥 Clientes encontrados: ${clients.length}`);
    
    for (const client of clients) {
      console.log(`\n📋 Cliente ID: ${client.id}`);
      console.log(`   - Nombre: ${client.name}`);
      console.log(`   - Email: ${client.email}`);
      console.log(`   - NIF: ${client.nif}`);
      console.log(`   - Fecha creación: ${client.created_at}`);
    }

  } catch (error) {
    console.error('❌ Error verificando procesamiento:', error);
  }
}

checkWhatsAppProcessing();
