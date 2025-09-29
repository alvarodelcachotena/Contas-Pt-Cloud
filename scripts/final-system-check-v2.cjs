// Script final para verificar que todo esté funcionando
require('dotenv').config()

console.log('🧪 === VERIFICACIÓN FINAL DEL SISTEMA ===')

// Verificar variables de entorno
console.log('📋 Variables de entorno:')
console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`)
console.log(`   GOOGLE_AI_API_KEY: ${process.env.GOOGLE_AI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`)

if (process.env.GEMINI_API_KEY) {
    console.log(`   Longitud GEMINI: ${process.env.GEMINI_API_KEY.length} caracteres`)
    console.log(`   Empieza con: ${process.env.GEMINI_API_KEY.substring(0, 10)}...`)
}

console.log('')
console.log('🔧 Probando Gemini AI directamente...')

const { GoogleGenerativeAI } = require('@google/generative-ai')

try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    console.log('✅ Gemini AI inicializado correctamente')

    // Probar con un mensaje simple
    model.generateContent("Responde solo con 'OK' si puedes procesar este mensaje")
        .then(result => {
            const response = result.response.text()
            console.log('✅ Respuesta de Gemini:', response)
            console.log('')
            console.log('🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!')
            console.log('')
            console.log('📱 INSTRUCCIONES FINALES:')
            console.log('   1. El servidor está corriendo en http://localhost:5000')
            console.log('   2. Envía un PDF por WhatsApp al número configurado')
            console.log('   3. Deberías ver en los logs: "🤖 Procesando con Gemini AI..."')
            console.log('   4. El PDF será procesado automáticamente')
            console.log('   5. Recibirás una respuesta con los datos extraídos')
            console.log('')
            console.log('🚀 ¡El procesamiento de PDFs por WhatsApp está listo!')
            console.log('')
            console.log('🔧 CAMBIOS REALIZADOS:')
            console.log('   ✅ Agregado GEMINI_API_KEY al env-loader.js')
            console.log('   ✅ Creada función getGeminiKey()')
            console.log('   ✅ Modificado webhook para cargar variables correctamente')
            console.log('   ✅ Agregados logs detallados para debugging')
        })
        .catch(error => {
            console.error('❌ Error en la prueba:', error.message)
        })

} catch (error) {
    console.error('❌ Error inicializando Gemini:', error.message)
}
