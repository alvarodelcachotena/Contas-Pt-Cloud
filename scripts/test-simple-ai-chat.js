#!/usr/bin/env node

/**
 * Script de teste simples para o endpoint de chat AI
 */

const fetch = require('node-fetch');

async function testAIChat() {
    console.log('🧪 Testando endpoint de chat AI...\n');

    const testMessages = [
        'Quantas faturas tenho?',
        'Qual é o meu lucro atual?',
        'Quantos clientes tenho?',
        'Qual é o total de despesas?'
    ];

    for (const message of testMessages) {
        console.log(`📤 Testando: "${message}"`);

        try {
            const response = await fetch('http://localhost:3000/api/ai-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Status: ${response.status}`);
                console.log(`   Modelo: ${data.model}`);
                console.log(`   Dados BD: ${data.databaseDataUsed ? 'Sim' : 'Não'}`);
                console.log(`   Resposta: ${data.response.substring(0, 100)}...`);
            } else {
                const errorData = await response.json();
                console.log(`❌ Status: ${response.status}`);
                console.log(`   Erro: ${errorData.error || 'Erro desconhecido'}`);
                console.log(`   Tipo: ${errorData.errorType || 'N/A'}`);
            }
        } catch (error) {
            console.log(`❌ Erro de conexão: ${error.message}`);
        }

        console.log('---');
    }
}

// Executar teste
testAIChat().catch(console.error);
