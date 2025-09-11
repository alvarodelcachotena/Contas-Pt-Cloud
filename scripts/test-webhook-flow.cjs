#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Simular datos que vienen del WhatsApp
const mockAnalysisResult = {
    document_type: 'expense',
    extracted_data: {
        invoice_number: 'FT 3A2501/573',
        description: 'Sangria Moet Chandon, Mojito, Agua 75cl, Café',
        subtotal: 184.02,
        vat_amount: 29.98,
        vendor_name: 'TEST RESTAURANT',
        payment_type: 'card',
        date: '2025-01-10'
    }
}

const mockDocumentId = 999
const mockTenantId = 1

// Función createOrFindSupplier (copiada del webhook)
async function createOrFindSupplier(supplierData, tenantId, supabase) {
    try {
        const supplierName = supplierData.vendor_name || supplierData.vendor || supplierData.client_name

        if (!supplierName) {
            console.log(`⚠️ No se puede crear proveedor sin nombre`)
            return null
        }

        // First, try to find existing supplier by name
        const { data: existingSupplier } = await supabase
            .from('suppliers')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('name', supplierName)
            .single()

        if (existingSupplier) {
            console.log(`✅ Proveedor encontrado existente: ${supplierName} (ID: ${existingSupplier.id})`)
            return existingSupplier.id
        }

        // Create new supplier
        const supplierToInsert = {
            tenant_id: tenantId,
            name: supplierName,
            email: null,
            phone: null,
            address: null,
            tax_id: supplierData.vendor_nif || supplierData.client_nif || null,
            is_active: true
        }

        console.log(`🏢 Creando nuevo proveedor:`, supplierToInsert)

        const { data: newSupplier, error: supplierError } = await supabase
            .from('suppliers')
            .insert(supplierToInsert)
            .select('id')
            .single()

        if (supplierError) {
            console.error(`❌ Error creando proveedor:`, supplierError)
            return null
        }

        console.log(`✅ Proveedor creado exitosamente: ${supplierName} (ID: ${newSupplier.id})`)
        return newSupplier.id

    } catch (error) {
        console.error(`❌ Error en createOrFindSupplier:`, error)
        return null
    }
}

// Función processExpense (simplificada)
async function processExpense(expenseData, documentId, supabase, tenantId) {
    try {
        console.log(`🚀 INICIANDO processExpense`)
        console.log(`💰 Procesando gasto desde WhatsApp: ${expenseData.description || expenseData.vendor_name || 'Sin descripción'}`)
        console.log(`📊 Datos del gasto:`, JSON.stringify(expenseData, null, 2))
        console.log(`🔍 Document ID: ${documentId}`)
        console.log(`🔍 Tenant ID: ${tenantId}`)

        // Extract data from WhatsApp document
        const vendorName = expenseData.vendor_name || expenseData.vendor || expenseData.client_name || 'Proveedor Desconocido'
        const amount = expenseData.amount || expenseData.total || expenseData.subtotal || 0
        const vatAmount = expenseData.vat_amount || 0
        const vatRate = expenseData.vat_rate || 0
        const description = expenseData.description || `Gasto procesado desde WhatsApp - ${vendorName}`
        const expenseDate = expenseData.expense_date || expenseData.invoice_date || expenseData.date || new Date().toISOString().split('T')[0]
        const receiptNumber = expenseData.invoice_number || expenseData.receipt_number || `WHATSAPP-${Date.now()}`

        console.log(`📋 Datos extraídos:`)
        console.log(`   - Proveedor: ${vendorName}`)
        console.log(`   - Importe: €${amount}`)
        console.log(`   - Fecha: ${expenseDate}`)
        console.log(`   - Descripción: ${description}`)

        // Create or find supplier automatically for expenses
        const supplierId = await createOrFindSupplier(expenseData, tenantId, supabase)
        console.log(`🏢 Proveedor ID para gasto: ${supplierId || 'null'}`)

        // Create expense record
        const { data: expense, error: expenseError } = await supabase
            .from('expenses')
            .insert({
                tenant_id: tenantId,
                vendor: vendorName,
                amount: amount,
                vat_amount: vatAmount,
                vat_rate: vatRate,
                category: 'General',
                description: description,
                receipt_number: receiptNumber,
                expense_date: expenseDate,
                is_deductible: true,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (expenseError) {
            throw new Error(`Error creating expense: ${expenseError.message}`)
        }

        console.log(`✅ Gasto creado: ${expense.id}`)

        // Update document with expense reference
        await supabase
            .from('documents')
            .update({
                extracted_data: {
                    expense_id: expense.id,
                    processing_notes: ['Gasto procesado y creado exitosamente']
                }
            })
            .eq('id', documentId)

        console.log(`🎉 processExpense FINALIZADO EXITOSAMENTE`)
        return expense

    } catch (error) {
        console.error('❌ Error processing expense:', error)
        console.error('❌ Error details:', error.message)
        console.error('❌ Error stack:', error.stack)
        throw error
    }
}

async function testWebhookFlow() {
    try {
        console.log('🧪 Probando flujo completo del webhook...\n')

        console.log('📊 Datos de entrada:')
        console.log('   - Document type:', mockAnalysisResult.document_type)
        console.log('   - Extracted data:', JSON.stringify(mockAnalysisResult.extracted_data, null, 2))
        console.log('   - Document ID:', mockDocumentId)
        console.log('   - Tenant ID:', mockTenantId)

        console.log('\n🔍 Ejecutando processExpense...')
        const result = await processExpense(mockAnalysisResult.extracted_data, mockDocumentId, supabase, mockTenantId)

        console.log('\n✅ RESULTADO FINAL:')
        console.log('   - Expense ID:', result.id)
        console.log('   - Vendor:', result.vendor)
        console.log('   - Amount:', result.amount)

    } catch (error) {
        console.error('\n❌ ERROR EN EL FLUJO:')
        console.error('   - Message:', error.message)
        console.error('   - Stack:', error.stack)
    }
}

testWebhookFlow()
