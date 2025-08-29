#!/usr/bin/env node

/**
 * Script para testar com NIF completamente novo
 */

import 'dotenv/config';

async function testCreateClientNewNif() {
    console.log('🧪 Testando Criação com NIF Completamente Novo...\n');

    const testMessage = "Criar cliente: nome Pedro Alves, email pedro@alves.pt, nif 111222333, telefone +351934567890, endereço Rua do Comércio 789, Braga";

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

            // Verificar se o cliente foi criado
            if (data.clientCreated) {
                console.log('\n🎉 CLIENTE CRIADO AUTOMATICAMENTE!');
                console.log('=====================================');
                console.log(`   Nome: ${data.clientCreated.name}`);
                console.log(`   Email: ${data.clientCreated.email}`);
                console.log(`   NIF: ${data.clientCreated.nif}`);
                console.log(`   Mensagem: ${data.clientCreated.message}`);
            } else {
                console.log('\n⚠️ Cliente não foi criado automaticamente');
                console.log('   Verificando se a mensagem foi detectada como solicitação de criação...');
            }

            // Mostrar resposta da IA
            console.log('\n🤖 Resposta da IA:');
            console.log('==================');
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
testCreateClientNewNif().catch(console.error);
