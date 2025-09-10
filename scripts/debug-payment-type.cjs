const { createClient } = require('@supabase/supabase-js');
const { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } = require('../lib/env-loader.js');

loadEnvStrict();
const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

async function checkCurrentData() {
  console.log('🔍 Verificando datos actuales de facturas...');
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, number, payment_type, created_at')
    .eq('tenant_id', 1)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📄 Últimas 5 facturas:');
  invoices.forEach(inv => {
    console.log(`   ID: ${inv.id}, Número: ${inv.number}, Payment Type: ${inv.payment_type}, Creada: ${inv.created_at}`);
  });
  
  console.log('\n🔍 Verificando documentos de WhatsApp...');
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('id, filename, extracted_data, created_at')
    .eq('tenant_id', 1)
    .eq('processing_method', 'whatsapp_webhook')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (docError) {
    console.error('❌ Error:', docError);
    return;
  }
  
  console.log('📱 Últimos 3 documentos de WhatsApp:');
  documents.forEach(doc => {
    console.log(`   ID: ${doc.id}, Archivo: ${doc.filename}`);
    if (doc.extracted_data && doc.extracted_data.payment_type) {
      console.log(`   Payment Type detectado: ${doc.extracted_data.payment_type}`);
    } else {
      console.log('   Payment Type: NO DETECTADO');
    }
    console.log('   ---');
  });
}

checkCurrentData().catch(console.error);
