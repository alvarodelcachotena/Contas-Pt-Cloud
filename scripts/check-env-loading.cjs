// Script para verificar la carga de variables de entorno
const { loadEnvStrict, getGeminiKey, getGoogleAIKey, getOpenAIKey } = require('../lib/env-loader.js')

console.log('🧪 === VERIFICACIÓN DE CARGA DE VARIABLES DE ENTORNO ===')

console.log('🔧 Cargando variables de entorno...')
loadEnvStrict()

console.log('')
console.log('📋 Variables cargadas:')

// Verificar GEMINI_API_KEY
const geminiKey = getGeminiKey()
console.log(`   GEMINI_API_KEY: ${geminiKey ? '✅ Configurada' : '❌ No configurada'}`)
if (geminiKey) {
    console.log(`      Longitud: ${geminiKey.length} caracteres`)
    console.log(`      Empieza con: ${geminiKey.substring(0, 10)}...`)
}

// Verificar GOOGLE_AI_API_KEY
const googleKey = getGoogleAIKey()
console.log(`   GOOGLE_AI_API_KEY: ${googleKey ? '✅ Configurada' : '❌ No configurada'}`)
if (googleKey) {
    console.log(`      Longitud: ${googleKey.length} caracteres`)
    console.log(`      Empieza con: ${googleKey.substring(0, 10)}...`)
}

// Verificar OPENAI_API_KEY
const openaiKey = getOpenAIKey()
console.log(`   OPENAI_API_KEY: ${openaiKey ? '✅ Configurada' : '❌ No configurada'}`)
if (openaiKey) {
    console.log(`      Longitud: ${openaiKey.length} caracteres`)
    console.log(`      Empieza con: ${openaiKey.substring(0, 10)}...`)
}

console.log('')
console.log('🔍 Variables directas de process.env:')
console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Disponible' : '❌ No disponible'}`)
console.log(`   GOOGLE_AI_API_KEY: ${process.env.GOOGLE_AI_API_KEY ? '✅ Disponible' : '❌ No disponible'}`)
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Disponible' : '❌ No disponible'}`)

console.log('')
if (geminiKey) {
    console.log('🎉 ¡GEMINI_API_KEY está disponible!')
    console.log('📱 El procesamiento de PDFs debería funcionar ahora')
} else {
    console.log('❌ GEMINI_API_KEY no está disponible')
    console.log('🔧 Verifica que esté en tu archivo .env')
}
