// Script para probar las funcionalidades de expenses
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

async function testExpensesFeatures() {
    try {
        console.log('🧪 PROBANDO FUNCIONALIDADES DE EXPENSES')
        console.log('========================================')
        console.log('')

        // 1. VERIFICAR TOTAL DE EXPENSES
        console.log('1️⃣ VERIFICANDO TOTAL DE EXPENSES...')

        const { count: totalExpenses, error: countError } = await supabase
            .from('expenses')
            .select('*', { count: 'exact', head: true })

        if (countError) {
            console.error('❌ Error contando expenses:', countError)
        } else {
            console.log(`📊 Total de expenses en la base de datos: ${totalExpenses || 0}`)
        }
        console.log('')

        // 2. VERIFICAR EXPENSES CON TENANT_ID = 1
        console.log('2️⃣ VERIFICANDO EXPENSES CON TENANT_ID = 1...')

        const { data: expensesTenant1, error: tenantError } = await supabase
            .from('expenses')
            .select('*')
            .eq('tenant_id', 1)
            .order('created_at', { ascending: false })

        if (tenantError) {
            console.error('❌ Error obteniendo expenses tenant 1:', tenantError)
        } else {
            console.log(`📊 Expenses con tenant_id = 1: ${expensesTenant1?.length || 0}`)

            if (expensesTenant1 && expensesTenant1.length > 0) {
                console.log('📋 Últimos 3 expenses:')
                expensesTenant1.slice(0, 3).forEach((expense, index) => {
                    console.log(`   ${index + 1}. ID: ${expense.id}, Vendor: ${expense.vendor}`)
                    console.log(`      Amount: €${expense.amount}, VAT: €${expense.vat_amount || 0}`)
                    console.log(`      Category: ${expense.category}, Date: ${expense.expense_date}`)
                    console.log('')
                })
            }
        }
        console.log('')

        // 3. VERIFICAR ESTRUCTURA DE LA TABLA
        console.log('3️⃣ VERIFICANDO ESTRUCTURA DE LA TABLA...')

        const { data: structureData, error: structureError } = await supabase
            .from('expenses')
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

        // 4. PROBAR CREAR UN EXPENSE DE PRUEBA
        console.log('4️⃣ PROBANDO CREAR EXPENSE DE PRUEBA...')

        const testExpense = {
            tenant_id: 1,
            vendor: 'Fornecedor Teste',
            amount: 150.00,
            vat_amount: 34.50,
            vat_rate: 23,
            category: 'Material de Escritório',
            description: 'Despesa de teste para verificar funcionalidade',
            receipt_number: 'REC-TEST-001',
            expense_date: new Date().toISOString().split('T')[0],
            is_deductible: true
        }

        const { data: newExpense, error: insertError } = await supabase
            .from('expenses')
            .insert(testExpense)
            .select()
            .single()

        if (insertError) {
            console.error('❌ Error creando expense de prueba:', insertError)
        } else {
            console.log('✅ Expense de prueba creado exitosamente:')
            console.log(`   ID: ${newExpense.id}`)
            console.log(`   Vendor: ${newExpense.vendor}`)
            console.log(`   Amount: €${newExpense.amount}`)
            console.log(`   Category: ${newExpense.category}`)

            // Limpiar expense de prueba
            const { error: deleteError } = await supabase
                .from('expenses')
                .delete()
                .eq('id', newExpense.id)

            if (deleteError) {
                console.log('⚠️  No se pudo eliminar expense de prueba:', deleteError.message)
            } else {
                console.log('✅ Expense de prueba eliminado correctamente')
            }
        }
        console.log('')

        // 5. RESUMEN Y ESTADO
        console.log('🎯 RESUMEN DEL ESTADO:')
        console.log('======================')

        if (totalExpenses > 0) {
            console.log('✅ La tabla expenses tiene datos')
            console.log(`📊 Total de expenses: ${totalExpenses}`)
            console.log(`📊 Expenses tenant 1: ${expensesTenant1?.length || 0}`)

            if (expensesTenant1 && expensesTenant1.length > 0) {
                console.log('✅ Los expenses se pueden obtener correctamente')
                console.log('✅ La API debería funcionar en el frontend')
            } else {
                console.log('⚠️  Los expenses existen pero no se pueden obtener con tenant_id = 1')
            }
        } else {
            console.log('❌ La tabla expenses está vacía')
        }

        console.log('')
        console.log('🚀 PRÓXIMOS PASOS:')
        console.log('1. Probar crear expense desde el frontend')
        console.log('2. Verificar que no hay alerts')
        console.log('3. Verificar que los errores se muestran en rojo en el modal')
        console.log('4. Verificar que los datos se recargan automáticamente')
        console.log('5. Probar exportación de expenses')

    } catch (error) {
        console.error('❌ Error en test:', error.message)
    }
}

// Ejecutar test
testExpensesFeatures()






