#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTableStructure() {
    try {
        console.log('🔍 Verificando estructura de tablas...\n')

        // Check expenses table structure
        console.log('💸 Estructura de tabla expenses:')
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('*')
            .limit(1)

        if (expensesError) {
            console.error('❌ Error fetching expenses:', expensesError)
        } else if (expenses && expenses.length > 0) {
            console.log('✅ Columnas disponibles en expenses:')
            Object.keys(expenses[0]).forEach(column => {
                console.log(`   - ${column}`)
            })
        } else {
            console.log('⚠️ No hay datos en expenses para verificar estructura')
        }

        console.log('\n')

        // Check invoices table structure
        console.log('📄 Estructura de tabla invoices:')
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('*')
            .limit(1)

        if (invoicesError) {
            console.error('❌ Error fetching invoices:', invoicesError)
        } else if (invoices && invoices.length > 0) {
            console.log('✅ Columnas disponibles en invoices:')
            Object.keys(invoices[0]).forEach(column => {
                console.log(`   - ${column}`)
            })
        } else {
            console.log('⚠️ No hay datos en invoices para verificar estructura')
        }

    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

checkTableStructure()
