import 'dotenv/config'

console.log('🧪 Testando Criação de Faturas pela IA...\n')

const testMessage = 'creale una factura al cliente pepo, valor base 1230, tax de 23%'

console.log('📤 Enviando mensagem de teste...')
console.log(`   Mensagem: "${testMessage}"`)
console.log(`   URL: http://localhost:5000/api/ai-chat\n`)

try {
    const response = await fetch('http://localhost:5000/api/ai-chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: testMessage })
    })

    console.log('📥 Resposta recebida:')
    console.log(`   Status: ${response.status}`)
    console.log(`   Status Text: ${response.statusText}\n`)

    if (response.ok) {
        const data = await response.json()

        console.log('📊 Dados da resposta:')
        console.log('=====================')
        console.log(`✅ Sucesso!`)
        console.log(`   Modelo usado: ${data.model || 'N/A'}`)
        console.log(`   Fallback usado: ${data.fallbackUsed}`)

        if (data.invoiceCreated) {
            console.log('\n🎉 FATURA CRIADA AUTOMATICAMENTE!')
            console.log('=====================================')
            console.log(`   Cliente: ${data.invoiceCreated.clientName}`)
            console.log(`   Número da Fatura: ${data.invoiceCreated.invoiceNumber}`)
            console.log(`   Valor Total: €${data.invoiceCreated.totalValue}`)
            console.log(`   Mensagem: ${data.invoiceCreated.message}`)
        } else {
            console.log('\n❌ Fatura NÃO foi criada automaticamente')
        }

        if (data.response) {
            console.log('\n🤖 Resposta da IA:')
            console.log('==================')
            console.log(data.response)
        }

    } else {
        console.log('❌ Erro na resposta:')
        console.log(`   Status: ${response.status}`)
        const errorText = await response.text()
        console.log(`   Erro: ${errorText}`)
    }

} catch (error) {
    console.log('❌ Erro ao fazer requisição:')
    console.log(`   ${error.message}`)
}

console.log('\n🚀 Teste concluído!')
