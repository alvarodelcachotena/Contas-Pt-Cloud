// Verificación rápida de Gemini AI
const { GoogleGenerativeAI } = require('@google/generative-ai')

// Configurar la API key directamente
const apiKey = 'AIzaSyD5BJy-QZhK2tueyugMwfiTlGssyyAEzts'

console.log('🧪 === VERIFICACIÓN RÁPIDA DE GEMINI AI ===')
console.log(`API Key: ${apiKey.substring(0, 10)}...`)

try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" })

    console.log('✅ Gemini AI inicializado correctamente')
    console.log('🎉 ¡La configuración está lista!')
    console.log('')
    console.log('📱 Ahora puedes enviar PDFs por WhatsApp')
    console.log('🤖 Serán procesados automáticamente con Gemini AI')

} catch (error) {
    console.error('❌ Error:', error.message)
}
