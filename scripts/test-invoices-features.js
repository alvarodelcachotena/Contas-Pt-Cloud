// Script para probar las funcionalidades de invoices
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

async function testInvoicesFeatures() {
    try {
        console.log('🧪 PROBANDO FUNCIONALIDADES DE INVOICES')
        console.log('========================================')
        console.log('')

        // 1. VERIFICAR TOTAL DE INVOICES
        console.log('1️⃣ VERIFICANDO TOTAL DE INVOICES...')

        const { count: totalInvoices, error: countError } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })

        if (countError) {
            console.error('❌ Error contando invoices:', countError)
        } else {
            console.log(`📊 Total de invoices en la base de datos: ${totalInvoices || 0}`)
        }
        console.log('')

        // 2. VERIFICAR INVOICES CON TENANT_ID = 1
        console.log('2️⃣ VERIFICANDO INVOICES CON TENANT_ID = 1...')

        const { data: invoicesTenant1, error: tenantError } = await supabase
            .from('invoices')
            .select('*')
            .eq('tenant_id', 1)
            .order('created_at', { ascending: false })

        if (tenantError) {
            console.error('❌ Error obteniendo invoices tenant 1:', tenantError)
        } else {
            console.log(`📊 Invoices con tenant_id = 1: ${invoicesTenant1?.length || 0}`)

            if (invoicesTenant1 && invoicesTenant1.length > 0) {
                console.log('📋 Últimos 3 invoices:')
                invoicesTenant1.slice(0, 3).forEach((invoice, index) => {
                    console.log(`   ${index + 1}. ID: ${invoice.id}, Number: ${invoice.number}`)
                    console.log(`      Client: ${invoice.client_name}, NIF: ${invoice.client_tax_id}`)
                    console.log(`      Amount: €${invoice.amount}, VAT: €${invoice.vat_amount}`)
                    console.log(`      Total: €${invoice.total_amount}, Status: ${invoice.status}`)
                    console.log(`      Issue Date: ${invoice.issue_date}, Due Date: ${invoice.due_date}`)
                    console.log('')
                })
            }
        }
        console.log('')

        // 3. VERIFICAR ESTRUCTURA DE LA TABLA
        console.log('3️⃣ VERIFICANDO ESTRUCTURA DE LA TABLA...')

        const { data: structureData, error: structureError } = await supabase
            .from('invoices')
            .select('*')
            .limit(0) // Solo obtener estructura

        if (structureError) {
            console.error('❌ Error obteniendo estructura:', structureError)
        } else {
            console.log('✅ Estructura de tabla accesible')
            console.log('📋 Columnas disponibles:')
            if (structureData && structureData.length > 0) {
                Object.keys(structureData[0]).forEach(column => {
                    console.log(`   - ${column}`)
                })
            }
        }
        console.log('')

        // 4. PROBAR CREAR UNA FACTURA DE PRUEBA
        console.log('4️⃣ PROBANDO CREAR FACTURA DE PRUEBA...')

        const testInvoice = {
            tenant_id: 1,
            number: 'FAT-TEST-001',
            client_name: 'Cliente Teste',
            client_email: 'teste@exemplo.pt',
            client_tax_id: '123456789',
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 100.00,
            vat_amount: 23.00,
            vat_rate: 23,
            total_amount: 123.00,
            status: 'draft',
            description: 'Fatura de teste para verificar funcionalidade',
            payment_terms: '30 dias'
        }

        const { data: newInvoice, error: insertError } = await supabase
            .from('invoices')
            .insert(testInvoice)
            .select()
            .single()

        if (insertError) {
            console.error('❌ Error creando invoice de prueba:', insertError)
        } else {
            console.log('✅ Invoice de prueba creado exitosamente:')
            console.log(`   ID: ${newInvoice.id}`)
            console.log(`   Number: ${newInvoice.number}`)
            console.log(`   Client: ${newInvoice.client_name}`)
            console.log(`   Total: €${newInvoice.total_amount}`)

            // Limpiar invoice de prueba
            const { error: deleteError } = await supabase
                .from('invoices')
                .delete()
                .eq('id', newInvoice.id)

            if (deleteError) {
                console.log('⚠️  No se pudo eliminar invoice de prueba:', deleteError.message)
            } else {
                console.log('✅ Invoice de prueba eliminado correctamente')
            }
        }
        console.log('')

        // 5. RESUMEN Y ESTADO
        console.log('🎯 RESUMEN DEL ESTADO:')
        console.log('======================')

        if (totalInvoices > 0) {
            console.log('✅ La tabla invoices tiene datos')
            console.log(`📊 Total de invoices: ${totalInvoices}`)
            console.log(`📊 Invoices tenant 1: ${invoicesTenant1?.length || 0}`)

            if (invoicesTenant1 && invoicesTenant1.length > 0) {
                console.log('✅ Los invoices se pueden obtener correctamente')
                console.log('✅ La API debería funcionar en el frontend')
            } else {
                console.log('⚠️  Los invoices existen pero no se pueden obtener con tenant_id = 1')
            }
        } else {
            console.log('❌ La tabla invoices está vacía')
        }

        console.log('')
        console.log('🚀 PRÓXIMOS PASOS:')
        console.log('1. Probar crear invoice desde el frontend')
        console.log('2. Verificar que no hay alerts')
        console.log('3. Verificar que los errores se muestran en rojo en el modal')
        console.log('4. Verificar que los datos se recargan automáticamente')
        console.log('5. Probar exportación de invoices')

    } catch (error) {
        console.error('❌ Error en test:', error.message)
    }
}

// Ejecutar test
testInvoicesFeatures()
