#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkRecentData() {
    try {
        console.log('🔍 Verificando datos recientes en base de datos...\n')

        // Check invoices
        console.log('📄 Últimas 5 facturas:')
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('id, number, client_name, amount, created_at')
            .eq('tenant_id', 1)
            .order('created_at', { ascending: false })
            .limit(5)

        if (invoicesError) {
            console.error('❌ Error fetching invoices:', invoicesError)
        } else {
            invoices.forEach(inv => {
                console.log(`   - ID: ${inv.id}, Número: ${inv.number}, Cliente: ${inv.client_name}, Importe: €${inv.amount}, Fecha: ${inv.created_at}`)
            })
        }

        console.log('\n')

        // Check expenses
        console.log('💸 Últimos 5 gastos:')
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('id, vendor, amount, description, created_at')
            .eq('tenant_id', 1)
            .order('created_at', { ascending: false })
            .limit(5)

        if (expensesError) {
            console.error('❌ Error fetching expenses:', expensesError)
        } else {
            expenses.forEach(exp => {
                console.log(`   - ID: ${exp.id}, Proveedor: ${exp.vendor}, Importe: €${exp.amount}, Descripción: ${exp.description?.substring(0, 50)}..., Fecha: ${exp.created_at}`)
            })
        }

        console.log('\n')

        // Check documents
        console.log('📄 Últimos 5 documentos:')
        const { data: documents, error: docsError } = await supabase
            .from('documents')
            .select('id, filename, mime_type, created_at')
            .eq('tenant_id', 1)
            .order('created_at', { ascending: false })
            .limit(5)

        if (docsError) {
            console.error('❌ Error fetching documents:', docsError)
        } else {
            documents.forEach(doc => {
                console.log(`   - ID: ${doc.id}, Archivo: ${doc.filename}, MIME: ${doc.mime_type}, Fecha: ${doc.created_at}`)
            })
        }

        console.log('\n📊 RESUMEN:')
        console.log(`✅ Facturas en BD: ${invoices?.length || 0}`)
        console.log(`✅ Gastos en BD: ${expenses?.length || 0}`)
        console.log(`✅ Documentos en BD: ${documents?.length || 0}`)

        // Buscar facturas con "FT 3A2501/573" o "Sangria Moet Chandon"
        console.log('\n🔍 Buscando factura específica:')
        const { data: specificInvoice, error: specificError } = await supabase
            .from('invoices')
            .select('*')
            .eq('tenant_id', 1)
            .or('client_name.ilike.%Sangria%,description.ilike.%Sangria%,number.ilike.%FT 3A2501%')
            .limit(1)

        if (specificError) {
            console.error('❌ Error buscando factura específica:', specificError)
        } else if (specificInvoice && specificInvoice.length > 0) {
            console.log('✅ Factura encontrada:', specificInvoice[0])
        } else {
            console.log('❌ Factura NO encontrada en tabla invoices')
        }

        // Buscar gasto con "FT 3A2501/573" o "Sangria Moet Chandon"
        console.log('\n🔍 Buscando gasto específico:')
        const { data: specificExpense, error: specificExpenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('tenant_id', 1)
            .or('vendor.ilike.%Sangria%,description.ilike.%Sangria%,receipt_number.ilike.%FT 3A2501%')
            .limit(1)

        if (specificExpenseError) {
            console.error('❌ Error buscando gasto específico:', specificExpenseError)
        } else if (specificExpense && specificExpense.length > 0) {
            console.log('✅ Gasto encontrado:', specificExpense[0])
        } else {
            console.log('❌ Gasto NO encontrado en tabla expenses')
        }

    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

checkRecentData()
