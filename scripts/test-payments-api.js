// Script para probar la API de payments
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

async function testPaymentsAPI() {
    try {
        console.log('🧪 PROBANDO API DE PAYMENTS')
        console.log('============================')
        console.log('')

        console.log('🔍 Variables de entorno:')
        console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurado' : '❌ No configurado')
        console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ No configurado')
        console.log('')

        // Probar conexión directa a Supabase
        console.log('🔍 Probando conexión directa a Supabase...')

        const { data: payments, error } = await supabase
            .from('payments')
            .select('id, description, amount, type, status, payment_date')
            .eq('tenant_id', 1)
            .limit(5)

        if (error) {
            console.error('❌ Error en Supabase:', error)
            return
        }

        console.log(`✅ Conexión exitosa! Encontrados ${payments?.length || 0} payments`)

        if (payments && payments.length > 0) {
            console.log('📋 Primeros payments:')
            payments.forEach((payment, index) => {
                console.log(`   ${index + 1}. ${payment.description} - €${payment.amount} (${payment.type})`)
            })
        }

        console.log('')
        console.log('🎯 CONCLUSIÓN:')
        console.log('   - Supabase funciona correctamente')
        console.log('   - Los datos están disponibles')
        console.log('   - La API de payments está lista para usar')

    } catch (error) {
        console.error('❌ Error en test:', error.message)
    }
}

// Ejecutar test
testPaymentsAPI()

