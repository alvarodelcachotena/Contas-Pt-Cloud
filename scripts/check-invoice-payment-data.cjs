const { createClient } = require('@supabase/supabase-js');
const { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } = require('../lib/env-loader.js');

loadEnvStrict();
const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

async function checkInvoiceData() {
    console.log('🔍 Verificando datos específicos de facturas...');
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, number, payment_type, extracted_data')
        .eq('tenant_id', 1);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log('📄 Facturas encontradas:', invoices.length);
    invoices.forEach(inv => {
        console.log(`\n📋 Factura ID: ${inv.id}`);
        console.log(`   Número: ${inv.number}`);
        console.log(`   Payment Type: ${inv.payment_type}`);
        if (inv.extracted_data) {
            console.log('   Extracted Data:', JSON.stringify(inv.extracted_data, null, 2));
        }
    });
}

checkInvoiceData().catch(console.error);
