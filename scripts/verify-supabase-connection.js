// Script para verificar la conexión a Supabase
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

console.log('🔍 VERIFICANDO CONEXIÓN A SUPABASE')
console.log('=====================================')
console.log('')

// Mostrar las variables de entorno (sin mostrar las keys completas)
console.log('📋 VARIABLES DE ENTORNO:')
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Configurada' : '❌ No configurada'}`)
console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada'}`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ No configurada'}`)

if (process.env.SUPABASE_URL) {
    console.log(`   URL completa: ${process.env.SUPABASE_URL}`)
}

if (process.env.SUPABASE_ANON_KEY) {
    const key = process.env.SUPABASE_ANON_KEY
    console.log(`   ANON_KEY (primeros 10 chars): ${key.substring(0, 10)}...`)
}

console.log('')

// Crear cliente Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

async function verifyConnection() {
    try {
        console.log('🔗 PROBANDO CONEXIÓN...')

        // 1. Probar conexión básica
        const { data: testData, error: testError } = await supabase
            .from('clients')
            .select('*')
            .limit(1)

        if (testError) {
            console.error('❌ Error de conexión:', testError)
            console.log('')
            console.log('🔍 ANALIZANDO EL ERROR:')

            if (testError.code === 'PGRST116') {
                console.log('   💡 Error PGRST116: No se puede acceder a la tabla')
                console.log('   🔧 Posibles causas:')
                console.log('      - RLS (Row Level Security) está habilitado')
                console.log('      - No tienes permisos para acceder a la tabla')
                console.log('      - La tabla no existe')
            } else if (testError.code === 'PGRST301') {
                console.log('   💡 Error PGRST301: Error de autenticación')
                console.log('   🔧 Posibles causas:')
                console.log('      - ANON_KEY inválida')
                console.log('      - URL incorrecta')
            }

            return
        }

        console.log('✅ Conexión básica exitosa')
        console.log('')

        // 2. Verificar estructura de la tabla
        console.log('📋 VERIFICANDO ESTRUCTURA DE LA TABLA...')

        const { data: structureData, error: structureError } = await supabase
            .from('clients')
            .select('*')
            .limit(0) // Solo obtener estructura, no datos

        if (structureError) {
            console.error('❌ Error obteniendo estructura:', structureError)
        } else {
            console.log('✅ Estructura de tabla accesible')
        }

        // 3. Probar con count
        console.log('')
        console.log('🔢 PROBANDO COUNT...')

        const { count, error: countError } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })

        if (countError) {
            console.error('❌ Error en count:', countError)
        } else {
            console.log(`📊 Count devuelto: ${count}`)
        }

        // 4. Probar sin filtros
        console.log('')
        console.log('📋 PROBANDO SIN FILTROS...')

        const { data: allData, error: allError } = await supabase
            .from('clients')
            .select('*')
            .limit(5)

        if (allError) {
            console.error('❌ Error obteniendo datos sin filtros:', allError)
        } else {
            console.log(`📊 Datos obtenidos sin filtros: ${allData?.length || 0}`)

            if (allData && allData.length > 0) {
                console.log('📋 Primer client:')
                const first = allData[0]
                Object.keys(first).forEach(key => {
                    console.log(`   ${key}: ${first[key]}`)
                })
            }
        }

        // 5. Probar con tenant_id específico
        console.log('')
        console.log('🏢 PROBANDO CON TENANT_ID = 1...')

        const { data: tenantData, error: tenantError } = await supabase
            .from('clients')
            .select('*')
            .eq('tenant_id', 1)
            .limit(5)

        if (tenantError) {
            console.error('❌ Error con tenant_id = 1:', tenantError)
        } else {
            console.log(`📊 Clients con tenant_id = 1: ${tenantData?.length || 0}`)
        }

        // 6. Probar con tenant_id = null
        console.log('')
        console.log('🏢 PROBANDO CON TENANT_ID = NULL...')

        const { data: nullTenantData, error: nullTenantError } = await supabase
            .from('clients')
            .select('*')
            .is('tenant_id', null)
            .limit(5)

        if (nullTenantError) {
            console.error('❌ Error con tenant_id = NULL:', nullTenantError)
        } else {
            console.log(`📊 Clients con tenant_id = NULL: ${nullTenantData?.length || 0}`)
        }

        // 7. Probar sin tenant_id filter
        console.log('')
        console.log('🏢 PROBANDO SIN FILTRO DE TENANT_ID...')

        const { data: noFilterData, error: noFilterError } = await supabase
            .from('clients')
            .select('tenant_id')
            .limit(10)

        if (noFilterError) {
            console.error('❌ Error sin filtro tenant_id:', noFilterError)
        } else {
            console.log(`📊 Total de registros: ${noFilterData?.length || 0}`)

            if (noFilterData && noFilterData.length > 0) {
                const tenantIds = [...new Set(noFilterData.map(c => c.tenant_id))]
                console.log(`🔍 Tenant IDs encontrados: ${tenantIds.join(', ')}`)

                tenantIds.forEach(id => {
                    const count = noFilterData.filter(c => c.tenant_id === id).length
                    console.log(`   Tenant ${id}: ${count} clients`)
                })
            }
        }

    } catch (error) {
        console.error('❌ Error general:', error.message)
        console.error('Stack:', error.stack)
    }
}

// Ejecutar verificación
verifyConnection()

