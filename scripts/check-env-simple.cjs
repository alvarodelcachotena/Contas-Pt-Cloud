// Script simple para verificar variables de entorno
require('dotenv').config()

console.log('🧪 === VERIFICACIÓN SIMPLE DE VARIABLES DE ENTORNO ===')

console.log('📋 Variables disponibles:')
console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`)
console.log(`   GOOGLE_AI_API_KEY: ${process.env.GOOGLE_AI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`)
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`)

if (process.env.GEMINI_API_KEY) {
    console.log(`   Longitud GEMINI: ${process.env.GEMINI_API_KEY.length} caracteres`)
    console.log(`   Empieza con: ${process.env.GEMINI_API_KEY.substring(0, 10)}...`)
}

if (process.env.GOOGLE_AI_API_KEY) {
    console.log(`   Longitud GOOGLE: ${process.env.GOOGLE_AI_API_KEY.length} caracteres`)
    console.log(`   Empieza con: ${process.env.GOOGLE_AI_API_KEY.substring(0, 10)}...`)
}

console.log('')
console.log('🔍 Verificando archivos .env:')

const fs = require('fs')
const path = require('path')

// Verificar archivos .env
const envFiles = ['.env', '.env.local', '.env.build']
envFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file)
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file} existe`)
        const content = fs.readFileSync(filePath, 'utf8')
        if (content.includes('GEMINI_API_KEY')) {
            console.log(`      ✅ Contiene GEMINI_API_KEY`)
        } else {
            console.log(`      ❌ NO contiene GEMINI_API_KEY`)
        }
    } else {
        console.log(`   ❌ ${file} no existe`)
    }
})

console.log('')
if (process.env.GEMINI_API_KEY) {
    console.log('🎉 ¡GEMINI_API_KEY está disponible!')
    console.log('📱 El procesamiento de PDFs debería funcionar ahora')
} else {
    console.log('❌ GEMINI_API_KEY no está disponible')
    console.log('🔧 Verifica que esté en tu archivo .env')
}
