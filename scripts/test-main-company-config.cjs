// Script para probar la configuración de empresa principal
const { MAIN_COMPANY_CONFIG, isMainCompany } = require('../lib/main-company-config.js')

console.log('🧪 === PRUEBA DE CONFIGURACIÓN DE EMPRESA PRINCIPAL ===')

console.log('📋 Configuración de empresa principal:')
console.log(`   Nombre: ${MAIN_COMPANY_CONFIG.name}`)
console.log(`   NIF: ${MAIN_COMPANY_CONFIG.nif}`)

console.log('')
console.log('🔍 Probando detección de empresa principal:')

// Casos de prueba
const testCases = [
    { name: 'DIAMOND NXT TRADING LDA', nif: '517124548', expected: true },
    { name: 'DIAMOND NXT TRADING', nif: '517124548', expected: true },
    { name: 'Restaurante Teste', nif: '123456789', expected: false },
    { name: 'DIAMOND NXT TRADING LDA', nif: '999999999', expected: true },
    { name: 'Cualquier Empresa', nif: '517124548', expected: true },
    { name: 'DIAMOND NXT TRADING, LDA', nif: '517 124 548', expected: true },
    { name: 'DIAMOND NXT', nif: '517.124.548', expected: true }
]

testCases.forEach((testCase, index) => {
    const result = isMainCompany(testCase.name, testCase.nif)
    const status = result === testCase.expected ? '✅' : '❌'

    console.log(`   ${index + 1}. ${status} Nombre: "${testCase.name}", NIF: "${testCase.nif}" → ${result ? 'Empresa principal' : 'Otra empresa'}`)
})

console.log('')
console.log('📱 INSTRUCCIONES PARA EL SISTEMA:')
console.log('   1. Cuando proceses facturas con DOS nombres/NIFs')
console.log('   2. Identifica DIAMOND NXT TRADING LDA como empresa principal')
console.log('   3. SIEMPRE extrae los datos del OTRO proveedor/cliente')
console.log('   4. NO extraigas datos de DIAMOND NXT TRADING LDA')
console.log('')
console.log('🎯 El sistema ahora reconocerá automáticamente tu empresa')
console.log('   y extraerá los datos del proveedor/cliente correcto')
