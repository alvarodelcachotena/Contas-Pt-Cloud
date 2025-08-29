// Script para verificar el esquema real de la tabla clients
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

async function checkClientsSchema() {
    try {
        console.log('🔍 VERIFICANDO ESQUEMA DE LA TABLA CLIENTS')
        console.log('🔗 URL:', process.env.SUPABASE_URL)
        console.log('')

        // 1. VERIFICAR SI LA TABLA EXISTE
        console.log('1️⃣ VERIFICANDO EXISTENCIA DE LA TABLA...')

        const { data: tableInfo, error: tableError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_name', 'clients')
            .eq('table_schema', 'public')

        if (tableError) {
            console.error('❌ Error al consultar esquema:', tableError)
            return
        }

        if (!tableInfo || tableInfo.length === 0) {
            console.log('❌ La tabla clients no existe')
            return
        }

        console.log(`✅ Tabla clients encontrada con ${tableInfo.length} columnas:`)
        console.log('')

        // Mostrar todas las columnas
        tableInfo.forEach(col => {
            console.log(`   📋 ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'} ${col.column_default ? `[default: ${col.column_default}]` : ''}`)
        })

        console.log('')

        // 2. VERIFICAR DATOS EXISTENTES
        console.log('2️⃣ VERIFICANDO DATOS EXISTENTES...')

        const { count: clientsCount, data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })

        if (clientsError) {
            console.error('❌ Error al consultar clients:', clientsError)
        } else {
            console.log(`📊 Total de clients: ${clientsCount || 0}`)

            if (clientsData && clientsData.length > 0) {
                console.log('📋 Primer client encontrado:')
                const firstClient = clientsData[0]
                Object.keys(firstClient).forEach(key => {
                    console.log(`   ${key}: ${firstClient[key]} (tipo: ${typeof firstClient[key]})`)
                })
            }
        }

        console.log('')

        // 3. VERIFICAR ESQUEMA ESPERADO vs REAL
        console.log('3️⃣ COMPARANDO ESQUEMA ESPERADO vs REAL...')

        const expectedColumns = [
            'id', 'tenant_id', 'name', 'email', 'phone', 'address',
            'tax_id', 'postal_code', 'city', 'is_active', 'created_at'
        ]

        const actualColumns = tableInfo.map(col => col.column_name)

        console.log('📋 Columnas esperadas:', expectedColumns.join(', '))
        console.log('📋 Columnas reales:', actualColumns.join(', '))
        console.log('')

        const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col))
        const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col))

        if (missingColumns.length > 0) {
            console.log('❌ Columnas faltantes:', missingColumns.join(', '))
        }

        if (extraColumns.length > 0) {
            console.log('⚠️  Columnas extra:', extraColumns.join(', '))
        }

        if (missingColumns.length === 0 && extraColumns.length === 0) {
            console.log('✅ El esquema coincide exactamente')
        }

        console.log('')
        console.log('🚀 PRÓXIMOS PASOS:')
        if (missingColumns.length > 0) {
            console.log('1. Agregar las columnas faltantes a la tabla clients')
            console.log('2. O actualizar el código para usar solo las columnas existentes')
        } else {
            console.log('1. El esquema está correcto, verificar el código del frontend')
        }

    } catch (error) {
        console.error('❌ Error general:', error.message)
    }
}

// Ejecutar la verificación
checkClientsSchema()

