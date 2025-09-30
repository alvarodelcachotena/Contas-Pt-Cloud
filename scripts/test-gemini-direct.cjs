// Script de prueba directa para verificar Gemini AI
const { GoogleGenerativeAI } = require('@google/generative-ai')

console.log('🧪 === PRUEBA DIRECTA DE GEMINI AI ===')

// API key directamente
const apiKey = 'AIzaSyD5BJy-QZhK2tueyugMwfiTlGssyyAEzts'

console.log(`API Key: ${apiKey.substring(0, 15)}...`)
console.log(`Longitud: ${apiKey.length} caracteres`)

try {
    // Inicializar Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    console.log('✅ Gemini AI inicializado correctamente')

    // Probar con un texto simple
    const testPrompt = "Responde solo con 'OK' si puedes procesar este mensaje"

    model.generateContent(testPrompt)
        .then(result => {
            const response = result.response
            const text = response.text()
            console.log('✅ Respuesta de Gemini:', text)
            console.log('🎉 ¡Gemini AI está funcionando correctamente!')
            console.log('')
            console.log('📱 Ahora puedes enviar PDFs por WhatsApp')
            console.log('🤖 Serán procesados automáticamente con Gemini AI')
        })
        .catch(error => {
            console.error('❌ Error en la prueba:', error.message)
        })

} catch (error) {
    console.error('❌ Error inicializando Gemini:', error.message)
}
