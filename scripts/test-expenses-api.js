// Script simple para probar la API de expenses
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

async function testExpensesAPI() {
    try {
        console.log('🧪 PROBANDO API DE EXPENSES DIRECTAMENTE')
        console.log('========================================')
        console.log('')

        console.log('🔍 Variables de entorno:')
        console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurado' : '❌ No configurado')
        console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ No configurado')
        console.log('')

        // Probar conexión directa a Supabase
        console.log('🔍 Probando conexión directa a Supabase...')

        const { data: expenses, error } = await supabase
            .from('expenses')
            .select('id, vendor, amount, category')
            .eq('tenant_id', 1)
            .limit(5)

        if (error) {
            console.error('❌ Error en Supabase:', error)
            return
        }

        console.log(`✅ Conexión exitosa! Encontrados ${expenses?.length || 0} expenses`)

        if (expenses && expenses.length > 0) {
            console.log('📋 Primeros expenses:')
            expenses.forEach((expense, index) => {
                console.log(`   ${index + 1}. ${expense.vendor} - €${expense.amount} (${expense.category})`)
            })
        }

        console.log('')
        console.log('🎯 CONCLUSIÓN:')
        console.log('   - Supabase funciona correctamente')
        console.log('   - Los datos están disponibles')
        console.log('   - El problema debe estar en la API de Next.js')

    } catch (error) {
        console.error('❌ Error en test:', error.message)
    }
}

// Ejecutar test
testExpensesAPI()





