#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTables() {
    try {
        console.log('🔍 Verificando estado de las tablas...\n')

        // Check documents table
        const { data: documents, error: docsError } = await supabase
            .from('documents')
            .select('id, filename, document_type, created_at')
            .order('created_at', { ascending: false })
            .limit(5)

        if (docsError) {
            console.error('❌ Error fetching documents:', docsError)
        } else {
            console.log('📄 Últimos 5 documentos:')
            documents.forEach(doc => {
                console.log(`   - ID: ${doc.id}, Archivo: ${doc.filename}, Tipo: ${doc.document_type}, Fecha: ${doc.created_at}`)
            })
        }

        console.log('\n')

        // Check invoices table
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('id, number, client_name, amount, created_at')
            .order('created_at', { ascending: false })
            .limit(5)

        if (invoicesError) {
            console.error('❌ Error fetching invoices:', invoicesError)
        } else {
            console.log('💰 Últimas 5 facturas:')
            invoices.forEach(inv => {
                console.log(`   - ID: ${inv.id}, Número: ${inv.number}, Cliente: ${inv.client_name}, Importe: €${inv.amount}, Fecha: ${inv.created_at}`)
            })
        }

        console.log('\n')

        // Check expenses table
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('id, vendor, amount, description, created_at')
            .order('created_at', { ascending: false })
            .limit(5)

        if (expensesError) {
            console.error('❌ Error fetching expenses:', expensesError)
        } else {
            console.log('💸 Últimos 5 gastos:')
            expenses.forEach(exp => {
                console.log(`   - ID: ${exp.id}, Proveedor: ${exp.vendor}, Importe: €${exp.amount}, Descripción: ${exp.description}, Fecha: ${exp.created_at}`)
            })
        }

        console.log('\n')

        // Check images table
        const { data: images, error: imagesError } = await supabase
            .from('images')
            .select('id, name, mime_type, source, created_at')
            .order('created_at', { ascending: false })
            .limit(5)

        if (imagesError) {
            console.error('❌ Error fetching images:', imagesError)
        } else {
            console.log('🖼️ Últimas 5 imágenes:')
            images.forEach(img => {
                console.log(`   - ID: ${img.id}, Nombre: ${img.name}, Tipo: ${img.mime_type}, Fuente: ${img.source}, Fecha: ${img.created_at}`)
            })
        }

    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

checkTables()
