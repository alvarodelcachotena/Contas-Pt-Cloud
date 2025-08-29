import 'dotenv/config'

console.log('🧪 Testando Busca de Cliente por Nome...\n')

// Mensaje simple para buscar cliente
const testMessage = 'cliente pepo'

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

        if (data.clientFound) {
            console.log('\n🎉 CLIENTE ENCONTRADO!')
            console.log('========================')
            console.log(`   Nome: ${data.clientFound.name}`)
            console.log(`   Email: ${data.clientFound.email}`)
            console.log(`   NIF: ${data.clientFound.nif}`)
            console.log(`   Telefone: ${data.clientFound.phone || 'N/A'}`)
            console.log(`   Endereço: ${data.clientFound.address || 'N/A'}`)
            console.log(`   Faturas: ${data.clientFound.invoices?.length || 0}`)
            console.log(`   Mensagem: ${data.clientFound.message}`)
        } else {
            console.log('\n❌ Cliente NÃO foi encontrado')
        }

    } else {
        const errorText = await response.text()
        console.log(`\n❌ Erro: ${errorText}`)
    }

} catch (error) {
    console.log(`\n❌ Erro: ${error.message}`)
}

console.log('\n🚀 Teste concluído!')
