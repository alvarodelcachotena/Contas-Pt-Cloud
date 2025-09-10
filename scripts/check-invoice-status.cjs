const { createClient } = require('@supabase/supabase-js');
const { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } = require('../lib/env-loader.js');

loadEnvStrict();
const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

async function checkInvoiceStatus() {
    console.log('🔍 Verificando estado actual de las facturas...');

    // Obtener todas las facturas
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, number, status, payment_type, created_at')
        .eq('tenant_id', 1)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error al obtener facturas:', error);
        return;
    }

    if (!invoices || invoices.length === 0) {
        console.log('❌ No hay facturas');
        return;
    }

    console.log(`📄 Estado actual de ${invoices.length} facturas:`);

    // Contar por estado
    const statusCount = {};
    const paymentTypeCount = {};

    invoices.forEach(invoice => {
        statusCount[invoice.status] = (statusCount[invoice.status] || 0) + 1;
        paymentTypeCount[invoice.payment_type] = (paymentTypeCount[invoice.payment_type] || 0) + 1;
    });

    console.log('📊 Resumen por estado:');
    Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} facturas`);
    });

    console.log('📊 Resumen por tipo de pago:');
    Object.entries(paymentTypeCount).forEach(([paymentType, count]) => {
        console.log(`   - ${paymentType}: ${count} facturas`);
    });

    console.log('📄 Detalles de las últimas 5 facturas:');
    invoices.slice(0, 5).forEach(invoice => {
        console.log(`   - ID: ${invoice.id}, Número: ${invoice.number}, Estado: ${invoice.status}, Payment Type: ${invoice.payment_type}`);
    });
}

checkInvoiceStatus().catch(console.error);
