#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testAPIs() {
    try {
        console.log('🧪 Probando APIs del frontend...\n')

        // Test invoices API
        console.log('📄 Probando API de facturas:')
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('*')
            .eq('tenant_id', 1)
            .order('created_at', { ascending: false })

        if (invoicesError) {
            console.error('❌ Error fetching invoices:', invoicesError)
        } else {
            console.log(`✅ Facturas encontradas: ${invoices?.length || 0}`)
            invoices?.slice(0, 3).forEach(inv => {
                console.log(`   - ID: ${inv.id}, Cliente: ${inv.client_name}, Importe: €${inv.amount}`)
            })
        }

        console.log('\n')

        // Test expenses API
        console.log('💸 Probando API de gastos:')
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('tenant_id', 1)
            .order('created_at', { ascending: false })

        if (expensesError) {
            console.error('❌ Error fetching expenses:', expensesError)
        } else {
            console.log(`✅ Gastos encontrados: ${expenses?.length || 0}`)
            expenses?.slice(0, 3).forEach(exp => {
                console.log(`   - ID: ${exp.id}, Proveedor: ${exp.vendor}, Importe: €${exp.amount}`)
            })
        }

        console.log('\n')

        // Test with different tenant_id
        console.log('🔍 Probando con tenant_id diferente:')
        const { data: invoicesAll, error: invoicesAllError } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false })

        if (invoicesAllError) {
            console.error('❌ Error fetching all invoices:', invoicesAllError)
        } else {
            console.log(`✅ Total facturas en BD: ${invoicesAll?.length || 0}`)
            console.log(`📊 Facturas por tenant:`)
            const tenantCounts = {}
            invoicesAll?.forEach(inv => {
                const tenant = inv.tenant_id || 'null'
                tenantCounts[tenant] = (tenantCounts[tenant] || 0) + 1
            })
            Object.entries(tenantCounts).forEach(([tenant, count]) => {
                console.log(`   - Tenant ${tenant}: ${count} facturas`)
            })
        }

    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

testAPIs()
