// Script para verificar la API key de OpenAI en Netlify
import OpenAI from 'openai'

export async function GET() {
    console.log('🔍 VERIFICANDO API KEY DE OPENAI EN NETLIFY')
    console.log('==========================================')

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        return Response.json({
            error: 'OPENAI_API_KEY no está configurada',
            success: false
        }, { status: 500 })
    }

    console.log('📋 Información de la API key:')
    console.log(`   Longitud: ${apiKey.length} caracteres`)
    console.log(`   Empieza con: ${apiKey.substring(0, 10)}...`)
    console.log(`   Termina con: ...${apiKey.substring(apiKey.length - 10)}`)
    console.log(`   Formato correcto: ${apiKey.startsWith('sk-') ? '✅' : '❌'}`)

    try {
        const openai = new OpenAI({ apiKey })

        console.log('🔄 Probando conexión con OpenAI...')

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "user", content: "Responde solo 'Teste funcionando' em português" }
            ],
            max_tokens: 50,
            temperature: 0.7,
        })

        const response = completion.choices[0]?.message?.content

        console.log('✅ OpenAI funcionando!')
        console.log(`   Resposta: ${response}`)

        return Response.json({
            success: true,
            message: 'API key funcionando correctamente',
            response: response,
            keyInfo: {
                length: apiKey.length,
                startsWith: apiKey.substring(0, 10),
                endsWith: apiKey.substring(apiKey.length - 10),
                formatCorrect: apiKey.startsWith('sk-')
            }
        })

    } catch (error) {
        console.error('❌ Error con OpenAI:', error)

        return Response.json({
            success: false,
            error: error.message,
            errorCode: error.code,
            keyInfo: {
                length: apiKey.length,
                startsWith: apiKey.substring(0, 10),
                endsWith: apiKey.substring(apiKey.length - 10),
                formatCorrect: apiKey.startsWith('sk-')
            }
        }, { status: 500 })
    }
}
