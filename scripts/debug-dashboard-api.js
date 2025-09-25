// Script de debug para probar cada consulta de la API del dashboard individualmente
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

async function debugDashboardAPI() {
    try {
        console.log('🔍 DEBUGGING DASHBOARD API - Consulta por consulta')
        console.log('🔗 URL:', process.env.SUPABASE_URL)
        console.log('🔑 Key:', process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...')
        console.log('🏢 Tenant ID:', 1)
        console.log('')

        const tenantId = 1

        // 1. PROBAR CONEXIÓN BÁSICA
        console.log('1️⃣ PROBANDO CONEXIÓN BÁSICA...')
        const { data: testData, error: testError } = await supabase
            .from('tenants')
            .select('*')
            .limit(1)

        if (testError) {
            console.error('❌ Error de conexión:', testError)
            return
        }
        console.log('✅ Conexión exitosa')
        console.log('')

        // 2. PROBAR CONSULTA DE INVOICES
        console.log('2️⃣ PROBANDO CONSULTA DE INVOICES...')
        const { count: totalInvoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)

        if (invoicesError) {
            console.error('❌ Error en invoices:', invoicesError)
        } else {
            console.log(`✅ Invoices count: ${totalInvoices || 0}`)
        }

        // Verificar si hay datos reales
        const { data: invoicesData } = await supabase
            .from('invoices')
            .select('*')
            .eq('tenant_id', tenantId)
            .limit(3)

        if (invoicesData && invoicesData.length > 0) {
            console.log(`📋 Invoices encontradas: ${invoicesData.length}`)
            invoicesData.forEach(inv => {
                console.log(`   - ID: ${inv.id}, Number: ${inv.number}, Amount: €${inv.total_amount}, Status: ${inv.status}`)
            })
        } else {
            console.log('❌ No hay invoices en tenant 1')
        }
        console.log('')

        // 3. PROBAR CONSULTA DE EXPENSES
        console.log('3️⃣ PROBANDO CONSULTA DE EXPENSES...')
        const { count: totalExpenses, error: expensesError } = await supabase
            .from('expenses')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)

        if (expensesError) {
            console.error('❌ Error en expenses:', expensesError)
        } else {
            console.log(`✅ Expenses count: ${totalExpenses || 0}`)
        }

        // Verificar si hay datos reales
        const { data: expensesData } = await supabase
            .from('expenses')
            .select('*')
            .eq('tenant_id', tenantId)
            .limit(3)

        if (expensesData && expensesData.length > 0) {
            console.log(`📋 Expenses encontradas: ${expensesData.length}`)
            expensesData.forEach(exp => {
                console.log(`   - ID: ${exp.id}, Vendor: ${exp.vendor}, Amount: €${exp.amount}, Category: ${exp.category}`)
            })
        } else {
            console.log('❌ No hay expenses en tenant 1')
        }
        console.log('')

        // 4. PROBAR CONSULTA DE DOCUMENTS
        console.log('4️⃣ PROBANDO CONSULTA DE DOCUMENTS...')
        const { count: totalDocuments, error: documentsError } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)

        if (documentsError) {
            console.error('❌ Error en documents:', documentsError)
        } else {
            console.log(`✅ Documents count: ${totalDocuments || 0}`)
        }

        // Verificar si hay datos reales
        const { data: documentsData } = await supabase
            .from('documents')
            .select('*')
            .eq('tenant_id', tenantId)
            .limit(3)

        if (documentsData && documentsData.length > 0) {
            console.log(`📋 Documents encontrados: ${documentsData.length}`)
            documentsData.forEach(doc => {
                console.log(`   - ID: ${doc.id}, Filename: ${doc.filename}, Status: ${doc.processing_status}`)
            })
        } else {
            console.log('❌ No hay documents en tenant 1')
        }
        console.log('')

        // 5. PROBAR CONSULTA DE RAW DOCUMENTS
        console.log('5️⃣ PROBANDO CONSULTA DE RAW DOCUMENTS...')
        const { count: totalRawDocuments, error: rawDocsError } = await supabase
            .from('raw_documents')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)

        if (rawDocsError) {
            console.error('❌ Error en raw_documents:', rawDocsError)
        } else {
            console.log(`✅ Raw Documents count: ${totalRawDocuments || 0}`)
        }

        // Verificar si hay datos reales
        const { data: rawDocsData } = await supabase
            .from('raw_documents')
            .select('*')
            .eq('tenant_id', tenantId)
            .limit(3)

        if (rawDocsData && rawDocsData.length > 0) {
            console.log(`📋 Raw Documents encontrados: ${rawDocsData.length}`)
            rawDocsData.forEach(doc => {
                console.log(`   - ID: ${doc.id}, Filename: ${doc.original_filename}, Status: ${doc.processing_status}`)
            })
        } else {
            console.log('❌ No hay raw_documents en tenant 1')
        }
        console.log('')

        // 6. PROBAR CONSULTA DE CLIENTS
        console.log('6️⃣ PROBANDO CONSULTA DE CLIENTS...')
        const { count: totalClients, error: clientsError } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)

        if (clientsError) {
            console.error('❌ Error en clients:', clientsError)
        } else {
            console.log(`✅ Clients count: ${totalClients || 0}`)
        }

        // Verificar si hay datos reales
        const { data: clientsData } = await supabase
            .from('clients')
            .select('*')
            .eq('tenant_id', tenantId)
            .limit(3)

        if (clientsData && clientsData.length > 0) {
            console.log(`📋 Clients encontrados: ${clientsData.length}`)
            clientsData.forEach(client => {
                console.log(`   - ID: ${client.id}, Name: ${client.name}, Email: ${client.email}`)
            })
        } else {
            console.log('❌ No hay clients en tenant 1')
        }
        console.log('')

        // 7. PROBAR CONSULTA DE REVENUE
        console.log('7️⃣ PROBANDO CONSULTA DE REVENUE...')
        const { data: revenueData, error: revenueError } = await supabase
            .from('invoices')
            .select('total_amount, status')
            .eq('tenant_id', tenantId)
            .eq('status', 'paid')

        if (revenueError) {
            console.error('❌ Error en revenue:', revenueError)
        } else {
            console.log(`✅ Revenue data encontrada: ${revenueData?.length || 0} invoices pagas`)
            if (revenueData && revenueData.length > 0) {
                const totalRevenue = revenueData.reduce((sum, invoice) =>
                    sum + (parseFloat(invoice.total_amount?.toString() || '0') || 0), 0)
                console.log(`💰 Total Revenue: €${totalRevenue}`)
            }
        }
        console.log('')

        // 8. PROBAR CONSULTA DE EXPENSE AMOUNTS
        console.log('8️⃣ PROBANDO CONSULTA DE EXPENSE AMOUNTS...')
        const { data: expenseData, error: expenseAmountError } = await supabase
            .from('expenses')
            .select('amount, is_deductible')
            .eq('tenant_id', tenantId)

        if (expenseAmountError) {
            console.error('❌ Error en expense amounts:', expenseAmountError)
        } else {
            console.log(`✅ Expense data encontrada: ${expenseData?.length || 0} expenses`)
            if (expenseData && expenseData.length > 0) {
                const totalExpenseAmount = expenseData.reduce((sum, expense) =>
                    sum + (parseFloat(expense.amount?.toString() || '0') || 0), 0)
                console.log(`💸 Total Expense Amount: €${totalExpenseAmount}`)
            }
        }
        console.log('')

        // 9. RESUMEN FINAL
        console.log('🎯 RESUMEN FINAL DEL DEBUG:')
        console.log('============================')

        if (totalInvoices === 0 && totalExpenses === 0 && totalClients === 0) {
            console.log('❌ PROBLEMA IDENTIFICADO: NO HAY DATOS EN LA BASE DE DATOS')
            console.log('💡 SOLUCIÓN: Necesitas ejecutar el script de datos de teste')
            console.log('📋 Script a usar: scripts/test-dashboard-data-simple.sql')
        } else {
            console.log('✅ La base de datos tiene algunos datos')
            console.log(`📊 Invoices: ${totalInvoices || 0}`)
            console.log(`📊 Expenses: ${totalExpenses || 0}`)
            console.log(`📊 Clients: ${totalClients || 0}`)
            console.log(`📊 Documents: ${totalDocuments || 0}`)
            console.log(`📊 Raw Documents: ${totalRawDocuments || 0}`)
        }

        console.log('')
        console.log('🚀 PRÓXIMOS PASOS:')
        console.log('1. Ejecutar script de datos: scripts/test-dashboard-data-simple.sql')
        console.log('2. Verificar datos: scripts/verify-dashboard-data.sql')
        console.log('3. Probar dashboard: http://localhost:5000/dashboard')

    } catch (error) {
        console.error('❌ Error general en debug:', error.message)
    }
}

// Ejecutar el debug
debugDashboardAPI()





