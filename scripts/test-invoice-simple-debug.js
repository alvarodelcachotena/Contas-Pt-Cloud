import 'dotenv/config'

console.log('🧪 Testando Criação de Faturas - Debug Simples...\n')

// Mensaje muy simple y directo
const testMessage = 'factura cliente pepo valor 1230'

console.log('📤 Enviando mensagem de teste...')
console.log(`   Mensagem: "${testMessage}"`)

try {
    const response = await fetch('http://localhost:5000/api/ai-chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: testMessage })
    })

    console.log(`\n📥 Status: ${response.status}`)

    if (response.ok) {
        const data = await response.json()

        console.log('\n📊 Resposta completa:')
        console.log(JSON.stringify(data, null, 2))

        if (data.invoiceCreated) {
            console.log('\n🎉 FATURA CRIADA!')
        } else {
            console.log('\n❌ Fatura NÃO foi criada')
        }

    } else {
        const errorText = await response.text()
        console.log(`\n❌ Erro: ${errorText}`)
    }

} catch (error) {
    console.log(`\n❌ Erro: ${error.message}`)
}

console.log('\n🚀 Teste concluído!')
