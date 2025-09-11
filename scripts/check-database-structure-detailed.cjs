#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL o SUPABASE_ANON_KEY no están configurados')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseStructure() {
    console.log('🔍 VERIFICANDO ESTRUCTURA DE BASE DE DATOS')
    console.log('==========================================\n')

    try {
        // Check invoices table structure
        console.log('📋 TABLA INVOICES:')
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('*')
            .limit(1)

        if (invoicesError) {
            console.log(`❌ Error en invoices: ${invoicesError.message}`)
        } else {
            console.log('✅ Tabla invoices accesible')
            if (invoices && invoices.length > 0) {
                console.log('📊 Columnas disponibles:', Object.keys(invoices[0]))
            }
        }

        // Check expenses table structure
        console.log('\n📋 TABLA EXPENSES:')
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('*')
            .limit(1)

        if (expensesError) {
            console.log(`❌ Error en expenses: ${expensesError.message}`)
        } else {
            console.log('✅ Tabla expenses accesible')
            if (expenses && expenses.length > 0) {
                console.log('📊 Columnas disponibles:', Object.keys(expenses[0]))
            }
        }

        // Check documents table
        console.log('\n📋 TABLA DOCUMENTS:')
        const { data: documents, error: documentsError } = await supabase
            .from('documents')
            .select('*')
            .limit(1)

        if (documentsError) {
            console.log(`❌ Error en documents: ${documentsError.message}`)
        } else {
            console.log('✅ Tabla documents accesible')
            if (documents && documents.length > 0) {
                console.log('📊 Columnas disponibles:', Object.keys(documents[0]))
            }
        }

        // Check recent documents
        console.log('\n📋 DOCUMENTOS RECIENTES:')
        const { data: recentDocs, error: recentError } = await supabase
            .from('documents')
            .select('id, filename, processing_status, created_at')
            .order('created_at', { ascending: false })
            .limit(5)

        if (recentError) {
            console.log(`❌ Error obteniendo documentos recientes: ${recentError.message}`)
        } else {
            console.log('📄 Últimos 5 documentos:')
            recentDocs.forEach((doc, index) => {
                console.log(`   ${index + 1}. ID: ${doc.id}, Archivo: ${doc.filename}, Estado: ${doc.processing_status}`)
            })
        }

        // Check recent invoices
        console.log('\n📋 FACTURAS RECIENTES:')
        const { data: recentInvoices, error: invoicesRecentError } = await supabase
            .from('invoices')
            .select('id, number, client_name, amount, created_at')
            .order('created_at', { ascending: false })
            .limit(5)

        if (invoicesRecentError) {
            console.log(`❌ Error obteniendo facturas recientes: ${invoicesRecentError.message}`)
        } else {
            console.log('📄 Últimas 5 facturas:')
            recentInvoices.forEach((inv, index) => {
                console.log(`   ${index + 1}. ID: ${inv.id}, Número: ${inv.number}, Cliente: ${inv.client_name}, Importe: €${inv.amount}`)
            })
        }

        // Check recent expenses
        console.log('\n📋 GASTOS RECIENTES:')
        const { data: recentExpenses, error: expensesRecentError } = await supabase
            .from('expenses')
            .select('id, vendor, amount, description, created_at')
            .order('created_at', { ascending: false })
            .limit(5)

        if (expensesRecentError) {
            console.log(`❌ Error obteniendo gastos recientes: ${expensesRecentError.message}`)
        } else {
            console.log('📄 Últimos 5 gastos:')
            recentExpenses.forEach((exp, index) => {
                console.log(`   ${index + 1}. ID: ${exp.id}, Proveedor: ${exp.vendor}, Importe: €${exp.amount}, Descripción: ${exp.description}`)
            })
        }

    } catch (error) {
        console.error('❌ Error general:', error.message)
    }
}

checkDatabaseStructure().then(() => {
    console.log('\n✅ Verificación completada')
    process.exit(0)
}).catch(error => {
    console.error('❌ Error:', error.message)
    process.exit(1)
})
