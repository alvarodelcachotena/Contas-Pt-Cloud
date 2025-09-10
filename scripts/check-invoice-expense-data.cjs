const { createClient } = require('@supabase/supabase-js');
const { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } = require('../lib/env-loader.js');

loadEnvStrict();
const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

async function checkData() {
    console.log('🔍 Verificando datos de facturas...');
    const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id, number, amount, vat_amount, total_amount, vat_rate, payment_type')
        .eq('tenant_id', 1);

    if (invError) {
        console.error('❌ Error:', invError);
        return;
    }

    console.log('📄 Facturas encontradas:', invoices.length);
    invoices.forEach(inv => {
        console.log(`   ID: ${inv.id}, Número: ${inv.number}`);
        console.log(`   Amount: ${inv.amount}, VAT: ${inv.vat_amount}, Total: ${inv.total_amount}`);
        console.log(`   VAT Rate: ${inv.vat_rate}%, Payment: ${inv.payment_type}`);
        console.log('   ---');
    });

    console.log('\n🔍 Verificando datos de despesas...');
    const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('id, vendor, amount, vat_amount, vat_rate')
        .eq('tenant_id', 1);

    if (expError) {
        console.error('❌ Error:', expError);
        return;
    }

    console.log('💰 Despesas encontradas:', expenses.length);
    expenses.forEach(exp => {
        console.log(`   ID: ${exp.id}, Vendor: ${exp.vendor}`);
        console.log(`   Amount: ${exp.amount}, VAT: ${exp.vat_amount}, VAT Rate: ${exp.vat_rate}%`);
        console.log('   ---');
    });
}

checkData().catch(console.error);
