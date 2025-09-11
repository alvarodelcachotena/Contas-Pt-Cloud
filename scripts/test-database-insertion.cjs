#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDatabaseInsertion() {
    try {
        console.log('🧪 Probando inserción directa en base de datos...\n')

        // Test 1: Insertar cliente
        console.log('👤 Probando inserción de cliente...')
        const testClient = {
            tenant_id: 1,
            name: 'TEST CLIENTE WHATSAPP',
            email: 'test@whatsapp.com',
            phone: null,
            address: null,
            nif: '123456789',
            is_active: true
        }

        const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert(testClient)
            .select('id')
            .single()

        if (clientError) {
            console.error('❌ Error insertando cliente:', clientError)
        } else {
            console.log('✅ Cliente insertado:', client.id)
        }

        console.log('\n')

        // Test 2: Insertar factura
        console.log('📄 Probando inserción de factura...')
        const testInvoice = {
            tenant_id: 1,
            client_id: client?.id || null,
            number: 'TEST-WHATSAPP-001',
            client_name: 'TEST CLIENTE WHATSAPP',
            client_email: 'test@whatsapp.com',
            client_tax_id: '123456789',
            issue_date: new Date().toISOString().split('T')[0],
            due_date: null,
            amount: 100.00,
            vat_amount: 23.00,
            vat_rate: 23,
            total_amount: 123.00,
            status: 'paid',
            description: 'Test desde WhatsApp',
            payment_terms: '30 dias',
            payment_type: 'card'
        }

        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert(testInvoice)
            .select('id')
            .single()

        if (invoiceError) {
            console.error('❌ Error insertando factura:', invoiceError)
        } else {
            console.log('✅ Factura insertada:', invoice.id)
        }

        console.log('\n')

        // Test 3: Insertar gasto
        console.log('💸 Probando inserción de gasto...')
        const testExpense = {
            tenant_id: 1,
            vendor: 'TEST PROVEEDOR WHATSAPP',
            amount: 100.00,
            vat_amount: 23.00,
            vat_rate: 23,
            category: 'General',
            description: 'Test gasto desde WhatsApp',
            receipt_number: 'TEST-RECEIPT-001',
            expense_date: new Date().toISOString().split('T')[0],
            is_deductible: true,
            created_at: new Date().toISOString()
        }

        const { data: expense, error: expenseError } = await supabase
            .from('expenses')
            .insert(testExpense)
            .select('id')
            .single()

        if (expenseError) {
            console.error('❌ Error insertando gasto:', expenseError)
        } else {
            console.log('✅ Gasto insertado:', expense.id)
        }

        console.log('\n')

        // Test 4: Insertar imagen
        console.log('🖼️ Probando inserción de imagen...')
        const testImage = {
            tenant_id: 1,
            name: 'TEST IMAGEN WHATSAPP',
            original_filename: 'test.jpg',
            image_data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A',
            mime_type: 'image/jpeg',
            file_size: 1000,
            source: 'whatsapp',
            company_name: 'TEST COMPANY',
            document_date: new Date().toISOString().split('T')[0]
        }

        const { data: image, error: imageError } = await supabase
            .from('images')
            .insert(testImage)
            .select('id')
            .single()

        if (imageError) {
            console.error('❌ Error insertando imagen:', imageError)
        } else {
            console.log('✅ Imagen insertada:', image.id)
        }

        console.log('\n📊 RESUMEN DE PRUEBAS:')
        console.log(`✅ Cliente: ${client ? 'OK' : 'FALLO'}`)
        console.log(`✅ Factura: ${invoice ? 'OK' : 'FALLO'}`)
        console.log(`✅ Gasto: ${expense ? 'OK' : 'FALLO'}`)
        console.log(`✅ Imagen: ${image ? 'OK' : 'FALLO'}`)

    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

testDatabaseInsertion()
