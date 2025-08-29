import 'dotenv/config'

console.log('🧪 Testando Criação de Fatura - Versão Simples...\n')

const testMessage = 'creale una factura al cliente manuel, valor base 1230, tax de 23%'

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

        console.log('\n📊 Dados da resposta:')
        console.log('=====================')

        if (data.invoiceCreated) {
            console.log('\n🎉 FATURA CRIADA AUTOMATICAMENTE!')
            console.log('=====================================')
            console.log(`   Cliente: ${data.invoiceCreated.clientName}`)
            console.log(`   Número da Fatura: ${data.invoiceCreated.invoiceNumber}`)
            console.log(`   Valor Total: €${data.invoiceCreated.totalValue}`)
            console.log(`   Mensagem: ${data.invoiceCreated.message}`)
        } else {
            console.log('\n❌ Fatura NÃO foi criada automaticamente')
            console.log('   Resposta da IA:', data.response?.substring(0, 200) + '...')
        }

    } else {
        const errorText = await response.text()
        console.log(`\n❌ Erro: ${errorText}`)
    }

} catch (error) {
    console.log(`\n❌ Erro: ${error.message}`)
}

console.log('\n🚀 Teste concluído!')
