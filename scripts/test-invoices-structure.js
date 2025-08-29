import 'dotenv/config'

console.log('🧪 Testando Estrutura da Tabela Invoices...\n')

try {
    const response = await fetch('http://localhost:5000/api/invoices', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })

    console.log(`📥 Status: ${response.status}`)

    if (response.ok) {
        const data = await response.json()

        console.log('\n📊 Estrutura das Faturas:')
        console.log('=========================')
        console.log(`   Total de faturas: ${data.length}`)

        if (data.length > 0) {
            console.log('\n🔍 Estrutura da primeira fatura:')
            console.log('================================')
            const firstInvoice = data[0]
            Object.keys(firstInvoice).forEach(key => {
                console.log(`   ${key}: ${typeof firstInvoice[key]} = ${firstInvoice[key]}`)
            })
        }

    } else {
        const errorText = await response.text()
        console.log(`❌ Erro: ${errorText}`)
    }

} catch (error) {
    console.log(`❌ Erro: ${error.message}`)
}

console.log('\n🚀 Teste concluído!')
