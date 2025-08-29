// Script simple para probar la API de expenses
import fetch from 'node-fetch'

async function testExpensesAPI() {
    try {
        console.log('🧪 PROBANDO API DE EXPENSES')
        console.log('============================')
        console.log('')

        // Probar la API directamente
        console.log('🔍 Haciendo petición a /api/expenses...')

        const response = await fetch('http://localhost:5000/api/expenses', {
            headers: {
                'x-tenant-id': '1'
            }
        })

        console.log('📡 Status:', response.status)
        console.log('📡 Headers:', Object.fromEntries(response.headers.entries()))

        if (response.ok) {
            const data = await response.json()
            console.log('✅ API funciona! Datos recibidos:', data.length, 'expenses')

            if (data.length > 0) {
                console.log('📋 Primeros expenses:')
                data.slice(0, 3).forEach((expense, index) => {
                    console.log(`   ${index + 1}. ${expense.vendor} - €${expense.amount}`)
                })
            }
        } else {
            const errorText = await response.text()
            console.error('❌ API Error:', response.status, errorText)
        }

    } catch (error) {
        console.error('❌ Error en test:', error.message)
        console.log('💡 Asegúrate de que el servidor Next.js esté corriendo en puerto 5000')
    }
}

// Ejecutar test
testExpensesAPI()
