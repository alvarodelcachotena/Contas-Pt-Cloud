// Script para probar el procesamiento de PDFs con Gemini AI
import { DocumentAIService } from '../lib/gemini-ai-service.js'
import { loadEnvStrict } from '../lib/env-loader.js'

// Cargar variables de entorno
loadEnvStrict()

async function testPdfProcessing() {
    try {
        console.log('🧪 === PRUEBA DE PROCESAMIENTO DE PDFs CON GEMINI AI ===')

        // Verificar que la API key esté configurada
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY no está configurada')
            console.log('📝 Para configurar Gemini AI:')
            console.log('   1. Ve a https://makersuite.google.com/app/apikey')
            console.log('   2. Crea una nueva API key')
            console.log('   3. Añade GEMINI_API_KEY=tu_api_key a tu archivo .env')
            return
        }

        console.log('✅ GEMINI_API_KEY configurada correctamente')
        console.log(`   Longitud: ${apiKey.length} caracteres`)
        console.log(`   Empieza con: ${apiKey.substring(0, 10)}...`)

        // Crear instancia del servicio
        const aiService = new DocumentAIService()
        console.log('✅ DocumentAIService inicializado correctamente')

        // Crear un PDF de prueba simple (simulando un buffer)
        console.log('📄 Creando documento de prueba...')

        // Simular un PDF simple con datos de factura
        const testPdfContent = `
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

        const testBuffer = Buffer.from(testPdfContent, 'utf-8')

        console.log('🤖 Enviando documento a Gemini AI...')

        // Procesar el documento
        const result = await aiService.analyzeDocument(testBuffer, 'teste_fatura.pdf')

        console.log('✅ Documento procesado exitosamente!')
        console.log('📊 Resultado del análisis:')
        console.log(`   Tipo: ${result.document_type}`)
        console.log(`   Confianza: ${(result.confidence * 100).toFixed(1)}%`)
        console.log(`   Datos extraídos:`, JSON.stringify(result.extracted_data, null, 2))
        console.log(`   Notas:`, result.processing_notes)

        console.log('🎉 ¡Prueba completada exitosamente!')

    } catch (error) {
        console.error('❌ Error en la prueba:', error)
        if (error instanceof Error) {
            console.error('Mensaje:', error.message)
            console.error('Stack:', error.stack)
        }
    }
}

// Ejecutar la prueba
testPdfProcessing()