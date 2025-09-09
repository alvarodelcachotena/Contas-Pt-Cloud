// Script para probar la detección de MIME types
const { DocumentAIService } = require('../lib/gemini-ai-service.js')

console.log('🧪 === PRUEBA DE DETECCIÓN DE MIME TYPES ===')

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

    console.log('')
    console.log('📄 Probando con diferentes MIME types:')

    // Probar con MIME type de PDF
    console.log('1. Probando con MIME type: application/pdf')
    aiService.analyzeDocument(testBuffer, 'teste_fatura.pdf', 'application/pdf')
        .then(result => {
            console.log('✅ Análisis con PDF MIME type exitoso!')
            console.log(`   Tipo: ${result.document_type}`)
            console.log(`   Confianza: ${result.confidence}`)
        })
        .catch(error => {
            console.error('❌ Error con PDF MIME type:', error.message)
        })

    // Probar con MIME type de imagen
    console.log('2. Probando con MIME type: image/jpeg')
    aiService.analyzeDocument(testBuffer, 'teste_fatura.jpg', 'image/jpeg')
        .then(result => {
            console.log('✅ Análisis con JPEG MIME type exitoso!')
            console.log(`   Tipo: ${result.document_type}`)
            console.log(`   Confianza: ${result.confidence}`)
        })
        .catch(error => {
            console.error('❌ Error con JPEG MIME type:', error.message)
        })

} catch (error) {
    console.error('❌ Error creando DocumentAIService:', error.message)
}
