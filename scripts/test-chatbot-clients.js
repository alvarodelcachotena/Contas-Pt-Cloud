#!/usr/bin/env node

/**
 * Script para testar especificamente a pergunta sobre clientes
 */

import 'dotenv/config';

async function testChatbotClients() {
    console.log('🧪 Testando Chatbot sobre Clientes...\n');

    const testMessage = "¿Cuántos clientes tengo actualmente? Dame el número exacto.";

    try {
        console.log('📤 Enviando mensagem para o chatbot...');
        console.log(`   Mensagem: "${testMessage}"`);
        console.log('   URL: http://localhost:5000/api/ai-chat');

        const response = await fetch('http://localhost:5000/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: testMessage
            })
        });

        console.log(`\n📥 Resposta recebida:`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Status Text: ${response.statusText}`);

        const data = await response.json();

        console.log('\n📊 Dados da resposta:');
        console.log('=====================');

        if (data.success) {
            console.log('✅ Sucesso!');
            console.log(`   Modelo usado: ${data.usedModel || 'N/A'}`);
            console.log(`   Fallback usado: ${data.fallbackUsed || false}`);

            // Verificar se há dados RAG
            if (data.businessData) {
                console.log('\n📈 Dados RAG obtidos:');
                console.log('========================');
                console.log(`   Total Faturas: ${data.businessData.stats?.total_invoices || 0}`);
                console.log(`   Total Clientes: ${data.businessData.stats?.total_clients || 0}`);
                console.log(`   Total Despesas: ${data.businessData.stats?.total_expenses || 0}`);
                console.log(`   Receita: €${data.businessData.stats?.total_revenue || 0}`);
                console.log(`   Lucro: €${data.businessData.stats?.profit || 0}`);
            }

            // Mostrar resposta completa da IA
            console.log('\n🤖 Resposta completa da IA:');
            console.log('============================');
            console.log(data.response);

        } else {
            console.log('❌ Erro na API:');
            console.log(`   Tipo de erro: ${data.errorType || 'N/A'}`);
            console.log(`   Mensagem: ${data.error || 'N/A'}`);
        }

    } catch (error) {
        console.log('❌ Erro ao testar API:');
        console.log(`   Mensagem: ${error.message}`);
    }

    console.log('\n🚀 Teste concluído!');
}

// Executar teste
testChatbotClients().catch(console.error);
