#!/usr/bin/env node

/**
 * Script final para testar o chatbot completo
 */

import 'dotenv/config';

async function testChatbotFinal() {
    console.log('🧪 Testando Chatbot Completo...\n');

    const testMessages = [
        "Dime cuántas facturas tengo",
        "¿Cuál es mi lucro actual?",
        "¿Cuántos clientes tengo?",
        "Dame un resumen de mi negocio"
    ];

    for (let i = 0; i < testMessages.length; i++) {
        const message = testMessages[i];
        console.log(`📝 Teste ${i + 1}: "${message}"`);
        console.log('='.repeat(50));

        try {
            const response = await fetch('http://localhost:5000/api/ai-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Sucesso!');
                console.log(`   Modelo usado: ${data.usedModel || 'N/A'}`);
                console.log(`   Fallback usado: ${data.fallbackUsed || false}`);

                // Verificar si hay datos RAG reales
                if (data.businessData) {
                    console.log('\n📊 Dados RAG obtidos:');
                    console.log(`   • Faturas: ${data.businessData.stats?.total_invoices || 0}`);
                    console.log(`   • Clientes: ${data.businessData.stats?.total_clients || 0}`);
                    console.log(`   • Receita: €${data.businessData.stats?.total_revenue || 0}`);
                    console.log(`   • Lucro: €${data.businessData.stats?.profit || 0}`);
                }

                // Mostrar respuesta de la IA
                console.log('\n🤖 Resposta da IA:');
                console.log(data.response.substring(0, 200) + '...');

            } else {
                console.log('❌ Erro na API:');
                console.log(`   Tipo: ${data.errorType || 'N/A'}`);
                console.log(`   Mensagem: ${data.error || 'N/A'}`);
            }

        } catch (error) {
            console.log('❌ Erro ao testar:');
            console.log(`   Mensagem: ${error.message}`);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Esperar un poco entre pruebas
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('🚀 Teste final concluído!');
    console.log('\n💡 RESULTADO:');
    console.log('Se todas as respostas mostraram dados reais (2 faturas, 2 clientes),');
    console.log('o chatbot está funcionando perfeitamente!');
}

// Executar teste
testChatbotFinal().catch(console.error);
