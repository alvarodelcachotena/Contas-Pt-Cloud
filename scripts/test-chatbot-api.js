#!/usr/bin/env node

/**
 * Script para testar a API do chatbot
 */

import 'dotenv/config';

async function testChatbotAPI() {
    console.log('🧪 Testando API do Chatbot...\n');

    const testMessage = "Dime cuántas facturas tengo en mi negocio";

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
            console.log(`   Resposta da IA: ${data.response}`);
            console.log(`   Modelo usado: ${data.usedModel || 'N/A'}`);
            console.log(`   Fallback usado: ${data.fallbackUsed || false}`);
        } else {
            console.log('❌ Erro na API:');
            console.log(`   Tipo de erro: ${data.errorType || 'N/A'}`);
            console.log(`   Mensagem: ${data.error || 'N/A'}`);
            console.log(`   Detalhes: ${data.details || 'N/A'}`);
        }

        // Verificar se há dados RAG
        if (data.businessData) {
            console.log('\n📈 Dados RAG recebidos:');
            console.log('========================');
            console.log(`   Total Faturas: ${data.businessData.stats?.total_invoices || 0}`);
            console.log(`   Total Despesas: ${data.businessData.stats?.total_expenses || 0}`);
            console.log(`   Total Clientes: ${data.businessData.stats?.total_clients || 0}`);
            console.log(`   Receita: €${data.businessData.stats?.total_revenue || 0}`);
            console.log(`   Lucro: €${data.businessData.stats?.profit || 0}`);
        }

    } catch (error) {
        console.log('❌ Erro ao testar API:');
        console.log(`   Mensagem: ${error.message}`);

        if (error.code === 'ECONNREFUSED') {
            console.log('   🔧 PROBLEMA: Servidor não está rodando');
            console.log('   SOLUÇÃO: Execute "npm run next:dev"');
        } else if (error.code === 'ENOTFOUND') {
            console.log('   🔧 PROBLEMA: Não foi possível conectar ao servidor');
            console.log('   SOLUÇÃO: Verifique se o servidor está rodando na porta 5000');
        }
    }

    console.log('\n🚀 Teste da API concluído!');
}

// Executar teste
testChatbotAPI().catch(console.error);
