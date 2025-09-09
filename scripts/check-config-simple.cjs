// Script simple para verificar la configuración
console.log('🧪 === VERIFICACIÓN DE CONFIGURACIÓN ===')

// Verificar variables de entorno
console.log('📋 Variables de entorno:')
console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`)
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`)

if (process.env.GEMINI_API_KEY) {
    console.log(`   Longitud GEMINI: ${process.env.GEMINI_API_KEY.length} caracteres`)
    console.log(`   Empieza con: ${process.env.GEMINI_API_KEY.substring(0, 10)}...`)
}

if (process.env.OPENAI_API_KEY) {
    console.log(`   Longitud OPENAI: ${process.env.OPENAI_API_KEY.length} caracteres`)
    console.log(`   Empieza con: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`)
}

console.log('')
console.log('🔍 Verificando archivos:')

const fs = require('fs')
const path = require('path')

// Verificar si existe el archivo gemini-ai-service.ts
const geminiServicePath = path.join(__dirname, '..', 'lib', 'gemini-ai-service.ts')
if (fs.existsSync(geminiServicePath)) {
    console.log('✅ lib/gemini-ai-service.ts existe')

    // Leer las primeras líneas para verificar el contenido
    const content = fs.readFileSync(geminiServicePath, 'utf8')
    if (content.includes('GoogleGenerativeAI')) {
        console.log('✅ Usa GoogleGenerativeAI')
    } else {
        console.log('❌ NO usa GoogleGenerativeAI')
    }

    if (content.includes('OpenAI')) {
        console.log('⚠️ Aún contiene referencias a OpenAI')
    } else {
        console.log('✅ No contiene referencias a OpenAI')
    }
} else {
    console.log('❌ lib/gemini-ai-service.ts NO existe')
}

console.log('')
console.log('🎯 Recomendaciones:')
if (!process.env.GEMINI_API_KEY) {
    console.log('   1. Configura GEMINI_API_KEY en tu archivo .env')
}
if (process.env.OPENAI_API_KEY) {
    console.log('   2. Considera eliminar OPENAI_API_KEY para evitar conflictos')
}
console.log('   3. Reinicia el servidor después de los cambios')
