// Script para debuggear la API de clients
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

async function debugClientsAPI() {
    try {
        console.log('🔍 DEBUGGEANDO API DE CLIENTS')
        console.log('🔗 URL:', process.env.SUPABASE_URL)
        console.log('')

        // 1. VERIFICAR CONEXIÓN Y TABLA
        console.log('1️⃣ VERIFICANDO CONEXIÓN Y TABLA...')

        const { data: testData, error: testError } = await supabase
            .from('clients')
            .select('*')
            .limit(1)

        if (testError) {
            console.error('❌ Error de conexión:', testError)
            return
        }
        console.log('✅ Conexión exitosa')
        console.log('')

        // 2. VERIFICAR TOTAL DE CLIENTS
        console.log('2️⃣ VERIFICANDO TOTAL DE CLIENTS...')

        const { count: totalClients, error: countError } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })

        if (countError) {
            console.error('❌ Error contando clients:', countError)
        } else {
            console.log(`📊 Total de clients en la base de datos: ${totalClients || 0}`)
        }
        console.log('')

        // 3. VERIFICAR CLIENTS CON TENANT_ID = 1
        console.log('3️⃣ VERIFICANDO CLIENTS CON TENANT_ID = 1...')

        const { count: clientsTenant1, error: tenantError } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', 1)

        if (tenantError) {
            console.error('❌ Error contando clients tenant 1:', tenantError)
        } else {
            console.log(`📊 Clients con tenant_id = 1: ${clientsTenant1 || 0}`)
        }
        console.log('')

        // 4. VERIFICAR TODOS LOS CLIENTS SIN FILTRO
        console.log('4️⃣ VERIFICANDO TODOS LOS CLIENTS SIN FILTRO...')

        const { data: allClients, error: allError } = await supabase
            .from('clients')
            .select('*')
            .limit(10)

        if (allError) {
            console.error('❌ Error obteniendo clients:', allError)
        } else {
            console.log(`📋 Clients obtenidos: ${allClients?.length || 0}`)

            if (allClients && allClients.length > 0) {
                console.log('📋 Primeros 3 clients:')
                allClients.slice(0, 3).forEach((client, index) => {
                    console.log(`   ${index + 1}. ID: ${client.id}, Name: ${client.name}, Tenant ID: ${client.tenant_id}`)
                    console.log(`      Email: ${client.email}, Phone: ${client.phone}`)
                    console.log(`      Tax ID: ${client.tax_id}, City: ${client.city}`)
                    console.log(`      Postal Code: ${client.postal_code}, Active: ${client.is_active}`)
                    console.log('')
                })
            }
        }
        console.log('')

        // 5. VERIFICAR TENANT_ID DISPONIBLES
        console.log('5️⃣ VERIFICANDO TENANT_ID DISPONIBLES...')

        const { data: tenantIds, error: tenantIdsError } = await supabase
            .from('clients')
            .select('tenant_id')

        if (tenantIdsError) {
            console.error('❌ Error obteniendo tenant_ids:', tenantIdsError)
        } else {
            const uniqueTenantIds = [...new Set(tenantIds.map(c => c.tenant_id))]
            console.log(`🔍 Tenant IDs encontrados: ${uniqueTenantIds.join(', ')}`)

            // Contar por cada tenant_id
            uniqueTenantIds.forEach(tenantId => {
                const count = tenantIds.filter(c => c.tenant_id === tenantId).length
                console.log(`   Tenant ${tenantId}: ${count} clients`)
            })
        }
        console.log('')

        // 6. PROBAR CONSULTA SIMILAR A LA API
        console.log('6️⃣ PROBANDO CONSULTA SIMILAR A LA API...')

        const { data: apiStyleClients, error: apiError } = await supabase
            .from('clients')
            .select('*')
            .eq('tenant_id', 1)
            .order('created_at', { ascending: false })

        if (apiError) {
            console.error('❌ Error en consulta estilo API:', apiError)
        } else {
            console.log(`📊 Clients obtenidos con consulta estilo API: ${apiStyleClients?.length || 0}`)

            if (apiStyleClients && apiStyleClients.length > 0) {
                console.log('📋 Primer client de la API:')
                const firstClient = apiStyleClients[0]
                console.log(`   ID: ${firstClient.id}`)
                console.log(`   Name: ${firstClient.name}`)
                console.log(`   Email: ${firstClient.email}`)
                console.log(`   Phone: ${firstClient.phone}`)
                console.log(`   Address: ${firstClient.address}`)
                console.log(`   Tax ID: ${firstClient.tax_id}`)
                console.log(`   Postal Code: ${firstClient.postal_code}`)
                console.log(`   City: ${firstClient.city}`)
                console.log(`   Active: ${firstClient.is_active}`)
                console.log(`   Created At: ${firstClient.created_at}`)
            }
        }
        console.log('')

        // 7. RESUMEN Y SOLUCIÓN
        console.log('🎯 RESUMEN DEL PROBLEMA:')
        console.log('========================')

        if (totalClients > 0 && clientsTenant1 === 0) {
            console.log('❌ PROBLEMA IDENTIFICADO: Los clients existen pero no con tenant_id = 1')
            console.log('💡 SOLUCIÓN: Los clients tienen un tenant_id diferente')
        } else if (totalClients === 0) {
            console.log('❌ PROBLEMA IDENTIFICADO: No hay clients en la base de datos')
            console.log('💡 SOLUCIÓN: Necesitas insertar datos')
        } else if (clientsTenant1 > 0) {
            console.log('✅ Los clients existen y deberían aparecer en el frontend')
            console.log('💡 PROBLEMA: Debe estar en el frontend o en la API')
        }

        console.log('')
        console.log('🚀 PRÓXIMOS PASOS:')
        console.log('1. Verificar qué tenant_id tienen los clients reales')
        console.log('2. Actualizar el frontend para usar el tenant_id correcto')
        console.log('3. O actualizar los clients para usar tenant_id = 1')

    } catch (error) {
        console.error('❌ Error en debug:', error.message)
    }
}

// Ejecutar el debug
debugClientsAPI()




