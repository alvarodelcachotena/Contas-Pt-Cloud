const { createClient } = require('@supabase/supabase-js');
const { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } = require('../lib/env-loader.js');

loadEnvStrict();
const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

async function checkLatestInvoice() {
    console.log('🔍 Verificando la factura más reciente...');
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, number, payment_type, created_at')
        .eq('tenant_id', 1)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    if (invoices && invoices.length > 0) {
        console.log('📄 Factura más reciente:');
        console.log(`   ID: ${invoices[0].id}`);
        console.log(`   Número: ${invoices[0].number}`);
        console.log(`   Payment Type: ${invoices[0].payment_type}`);
        console.log(`   Creada: ${invoices[0].created_at}`);
    } else {
        console.log('❌ No hay facturas');
    }
}

checkLatestInvoice().catch(console.error);
