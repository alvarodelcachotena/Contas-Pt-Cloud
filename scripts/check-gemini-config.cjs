// Script para verificar la configuración de Gemini AI
require('dotenv').config()

function testGeminiConfig() {
    try {
        console.log('🧪 === VERIFICACIÓN DE CONFIGURACIÓN GEMINI AI ===')

        // Verificar que la API key esté configurada
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY no está configurada')
            console.log('📝 Para configurar Gemini AI:')
            console.log('   1. Ve a https://makersuite.google.com/app/apikey')
            console.log('   2. Crea una nueva API key')
            console.log('   3. Añade GEMINI_API_KEY=tu_api_key a tu archivo .env')
            console.log('')
            console.log('🔧 Ejemplo de configuración en .env:')
            console.log('   GEMINI_API_KEY=AIzaSyC...tu_api_key_aqui')
            return false
        }

        console.log('✅ GEMINI_API_KEY configurada correctamente')
        console.log(`   Longitud: ${apiKey.length} caracteres`)
        console.log(`   Empieza con: ${apiKey.substring(0, 10)}...`)
        console.log(`   Termina con: ...${apiKey.substring(apiKey.length - 10)}`)

        // Verificar formato de la API key
        if (apiKey.startsWith('AIza')) {
            console.log('✅ Formato de API key correcto (empieza con AIza)')
        } else {
            console.log('⚠️ Formato de API key inusual (debería empezar con AIza)')
        }

        console.log('')
        console.log('🎉 ¡Configuración verificada exitosamente!')
        console.log('📱 Ahora puedes enviar PDFs por WhatsApp y serán procesados con Gemini AI')

        return true

    } catch (error) {
        console.error('❌ Error verificando configuración:', error)
        return false
    }
}

// Ejecutar la verificación
const isConfigured = testGeminiConfig()

if (isConfigured) {
    console.log('')
    console.log('🚀 Siguiente paso: Envía un PDF por WhatsApp para probar el procesamiento')
} else {
    console.log('')
    console.log('🔧 Configura GEMINI_API_KEY y vuelve a ejecutar este script')
}
