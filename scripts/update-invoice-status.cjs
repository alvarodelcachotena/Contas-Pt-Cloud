const { createClient } = require('@supabase/supabase-js');
const { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } = require('../lib/env-loader.js');

loadEnvStrict();
const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

async function updateInvoiceStatus() {
    console.log('🔍 Verificando facturas con estado "pending"...');

    // Obtener facturas con estado pending
    const { data: pendingInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select('id, number, status, payment_type, created_at')
        .eq('tenant_id', 1)
        .eq('status', 'pending');

    if (fetchError) {
        console.error('❌ Error al obtener facturas:', fetchError);
        return;
    }

    if (!pendingInvoices || pendingInvoices.length === 0) {
        console.log('✅ No hay facturas con estado "pending"');
        return;
    }

    console.log(`📄 Encontradas ${pendingInvoices.length} facturas con estado "pending":`);
    pendingInvoices.forEach(invoice => {
        console.log(`   - ID: ${invoice.id}, Número: ${invoice.number}, Payment Type: ${invoice.payment_type}`);
    });

    // Actualizar todas las facturas pending a paid
    const { data: updatedInvoices, error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('tenant_id', 1)
        .eq('status', 'pending')
        .select('id, number, status');

    if (updateError) {
        console.error('❌ Error al actualizar facturas:', updateError);
        return;
    }

    console.log(`✅ Actualizadas ${updatedInvoices.length} facturas a estado "paid":`);
    updatedInvoices.forEach(invoice => {
        console.log(`   - ID: ${invoice.id}, Número: ${invoice.number}, Estado: ${invoice.status}`);
    });
}

updateInvoiceStatus().catch(console.error);
