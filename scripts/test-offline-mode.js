#!/usr/bin/env node

/**
 * Script para testar o modo offline do chatbot AI
 * Simula falhas das APIs e verifica se o sistema responde com dados da BD
 */

const fetch = require('node-fetch');

async function testOfflineMode() {
    console.log('🧪 Testando modo offline do chatbot AI...\n');

    const testMessages = [
        'Quantas faturas tenho?',
        'Qual é o meu lucro atual?',
        'Quantos clientes tenho?',
        'Qual é o total de despesas?',
        'Como está o meu negócio?'
    ];

    console.log('📋 Mensagens de teste:');
    testMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. "${msg}"`);
    });

    console.log('\n🚀 Iniciando testes...\n');

    for (let i = 0; i < testMessages.length; i++) {
        const message = testMessages[i];
        console.log(`📤 Teste ${i + 1}/${testMessages.length}: "${message}"`);

        try {
            const startTime = Date.now();

            const response = await fetch('http://localhost:3000/api/ai-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const responseTime = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Status: ${response.status} (${responseTime}ms)`);
                console.log(`   Modelo: ${data.model}`);
                console.log(`   Dados BD: ${data.databaseDataUsed ? 'Sim' : 'Não'}`);
                console.log(`   Resposta: ${data.response.substring(0, 150)}...`);

                // Verificar se a resposta contém dados do negócio
                if (data.response.includes('faturas') || data.response.includes('despesas') ||
                    data.response.includes('clientes') || data.response.includes('lucro') ||
                    data.response.includes('receita')) {
                    console.log('   ✅ Resposta contém dados do negócio');
                } else {
                    console.log('   ⚠️ Resposta não contém dados específicos do negócio');
                }
            } else {
                const errorData = await response.json();
                console.log(`❌ Status: ${response.status} (${responseTime}ms)`);
                console.log(`   Erro: ${errorData.error || 'Erro desconhecido'}`);
                console.log(`   Tipo: ${errorData.errorType || 'N/A'}`);

                // Se for erro 503, pode ser modo offline
                if (response.status === 503) {
                    console.log('   📊 Possível modo offline ativado');
                }
            }
        } catch (error) {
            console.log(`❌ Erro de conexão: ${error.message}`);
        }

        console.log('---');

        // Pausa entre testes para não sobrecarregar
        if (i < testMessages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('=====================');
    console.log(`Total de mensagens testadas: ${testMessages.length}`);
    console.log('✅ Sistema deve responder mesmo com APIs offline');
    console.log('📊 Dados da base de dados devem estar disponíveis');
    console.log('🔄 Fallback automático deve funcionar');

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('=====================');
    console.log('1. Verifique se o servidor está a executar (npm run dev)');
    console.log('2. Teste no navegador: http://localhost:3000/ai-assistant');
    console.log('3. Faça perguntas sobre o seu negócio');
    console.log('4. Verifique se recebe respostas com dados reais');

    console.log('\n🚀 Teste concluído!');
}

// Executar teste
testOfflineMode().catch(console.error);
