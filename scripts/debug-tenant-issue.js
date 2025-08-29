// Script para debuggear el problema del tenant_id
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

async function debugTenantIssue() {
    try {
        console.log('🔍 DEBUGGEANDO PROBLEMA DEL TENANT_ID')
        console.log('🔗 URL:', process.env.SUPABASE_URL)
        console.log('')

        // 1. VERIFICAR TODAS LAS TABLAS SIN FILTRO DE TENANT
        console.log('1️⃣ VERIFICANDO DATOS SIN FILTRO DE TENANT...')

        // Tenants
        const { count: allTenants, data: tenantsData } = await supabase
            .from('tenants')
            .select('*', { count: 'exact', head: true })

        console.log(`🏢 Total Tenants: ${allTenants || 0}`)
        if (tenantsData && tenantsData.length > 0) {
            tenantsData.forEach(tenant => {
                console.log(`   - ID: ${tenant.id}, Name: ${tenant.name}`)
            })
        }
        console.log('')

        // Users
        const { count: allUsers, data: usersData } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })

        console.log(`👤 Total Users: ${allUsers || 0}`)
        if (usersData && usersData.length > 0) {
            usersData.forEach(user => {
                console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`)
            })
        }
        console.log('')

        // Clients
        const { count: allClients, data: clientsData } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })

        console.log(`👥 Total Clients: ${allClients || 0}`)
        if (clientsData && clientsData.length > 0) {
            clientsData.forEach(client => {
                console.log(`   - ID: ${client.id}, Name: ${client.name}, Tenant ID: ${client.tenant_id}`)
            })
        }
        console.log('')

        // Invoices
        const { count: allInvoices, data: invoicesData } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })

        console.log(`🧾 Total Invoices: ${allInvoices || 0}`)
        if (invoicesData && invoicesData.length > 0) {
            invoicesData.forEach(invoice => {
                console.log(`   - ID: ${invoice.id}, Number: ${invoice.number}, Tenant ID: ${invoice.tenant_id}, Amount: €${invoice.total_amount}`)
            })
        }
        console.log('')

        // Expenses
        const { count: allExpenses, data: expensesData } = await supabase
            .from('expenses')
            .select('*', { count: 'exact', head: true })

        console.log(`💸 Total Expenses: ${allExpenses || 0}`)
        if (expensesData && expensesData.length > 0) {
            expensesData.forEach(expense => {
                console.log(`   - ID: ${expense.id}, Vendor: ${expense.vendor}, Tenant ID: ${expense.tenant_id}, Amount: €${expense.amount}`)
            })
        }
        console.log('')

        // Documents
        const { count: allDocuments, data: documentsData } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })

        console.log(`📄 Total Documents: ${allDocuments || 0}`)
        if (documentsData && documentsData.length > 0) {
            documentsData.forEach(doc => {
                console.log(`   - ID: ${doc.id}, Filename: ${doc.filename}, Tenant ID: ${doc.tenant_id}`)
            })
        }
        console.log('')

        // Raw Documents
        const { count: allRawDocuments, data: rawDocsData } = await supabase
            .from('raw_documents')
            .select('*', { count: 'exact', head: true })

        console.log(`⏳ Total Raw Documents: ${allRawDocuments || 0}`)
        if (rawDocsData && rawDocsData.length > 0) {
            rawDocsData.forEach(doc => {
                console.log(`   - ID: ${doc.id}, Filename: ${doc.original_filename}, Tenant ID: ${doc.tenant_id}`)
            })
        }
        console.log('')

        // 2. VERIFICAR QUÉ TENANT_ID TIENEN LOS DATOS
        console.log('2️⃣ VERIFICANDO TENANT_ID DE LOS DATOS...')

        if (clientsData && clientsData.length > 0) {
            const tenantIds = [...new Set(clientsData.map(c => c.tenant_id))]
            console.log(`🔍 Tenant IDs encontrados en clients: ${tenantIds.join(', ')}`)
        }

        if (invoicesData && invoicesData.length > 0) {
            const tenantIds = [...new Set(invoicesData.map(i => i.tenant_id))]
            console.log(`🔍 Tenant IDs encontrados en invoices: ${tenantIds.join(', ')}`)
        }

        if (expensesData && expensesData.length > 0) {
            const tenantIds = [...new Set(expensesData.map(e => e.tenant_id))]
            console.log(`🔍 Tenant IDs encontrados en expenses: ${tenantIds.join(', ')}`)
        }

        if (documentsData && documentsData.length > 0) {
            const tenantIds = [...new Set(documentsData.map(d => d.tenant_id))]
            console.log(`🔍 Tenant IDs encontrados en documents: ${tenantIds.join(', ')}`)
        }

        if (rawDocsData && rawDocsData.length > 0) {
            const tenantIds = [...new Set(rawDocsData.map(d => d.tenant_id))]
            console.log(`🔍 Tenant IDs encontrados en raw_documents: ${tenantIds.join(', ')}`)
        }
        console.log('')

        // 3. PROBAR CONSULTAS CON DIFERENTES TENANT_ID
        console.log('3️⃣ PROBANDO CONSULTAS CON DIFERENTES TENANT_ID...')

        // Probar con tenant_id = 1
        console.log('🔍 Probando con tenant_id = 1...')
        const { count: clientsTenant1 } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', 1)

        const { count: invoicesTenant1 } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', 1)

        console.log(`   Clients tenant 1: ${clientsTenant1 || 0}`)
        console.log(`   Invoices tenant 1: ${invoicesTenant1 || 0}`)

        // Probar con tenant_id = 0 (si existe)
        console.log('🔍 Probando con tenant_id = 0...')
        const { count: clientsTenant0 } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', 0)

        const { count: invoicesTenant0 } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', 0)

        console.log(`   Clients tenant 0: ${clientsTenant0 || 0}`)
        console.log(`   Invoices tenant 0: ${invoicesTenant0 || 0}`)

        // Probar sin filtro de tenant
        console.log('🔍 Probando sin filtro de tenant...')
        const { count: clientsNoFilter } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })

        const { count: invoicesNoFilter } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })

        console.log(`   Clients sin filtro: ${clientsNoFilter || 0}`)
        console.log(`   Invoices sin filtro: ${invoicesNoFilter || 0}`)
        console.log('')

        // 4. VERIFICAR SI HAY PROBLEMA CON EL TIPO DE DATO
        console.log('4️⃣ VERIFICANDO TIPOS DE DATO...')

        if (clientsData && clientsData.length > 0) {
            const firstClient = clientsData[0]
            console.log(`🔍 Primer client - tenant_id: ${firstClient.tenant_id} (tipo: ${typeof firstClient.tenant_id})`)
        }

        if (invoicesData && invoicesData.length > 0) {
            const firstInvoice = invoicesData[0]
            console.log(`🔍 Primera invoice - tenant_id: ${firstInvoice.tenant_id} (tipo: ${typeof firstInvoice.tenant_id})`)
        }
        console.log('')

        // 5. RESUMEN Y SOLUCIÓN
        console.log('🎯 RESUMEN DEL PROBLEMA:')
        console.log('========================')

        if (allClients > 0 && clientsTenant1 === 0) {
            console.log('❌ PROBLEMA IDENTIFICADO: Los datos existen pero no con tenant_id = 1')
            console.log('💡 SOLUCIÓN: Necesitas verificar qué tenant_id tienen los datos reales')
        } else if (allClients === 0) {
            console.log('❌ PROBLEMA IDENTIFICADO: No hay datos en la base de datos')
            console.log('💡 SOLUCIÓN: Ejecutar script de datos de teste')
        } else {
            console.log('✅ Los datos están correctos, el problema debe estar en otro lugar')
        }

        console.log('')
        console.log('🚀 PRÓXIMOS PASOS:')
        console.log('1. Verificar qué tenant_id tienen los datos reales')
        console.log('2. Actualizar el dashboard para usar el tenant_id correcto')
        console.log('3. O actualizar los datos para usar tenant_id = 1')

    } catch (error) {
        console.error('❌ Error en debug:', error.message)
    }
}

// Ejecutar el debug
debugTenantIssue()

