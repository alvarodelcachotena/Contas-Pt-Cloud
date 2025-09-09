// Script para probar el DocumentAIService específicamente
const { DocumentAIService } = require('../lib/gemini-ai-service.js')

console.log('🧪 === PRUEBA DEL DOCUMENTAISERVICE ===')

// Simular las variables de entorno
process.env.GEMINI_API_KEY = 'AIzaSyD5BJy-QZhK2tueyugMwfiTlGssyyAEzts'

try {
    console.log('🔧 Creando instancia de DocumentAIService...')
    const aiService = new DocumentAIService()

    console.log('✅ DocumentAIService creado exitosamente')

    // Crear un buffer de prueba (simulando un PDF)
    const testContent = `
    FATURA
    
    Empresa: Restaurante Teste
    NIF: 123456789
    Data: 2024-01-15
    Número: FAT-001
    
    Descrição: Almoço de negócios
    Subtotal: 25.00
    IVA (23%): 5.75
    Total: 30.75
    `

    const testBuffer = Buffer.from(testContent, 'utf-8')

    console.log('🤖 Probando analyzeDocument...')

    aiService.analyzeDocument(testBuffer, 'teste_fatura.pdf')
        .then(result => {
            console.log('✅ Análisis exitoso!')
            console.log(`   Tipo: ${result.document_type}`)
            console.log(`   Confianza: ${result.confidence}`)
            console.log(`   Datos:`, JSON.stringify(result.extracted_data, null, 2))
        })
        .catch(error => {
            console.error('❌ Error en analyzeDocument:', error.message)
            console.error('Stack:', error.stack)
        })

} catch (error) {
    console.error('❌ Error creando DocumentAIService:', error.message)
    console.error('Stack:', error.stack)
}
