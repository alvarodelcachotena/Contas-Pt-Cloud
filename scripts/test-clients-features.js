// Script para probar las funcionalidades de clients
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

async function testClientsFeatures() {
    try {
        console.log('🧪 PROBANDO FUNCIONALIDADES DE CLIENTS')
        console.log('========================================')
        console.log('')

        // 1. VERIFICAR TOTAL DE CLIENTS
        console.log('1️⃣ VERIFICANDO TOTAL DE CLIENTS...')

        const { count: totalClients, error: countError } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })

        if (countError) {
            console.error('❌ Error contando clients:', countError)
        } else {
            console.log(`📊 Total de clients en la base de datos: ${totalClients || 0}`)
        }
        console.log('')

        // 2. VERIFICAR CLIENTS CON TENANT_ID = 1
        console.log('2️⃣ VERIFICANDO CLIENTS CON TENANT_ID = 1...')

        const { data: clientsTenant1, error: tenantError } = await supabase
            .from('clients')
            .select('*')
            .eq('tenant_id', 1)
            .order('created_at', { ascending: false })

        if (tenantError) {
            console.error('❌ Error obteniendo clients tenant 1:', tenantError)
        } else {
            console.log(`📊 Clients con tenant_id = 1: ${clientsTenant1?.length || 0}`)

            if (clientsTenant1 && clientsTenant1.length > 0) {
                console.log('📋 Últimos 3 clients:')
                clientsTenant1.slice(0, 3).forEach((client, index) => {
                    console.log(`   ${index + 1}. ID: ${client.id}, Name: ${client.name}`)
                    console.log(`      Email: ${client.email}, Phone: ${client.phone}`)
                    console.log(`      Tax ID: ${client.tax_id}, City: ${client.city}`)
                    console.log(`      Postal Code: ${client.postal_code}, Active: ${client.is_active}`)
                    console.log(`      Created At: ${client.created_at}`)
                    console.log('')
                })
            }
        }
        console.log('')

        // 3. VERIFICAR ESTRUCTURA DE LA TABLA
        console.log('3️⃣ VERIFICANDO ESTRUCTURA DE LA TABLA...')

        const { data: structureData, error: structureError } = await supabase
            .from('clients')
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

        // 4. RESUMEN Y ESTADO
        console.log('🎯 RESUMEN DEL ESTADO:')
        console.log('======================')

        if (totalClients > 0) {
            console.log('✅ La tabla clients tiene datos')
            console.log(`📊 Total de clients: ${totalClients}`)
            console.log(`📊 Clients tenant 1: ${clientsTenant1?.length || 0}`)

            if (clientsTenant1 && clientsTenant1.length > 0) {
                console.log('✅ Los clients se pueden obtener correctamente')
                console.log('✅ La API debería funcionar en el frontend')
            } else {
                console.log('⚠️  Los clients existen pero no se pueden obtener con tenant_id = 1')
            }
        } else {
            console.log('❌ La tabla clients está vacía')
        }

        console.log('')
        console.log('🚀 PRÓXIMOS PASOS:')
        console.log('1. Probar crear cliente desde el frontend')
        console.log('2. Verificar que no hay alerts')
        console.log('3. Verificar que los errores se muestran en rojo en el modal')
        console.log('4. Verificar que los datos se recargan automáticamente')

    } catch (error) {
        console.error('❌ Error en test:', error.message)
    }
}

// Ejecutar test
testClientsFeatures()





