#!/usr/bin/env node

/**
 * Script para testar a API de clientes
 */

import 'dotenv/config';

async function testClientsAPI() {
    console.log('🧪 Testando API de Clientes...\n');

    try {
        console.log('📤 Fazendo requisição para /api/clients...');

        const response = await fetch('http://localhost:5000/api/clients', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log(`📥 Resposta recebida:`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Status Text: ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('\n📊 Dados recebidos:');
            console.log('==================');
            console.log(`   Total de clientes: ${data.length || 0}`);

            if (data && data.length > 0) {
                console.log('\n👥 Clientes encontrados:');
                data.forEach((client, index) => {
                    console.log(`   ${index + 1}. ${client.name || 'Sem nome'} (${client.email || 'Sem email'})`);
                });
            }
        } else {
            console.log('❌ Erro na API');
            const errorData = await response.text();
            console.log(`   Erro: ${errorData}`);
        }

    } catch (error) {
        console.log('❌ Erro ao testar API:');
        console.log(`   Mensagem: ${error.message}`);
    }

    console.log('\n🚀 Teste concluído!');
}

// Executar teste
testClientsAPI().catch(console.error);
